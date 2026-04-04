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
H: Confianza_Extraccion_IA (%)
I: Estado_Validacion_IA
J: Aprobado_Por
K: Fecha_Aprobacion
L: Centro_Costo
M: Observaciones
N: Fecha_Carga_Sistema
O: Ciudad
```

**Example Data Rows:**

```
UUID-123 | 123.456.789-1 | Distribuidor Dental X | 2026-04-01 | FAC-001234 | insumos odontologicos | 350000 | 94% | aprobado | accounting_001 | 2026-04-01 10:00 | operaciones | - | 2026-04-01 09:30 | Pasto
UUID-124 | 987.654.321-5 | Equipos Médicos Y | 2026-04-02 | INV-5678 | equipos | 1200000 | 91% | aprobado | accounting_001 | 2026-04-02 11:15 | capital | Inversión en equipo de radiografía | 2026-04-02 10:45 | Pasto
UUID-456 | [MANUAL ENTRY] | Proveedor Desconocido | 2026-03-31 | MANUAL | servicios profesionales | [CORREGIDO A 450000] | 53% | aprobado_con_correcciones | manager_002 | 2026-04-01 14:30 | operaciones | NIT ilegible, cantidad y concepto corregidos manualmente | 2026-04-01 08:00 | Pasto
```

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