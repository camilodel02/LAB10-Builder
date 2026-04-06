"""Recibos, registros de gasto, export Excel — Supabase + Storage."""

from __future__ import annotations

import mimetypes
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse

from lab10_api.api.deps import SupabaseDep, UserIdDep
from lab10_api.core.config import get_settings
from lab10_api.schemas.expenses import (
    ExtractionPayload,
    ExpenseRecordApprove,
    ExpenseRecordRead,
    ReceiptUploadResponse,
)
from lab10_api.services.excel_export import build_expense_workbook

router = APIRouter()

_ALLOWED_TYPES = frozenset(
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
    }
)


def _ext_for_content_type(ct: str) -> str:
    if ct == "application/pdf":
        return ".pdf"
    if ct == "image/jpeg":
        return ".jpg"
    if ct == "image/png":
        return ".png"
    if ct == "image/webp":
        return ".webp"
    return ""


def _avg_confidence(payload: ExtractionPayload) -> float | None:
    vals: list[float] = []
    for v in (
        payload.nit_confidence,
        payload.ciudad_confidence,
        payload.date_confidence,
        payload.amount_confidence,
        payload.concept_confidence,
    ):
        if v is not None:
            fv = float(v)
            vals.append(fv * 100 if fv <= 1 else fv)
    if not vals:
        return None
    return round(sum(vals) / len(vals), 2)


async def _receipt_ids_for_user(supabase: Any, user_id: UUID) -> list[str]:
    res = supabase.table("expense_receipts").select("id").eq("uploaded_by", str(user_id)).execute()
    return [r["id"] for r in (res.data or [])]


@router.post("/receipts/upload", response_model=ReceiptUploadResponse)
async def upload_receipt(
    supabase: SupabaseDep,
    user_id: UserIdDep,
    file: UploadFile = File(...),
) -> ReceiptUploadResponse:
    raw = await file.read()
    if not raw:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Archivo vacío")

    ct = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
    if ct not in _ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Tipo no permitido: {ct}. Use PDF, JPEG, PNG o WEBP.",
        )

    settings = get_settings()
    receipt_id = uuid4()
    ext = _ext_for_content_type(ct) or ""
    storage_path = f"{user_id}/{receipt_id}/receipt{ext}"

    try:
        supabase.storage.from_(settings.supabase_receipts_bucket).upload(
            storage_path,
            raw,
            file_options={"content-type": ct},
        )
    except Exception as e:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Error subiendo a Storage: {e!s}",
        ) from e

    row = {
        "id": str(receipt_id),
        "uploaded_by": str(user_id),
        "storage_bucket": settings.supabase_receipts_bucket,
        "storage_path": storage_path,
        "original_filename": file.filename or "upload",
        "content_type": ct,
        "byte_size": len(raw),
        "pipeline_status": "uploaded",
    }
    try:
        supabase.table("expense_receipts").insert(row).execute()
    except Exception as e:
        try:
            supabase.storage.from_(settings.supabase_receipts_bucket).remove([storage_path])
        except Exception:
            pass
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Error insertando recibo: {e!s}",
        ) from e

    return ReceiptUploadResponse(
        receipt_id=receipt_id,
        storage_path=storage_path,
        pipeline_status="uploaded",
    )


@router.post("/receipts/{receipt_id}/extract", response_model=ExpenseRecordRead)
async def apply_extraction(
    receipt_id: UUID,
    supabase: SupabaseDep,
    user_id: UserIdDep,
    payload: ExtractionPayload,
) -> ExpenseRecordRead:
    r = (
        supabase.table("expense_receipts")
        .select("id,uploaded_by")
        .eq("id", str(receipt_id))
        .limit(1)
        .execute()
    )
    if not r.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recibo no encontrado")
    if r.data[0]["uploaded_by"] != str(user_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No es el dueño del recibo")

    concept = payload.concept or "otros"
    avg = _avg_confidence(payload)
    estado_ia = "pendiente"
    approval = "pending_review"
    if payload.extraction_status and payload.extraction_status != "success":
        estado_ia = "rechazado"
        approval = "rejected"

    record_row: dict[str, Any] = {
        "receipt_id": str(receipt_id),
        "nit_proveedor": payload.nit,
        "razon_social": payload.vendor_name,
        "fecha_emision": payload.fecha_emision_extract.isoformat()
        if payload.fecha_emision_extract
        else None,
        "numero_factura": payload.numero_factura,
        "concepto_gasto": concept,
        "monto_cop": float(payload.amount_cop) if payload.amount_cop is not None else None,
        "monto_cop_letras": None,
        "confianza_extraccion_ia": avg,
        "estado_validacion_ia": estado_ia,
        "approval_status": approval,
        "ciudad": payload.ciudad,
        "extraction_payload": payload.model_dump(mode="json"),
    }

    supabase.table("expense_receipts").update({"pipeline_status": "extracting"}).eq(
        "id", str(receipt_id)
    ).execute()

    existing = (
        supabase.table("expense_records")
        .select("id")
        .eq("receipt_id", str(receipt_id))
        .execute()
    )
    try:
        if existing.data:
            rid = existing.data[0]["id"]
            supabase.table("expense_records").update(record_row).eq("id", rid).execute()
            out = supabase.table("expense_records").select("*").eq("id", rid).limit(1).execute()
        else:
            ins = supabase.table("expense_records").insert(record_row).execute()
            if not ins.data:
                raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Insert sin datos")
            new_id = ins.data[0]["id"]
            out = (
                supabase.table("expense_records")
                .select("*")
                .eq("id", new_id)
                .limit(1)
                .execute()
            )
    except HTTPException:
        raise
    except Exception as e:
        supabase.table("expense_receipts").update({"pipeline_status": "failed"}).eq(
            "id", str(receipt_id)
        ).execute()
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Error guardando extracción: {e!s}",
        ) from e

    if approval == "rejected":
        pipe = "failed"
    else:
        pipe = "needs_review"
    supabase.table("expense_receipts").update({"pipeline_status": pipe}).eq(
        "id", str(receipt_id)
    ).execute()

    if not out.data:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "No se pudo leer el registro")
    return ExpenseRecordRead.model_validate(out.data[0])


