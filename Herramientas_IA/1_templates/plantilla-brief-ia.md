# Dental Clinic Expense Extraction — Technical Brief

## 1. Task Title  
Automated extraction of expense data from receipts (PDFs/images) to reduce manual data entry for accounting staff.

---

## 2. Context  

Dental clinic accounting staff manually enters expense data from receipts into spreadsheets. This is slow and error-prone.

**Current process:**
1. Receive receipt (PDF or photo)
2. Manually read: vendor, date, amount, what was bought
3. Type into spreadsheet
4. Someone reviews it
5. Export to Excel

**Goal:** Automate steps 1-3 so staff only needs to review and approve.

**What we're extracting:**
- NIT (vendor tax ID)
- Date issued
- Amount in COP
- What was purchased (concept/category)

---

## 3. Technical Requirements

### Stack (Keep It Simple)
- **Python 3.11** (backend)
- **FastAPI** (simple web API)
- **LangChain + OpenAI GPT-4** (extract data from images/PDFs)
- **PostgreSQL** (store extracted data)
- **Openpyxl** (generate Excel exports)
- **Pytest** (basic tests)

### What the System Does

**Step 1: Upload Receipt**
- User uploads PDF or image via web form
- System stores the file

**Step 2: Extract Data (AI)**
- LangChain agent reads the receipt
- Uses GPT-4 to find: NIT, date, amount, concept
- Returns: JSON with extracted fields + confidence score (0-100%)

**Step 3: Review & Approve**
- Show extracted data in simple dashboard
- If confident (>80%), mark as ready
- If not confident (<80%), flag for human to fix
- Human can edit and approve
- If AI couldn't read something, show error message (don't guess)

**Step 4: Export**
- Download all approved expenses as Excel file

---

## 4. Inputs & Outputs

### Input
```
Receipt file (PDF or JPG/PNG image)
```

### Output - Stage 1 (After Extraction)
```json
{
  "nit": "123.456.789-1",
  "nit_confidence": 0.92,
  "ciudad": "Pasto",
  "ciudad_confidence": 0.90,
  "date": "2026-04-01",
  "date_confidence": 0.95,
  "amount_cop": 250000,
  "amount_confidence": 0.89,
  "concept": "insumos odontologicos",
  "concept_confidence": 0.85,
  "vendor_name": "Distribuidor Dental XYZ",
  "extraction_status": "success"
}
```

### Output - Stage 2 (After Human Approval)
Same JSON + approval info (who approved, when)

### Output - Stage 3 (Excel Export)
```
Excel file with all approved and validated expense records.

**Excel Column Structure:**

```
A: Comprobante No.
B: NIT_Proveedor
C: Razon_Social
D: Fecha_Emision
E: Numero_Factura
F: Concepto_Gasto
G: Monto_COP
H: Monto_COP_Letras
I: Confianza_Extraccion_IA (%)
J: Estado_Validacion_IA
K: Aprobado_Por
L: Fecha_Aprobacion
M: Centro_Costo
N: Observaciones
O: Fecha_Carga_Sistema
P: Ciudad
```

**Example Data Rows:**

**Registro 1 — Aprobado (Alta confianza IA)**
- Comprobante: UUID-123 | NIT: 123.456.789-1 | Razón Social: Distribuidor Dental X
- Fecha: 2026-04-01 | Factura: FAC-001234 | Concepto: insumos odontologicos
- Monto: $350,000 COP (Trescientos cincuenta mil pesos COP) | Confianza IA: 94% → ✅ Aprobado automáticamente
- Centro Costo: operaciones | Cargado: 2026-04-01 09:30 | Aprobado: 2026-04-01 10:00 por accounting_001

---

**Registro 2 — Aprobado (Alta confianza IA + Observación manual)**
- Comprobante: UUID-124 | NIT: 987.654.321-5 | Razón Social: Equipos Médicos Y
- Fecha: 2026-04-02 | Factura: INV-5678 | Concepto: equipos
- Monto: $1,200,000 COP (Un millón doscientos mil pesos COP) | Confianza IA: 91% → ✅ Aprobado
- Observación: Inversión en equipo de radiografía
- Centro Costo: capital | Cargado: 2026-04-02 10:45 | Aprobado: 2026-04-02 11:15 por accounting_001

---

**Registro 3 — Aprobado con correcciones (Baja confianza IA)**
- Comprobante: UUID-456 | NIT: [MANUAL ENTRY - ilegible] | Razón Social: Proveedor Desconocido
- Fecha: 2026-03-31 | Factura: MANUAL | Concepto: servicios profesionales
- Monto: $450,000 COP (Cuatrocientos cincuenta mil pesos COP) - corregido | Confianza IA: 53% → ⚠️ Manager corrigió manualmente
- Observación: NIT ilegible, cantidad y concepto corregidos manualmente
- Centro Costo: operaciones | Cargado: 2026-04-01 08:00 | Aprobado: 2026-04-01 14:30 por manager_002

---

## 5. Constraints

- **Simple & working** > perfect & complex
- If AI can't read something (confidence < 0.60): show error, don't guess
- All amounts MUST be in COP only
- All dates must be in YYYY-MM-DD format
- Expenses only (no income)
- Support Spanish language

---

## 6. Definition of Done

- [ ] Upload receipt via web form (works for PDF and images)
- [ ] AI extracts the 4 fields (NIT, date, amount, concept)
- [ ] Shows extracted data with confidence scores
- [ ] Human can approve or edit each field
- [ ] Rejected data shows clear error message (e.g., "NIT not readable")
- [ ] Export to Excel works
- [ ] Basic tests pass
- [ ] No hallucinations: if AI unsure, it says so

---

## 7. Acceptable Expense Concepts

Pick ONE of these for each receipt:
- `insumos odontologicos` (supplies, materials)
- `servicios profesionales` (professional services)
- `equipos` (equipment/machinery)
- `otros` (anything else)

If the AI can't match it to one of these, the human picks it from the dropdown.

---

## 8. Success Criteria

- Can process 1 receipt in <30 seconds
- Correctly extracts data 85% of the time
- When it can't extract (15% of time), it clearly says why
- Reduces manual typing time by 70%