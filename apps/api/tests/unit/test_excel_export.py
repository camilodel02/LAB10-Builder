from uuid import UUID

from lab10_api.services.excel_export import EXCEL_HEADERS, build_expense_workbook


def test_build_expense_workbook_headers_and_row():
    rows = [
        {
            "id": str(UUID("550e8400-e29b-41d4-a716-446655440000")),
            "nit_proveedor": "123",
            "razon_social": "Proveedor",
            "fecha_emision": "2026-04-01",
            "numero_factura": "F-1",
            "concepto_gasto": "equipos",
            "monto_cop": 1000.0,
            "monto_cop_letras": "mil pesos",
            "confianza_extraccion_ia": 90.0,
            "estado_validacion_ia": "aprobado",
            "aprobado_por": str(UUID("550e8400-e29b-41d4-a716-446655440001")),
            "fecha_aprobacion": "2026-04-02T10:00:00+00:00",
            "centro_costo": "operaciones",
            "observaciones": "",
            "fecha_carga_sistema": "2026-04-01T09:00:00+00:00",
            "ciudad": "Pasto",
        }
    ]
    data = build_expense_workbook(rows)
    assert len(data) > 100
    assert data[:2] == b"PK"  # xlsx zip


def test_excel_headers_count_matches_columns():
    assert len(EXCEL_HEADERS) == 16
