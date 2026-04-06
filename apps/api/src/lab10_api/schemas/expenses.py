from __future__ import annotations

import datetime as dt
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ConceptoGasto = Literal[
    "insumos odontologicos",
    "servicios profesionales",
    "equipos",
    "otros",
]
EstadoValidacion = Literal["pendiente", "aprobado", "aprobado_con_correcciones", "rechazado"]
ApprovalStatus = Literal["pending_review", "approved", "rejected"]
PipelineStatus = Literal[
    "uploaded",
    "extracting",
    "extracted",
    "needs_review",
    "approved",
    "rejected",
    "failed",
]


class ExtractionPayload(BaseModel):
    """Payload alineado al brief (etapa post-IA)."""

    model_config = ConfigDict(populate_by_name=True)

    nit: str | None = None
    nit_confidence: float | None = None
    ciudad: str | None = None
    ciudad_confidence: float | None = None
    fecha_emision_extract: dt.date | None = Field(default=None, alias="date")
    date_confidence: float | None = None
    amount_cop: Decimal | None = None
    amount_confidence: float | None = None
    concept: ConceptoGasto | None = None
    concept_confidence: float | None = None
    vendor_name: str | None = None
    numero_factura: str | None = None
    extraction_status: str | None = "success"


class ReceiptUploadResponse(BaseModel):
    receipt_id: UUID
    storage_path: str
    pipeline_status: PipelineStatus


class ExpenseRecordRead(BaseModel):
    id: UUID
    receipt_id: UUID
    nit_proveedor: str | None
    razon_social: str | None
    fecha_emision: dt.date | None
    numero_factura: str | None
    concepto_gasto: ConceptoGasto
    monto_cop: Decimal | None
    monto_cop_letras: str | None
    confianza_extraccion_ia: float | None
    estado_validacion_ia: EstadoValidacion
    aprobado_por: UUID | None
    fecha_aprobacion: dt.datetime | None
    centro_costo: str | None
    observaciones: str | None
    ciudad: str | None
    fecha_carga_sistema: dt.datetime
    approval_status: ApprovalStatus
    extraction_payload: dict[str, Any] | None = None


class ExpenseRecordApprove(BaseModel):
    approval_status: Literal["approved", "rejected"]
    estado_validacion_ia: EstadoValidacion | None = None
    nit_proveedor: str | None = None
    razon_social: str | None = None
    fecha_emision: dt.date | None = None
    numero_factura: str | None = None
    concepto_gasto: ConceptoGasto | None = None
    monto_cop: Decimal | None = None
    monto_cop_letras: str | None = None
    centro_costo: str | None = None
    observaciones: str | None = None
    ciudad: str | None = None


class ExcelExportQuery(BaseModel):
    filter_from: dt.date | None = None
    filter_to: dt.date | None = None
