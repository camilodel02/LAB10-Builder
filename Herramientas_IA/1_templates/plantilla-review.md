# Code Review Protocol for AI-Generated Code
## Dental Clinic Expense Extraction

## Introduction
Specific checklist for reviewing receipt data extraction code before merge. Focus: prevent AI hallucinations, data validation, and security.

---

## Critical Checklist (8 points)

### 1. Imports and dependencies
- Key question: Do these APIs actually exist? Compatible versions?
- Check:
  - LangChain version and available modules (`langchain.chat_models`, `langchain.callbacks`, etc.)
  - OpenAI API key handling (not hardcoded)
  - Openpyxl, FastAPI, PostgreSQL drivers
  - Pytest fixtures if tests exist
- **Risk**: Hallucinated library or method names that don't exist

---

### 2. Data extraction (the core)
- Key question: Does the GPT-4 prompt enforce expected data structures?
- Check:
  - Explicit JSON response schema (nit, date, amount_cop, concept, confidence scores)
  - Confidence scores as 0-100% or 0-1? (brief requires 0-100%)
  - If confidence < 0.60 -> return error message, NOT hallucination
  - Format validations:
    - **NIT**: Colombian format (e.g.: 123.456.789-1)
    - **Date**: YYYY-MM-DD
    - **Amount**: COP only, positive, reasonable (<100M COP?)
    - **Concept**: enum only (insumos_odontologicos, servicios_profesionales, equipos, otros)
- **Risk**: Model invents fields or accepts invalid values

---

### 3. Security and sensitive data
- Key question: Are credentials or customer data exposed?
- Check:
  - OpenAI API key in environment variables, never in code/logs
  - PDFs/images deleted after processing? Where are they stored?
  - Logs do NOT include NITs, vendor names, or amounts
  - DB access requires authentication
  - Validation that only accounting staff can access the dashboard
- **Risk**: Sensitive customer data or credential leakage

---

### 4. Complete workflow aligned with brief
- Key question: Are all 4 steps respected (Upload -> Extract -> Review -> Export)?
- Check:
  - Upload: accepts PDF and images (JPG/PNG)
  - Extract: returns JSON with confidence scores
  - Review: dashboard shows data + option to approve/edit/reject
  - If confidence > 80% -> pre-marked as "ready"
  - If confidence < 80% -> marked for manual review
  - Export: generates Excel with exact brief structure (columns A-P)
- **Risk**: Skipped steps, auto-approved without review

---

### 5. Excel structure validation
- Key question: Does the Excel file have EXACTLY the columns from the brief?
- Check columns (A-P):
  - A: Comprobante No. | B: NIT_Proveedor | C: Razon_Social
  - D: Fecha_Emision | E: Numero_Factura | F: Concepto_Gasto
  - G: Monto_COP | H: Monto_COP_Letras | I: Confianza_Extraccion_IA (%)
  - J: Estado_Validacion_IA | K: Aprobado_Por | L: Fecha_Aprobacion
  - M: Centro_Costo | N: Observaciones | O: Fecha_Carga_Sistema | P: Ciudad
  - Amount format: numbers without symbols, decimals if applicable
  - Amounts in words: correct Spanish (e.g.: "Trescientos cincuenta mil pesos COP")
  - Dates: YYYY-MM-DD
  - Status: valid enum (aprobado, aprobado_con_correcciones, rechazado)
- **Risk**: Excel not usable by staff, columns incorrectly mapped

---

### 6. Error handling (no hallucinations)
- Key question: What happens when the model CANNOT read something?
- Check:
  - If NIT not readable -> message: "NIT not readable on receipt"
  - If amount ambiguous -> message: "Amount unclear, requires manual review"
  - If concept doesn't match -> returns "otros" + flag for manual dropdown
  - Confidence score < 0.60 in any field -> explicit error, NOT guess
  - User sees what specifically failed, not generic "error"
- **Risk**: AI invents data instead of saying it couldn't read it

---

### 7. Tests and validations
- Key question: Are there tests validating edge cases?
- Check:
  - Test: Corrupted PDF -> clear error
  - Test: Image with unreadable NIT -> returns "confidence: 0.45" with no value
  - Test: Amount in USD instead of COP -> rejects or flags for conversion?
  - Test: Invalid date (2026-13-45) -> error
  - Test: Concept outside enum -> "otros" + manual flag
  - Test: Export generates valid Excel with all columns
  - All tests pass locally
- **Risk**: Code fails in production with real data

---

### 8. Stack-specific point (FastAPI + PostgreSQL)
- Key question: Is the expected architecture followed?
- Check:
  - FastAPI endpoints: `/upload`, `/extract`, `/review`, `/export`
  - Each endpoint returns valid JSON
  - DB stores: receipt_id, extracted_data (JSON), status, approver info, timestamps
  - No SQL injection (parameterized queries)
  - Performance: process 1 receipt < 30 seconds (brief requirement)
  - Auditable logs: who approved what and when
- **Risk**: Data doesn't persist, endpoint slow, SQL injection vulnerable

---

## Review Procedure

1. **Code diff**: `git diff` to see exact changes
2. **Local tests**: `pytest` must pass 100%
3. **Manual validation**:
   - Upload a test receipt (PDF + image)
   - Verify extraction JSON is correct
   - Verify exported Excel has all columns
4. **Documentation**: Verify clear comments in critical functions
5. **Checklist**: Mark each point with ✅ or ❌ + action if failed

---

## Approval Criteria

- **Green** (merge): All 8 points ✅
- **Yellow** (merge with caution): 7 points ✅ + documented risk mitigation
- **Red** (no merge): < 7 points ✅ or hallucination detected

## Action if a point fails
- Comment: "Point [N] fails: [description]"
- Indicate: "Requires: [specific fix]"
- Request changes until green

---

## Special Notes

- **Hallucinations**: #1 AI risk. If unsure, model must say "I don't know", not invent.
- **Confidence < 60%**: Automatically invalidates that entire field.
- **Amount in words**: Validate correct Spanish (not "trescientas" for masculine, etc.)
- **Timestamps**: All actions require timestamp and user who performed it.
