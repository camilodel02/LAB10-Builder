-- Dental Clinic Expense Extraction — core tables, RLS, storage bucket (receipts), excel_exports

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.expense_receipts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    storage_bucket text NOT NULL DEFAULT 'receipts',
    storage_path text NOT NULL,
    original_filename text NOT NULL,
    content_type text NOT NULL,
    byte_size bigint NOT NULL CHECK (byte_size >= 0),
    pipeline_status text NOT NULL DEFAULT 'uploaded'
        CHECK (pipeline_status IN (
            'uploaded', 'extracting', 'extracted', 'needs_review',
            'approved', 'rejected', 'failed'
        )),
    extraction_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (storage_bucket, storage_path)
);

CREATE TABLE public.expense_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id uuid NOT NULL REFERENCES public.expense_receipts (id) ON DELETE CASCADE,
    nit_proveedor text,
    razon_social text,
    fecha_emision date,
    numero_factura text,
    concepto_gasto text NOT NULL
        CHECK (concepto_gasto IN (
            'insumos odontologicos',
            'servicios profesionales',
            'equipos',
            'otros'
        )),
    monto_cop numeric(14, 2) CHECK (monto_cop IS NULL OR monto_cop >= 0),
    monto_cop_letras text,
    confianza_extraccion_ia numeric(5, 2)
        CHECK (confianza_extraccion_ia IS NULL OR (confianza_extraccion_ia >= 0 AND confianza_extraccion_ia <= 100)),
    estado_validacion_ia text NOT NULL DEFAULT 'pendiente'
        CHECK (estado_validacion_ia IN (
            'pendiente', 'aprobado', 'aprobado_con_correcciones', 'rechazado'
        )),
    aprobado_por uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    fecha_aprobacion timestamptz,
    centro_costo text,
    observaciones text,
    ciudad text,
    fecha_carga_sistema timestamptz NOT NULL DEFAULT now(),
    extraction_payload jsonb,
    approval_status text NOT NULL DEFAULT 'pending_review'
        CHECK (approval_status IN ('pending_review', 'approved', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (receipt_id)
);

CREATE TABLE public.excel_exports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    filter_from date,
    filter_to date,
    filter_jsonb jsonb,
    row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
    storage_bucket text,
    storage_path text,
    UNIQUE (storage_bucket, storage_path)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX expense_receipts_uploaded_by_created_at_idx
    ON public.expense_receipts (uploaded_by, created_at DESC);
CREATE INDEX expense_receipts_pipeline_status_idx
    ON public.expense_receipts (pipeline_status);

CREATE INDEX expense_records_approval_fecha_aprobacion_idx
    ON public.expense_records (approval_status, fecha_aprobacion DESC NULLS LAST);
CREATE INDEX expense_records_fecha_emision_idx
    ON public.expense_records (fecha_emision);

CREATE INDEX excel_exports_requested_by_created_at_idx
    ON public.excel_exports (requested_by, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER expense_receipts_set_updated_at
    BEFORE UPDATE ON public.expense_receipts
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER expense_records_set_updated_at
    BEFORE UPDATE ON public.expense_records
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security (authenticated + service role bypass)
-- ---------------------------------------------------------------------------

ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_exports ENABLE ROW LEVEL SECURITY;

-- expense_receipts: owner rows
CREATE POLICY expense_receipts_select_own
    ON public.expense_receipts FOR SELECT TO authenticated
    USING (uploaded_by = auth.uid());

CREATE POLICY expense_receipts_insert_own
    ON public.expense_receipts FOR INSERT TO authenticated
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY expense_receipts_update_own
    ON public.expense_receipts FOR UPDATE TO authenticated
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY expense_receipts_delete_own
    ON public.expense_receipts FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid());

-- expense_records: visible if linked receipt is owned by user
CREATE POLICY expense_records_select_own_receipt
    ON public.expense_records FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expense_receipts r
            WHERE r.id = expense_records.receipt_id AND r.uploaded_by = auth.uid()
        )
    );

CREATE POLICY expense_records_update_own_receipt
    ON public.expense_records FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expense_receipts r
            WHERE r.id = expense_records.receipt_id AND r.uploaded_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expense_receipts r
            WHERE r.id = expense_records.receipt_id AND r.uploaded_by = auth.uid()
        )
    );

-- excel_exports: owner of export job
CREATE POLICY excel_exports_select_own
    ON public.excel_exports FOR SELECT TO authenticated
    USING (requested_by = auth.uid());

CREATE POLICY excel_exports_insert_own
    ON public.excel_exports FOR INSERT TO authenticated
    WITH CHECK (requested_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private bucket + policies (objects under first folder = user id)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    false,
    52428800,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY storage_receipts_insert_own_folder
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY storage_receipts_select_own_folder
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY storage_receipts_update_own_folder
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY storage_receipts_delete_own_folder
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