@router.get("/expense-records", response_model=list[ExpenseRecordRead])
async def list_expense_records(
    supabase: SupabaseDep,
    user_id: UserIdDep,
    approval_status: str | None = Query(None),
    include_pending: bool = Query(True),
) -> list[ExpenseRecordRead]:
    ids = await _receipt_ids_for_user(supabase, user_id)
    if not ids:
        return []

    res = supabase.table("expense_records").select("*").in_("receipt_id", ids).execute()
    out: list[ExpenseRecordRead] = []
    for rec in res.data or []:
        if approval_status and rec.get("approval_status") != approval_status:
            continue
        if not include_pending and rec.get("approval_status") == "pending_review":
            continue
        out.append(ExpenseRecordRead.model_validate(rec))
    return out


@router.patch("/expense-records/{record_id}", response_model=ExpenseRecordRead)
async def approve_or_update_record(
    record_id: UUID,
    body: ExpenseRecordApprove,
    supabase: SupabaseDep,
    user_id: UserIdDep,
) -> ExpenseRecordRead:
    row = (
        supabase.table("expense_records")
        .select("id,receipt_id")
        .eq("id", str(record_id))
        .limit(1)
        .execute()
    )
    if not row.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro no encontrado")

    receipt_id = row.data[0]["receipt_id"]
    rchk = (
        supabase.table("expense_receipts")
        .select("id,uploaded_by")
        .eq("id", str(receipt_id))
        .limit(1)
        .execute()
    )
    if not rchk.data or rchk.data[0]["uploaded_by"] != str(user_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No autorizado")

    update: dict[str, Any] = {
        "approval_status": body.approval_status,
        "aprobado_por": str(user_id),
        "fecha_aprobacion": datetime.now(timezone.utc).isoformat(),
    }
    if body.estado_validacion_ia is not None:
        update["estado_validacion_ia"] = body.estado_validacion_ia
    elif body.approval_status == "approved":
        update["estado_validacion_ia"] = "aprobado"
    elif body.approval_status == "rejected":
        update["estado_validacion_ia"] = "rechazado"

    for field, key in [
        ("nit_proveedor", body.nit_proveedor),
        ("razon_social", body.razon_social),
        ("fecha_emision", body.fecha_emision),
        ("numero_factura", body.numero_factura),
        ("concepto_gasto", body.concepto_gasto),
        ("monto_cop", body.monto_cop),
        ("monto_cop_letras", body.monto_cop_letras),
        ("centro_costo", body.centro_costo),
        ("observaciones", body.observaciones),
        ("ciudad", body.ciudad),
    ]:
        if key is not None:
            if field == "fecha_emision" and hasattr(key, "isoformat"):
                update[field] = key.isoformat()
            elif field == "monto_cop" and isinstance(key, Decimal):
                update[field] = float(key)
            else:
                update[field] = key

    supabase.table("expense_records").update(update).eq("id", str(record_id)).execute()

    pipe = "approved" if body.approval_status == "approved" else "rejected"
    supabase.table("expense_receipts").update({"pipeline_status": pipe}).eq(
        "id", str(receipt_id)
    ).execute()

    out = (
        supabase.table("expense_records")
        .select("*")
        .eq("id", str(record_id))
        .limit(1)
        .execute()
    )
    if not out.data:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "No se pudo leer el registro")
    return ExpenseRecordRead.model_validate(out.data[0])


@router.get("/export/excel")
async def export_excel(
    supabase: SupabaseDep,
    user_id: UserIdDep,
    filter_from: str | None = Query(None, description="YYYY-MM-DD"),
    filter_to: str | None = Query(None, description="YYYY-MM-DD"),
) -> StreamingResponse:
    ids = await _receipt_ids_for_user(supabase, user_id)
    if not ids:
        rows: list[dict[str, Any]] = []
    else:
        res = (
            supabase.table("expense_records")
            .select("*")
            .in_("receipt_id", ids)
            .eq("approval_status", "approved")
            .execute()
        )
        rows = []
        for rec in res.data or []:
            fe = rec.get("fecha_emision")
            if filter_from and fe and str(fe) < filter_from:
                continue
            if filter_to and fe and str(fe) > filter_to:
                continue
            rows.append(rec)

    body_bytes = build_expense_workbook(rows)

    log = {
        "requested_by": str(user_id),
        "filter_from": filter_from,
        "filter_to": filter_to,
        "row_count": len(rows),
        "filter_jsonb": {"filter_from": filter_from, "filter_to": filter_to},
    }
    try:
        supabase.table("excel_exports").insert(log).execute()
    except Exception:
        pass

    return StreamingResponse(
        iter([body_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="gastos_consolidados.xlsx"',
        },
    )
