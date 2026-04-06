# API (`@lab10/api`)

FastAPI. Paquete instalable `lab10_api` bajo `src/`.

## Estructura

| Ruta | Rol |
|------|-----|
| `src/lab10_api/app/` | Dominio: casos de uso, servicios, reglas (sin HTTP). |
| `src/lab10_api/api/` | Capa HTTP: routers, dependencias, esquemas de entrada/salida. |
| `tests/unit/` | Tests unitarios (pytest). |

## Setup (Windows / PowerShell)

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

Con el venv activo, desde la raíz del repo también puedes usar `npm run dev:api` (usa `PYTHONPATH=src`).

## Comandos

- Desarrollo: `npm run dev` (desde raíz) o `uvicorn lab10_api.main:app --reload --app-dir src`
- Tests: `pytest` desde `apps/api` o `npm run test:api` desde la raíz

## Variables de entorno (Supabase)

Crea `apps/api/.env` o exporta en el sistema:

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto (local o cloud). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (solo servidor; no exponer al front). |
| `LAB10_ALLOW_X_USER_ID` | Opcional. Si es `1` / `true`, acepta la cabecera `X-User-Id` sin JWT (solo scripts o tests locales; no usar desde el navegador). |

Sin estas variables, los endpoints de gastos responden `503`.

## Autenticación (gastos)

- **Recomendado (app web):** `Authorization: Bearer <access_token>` con el JWT de sesión de Supabase Auth (`signInWithPassword`, etc.). El backend valida el token con Supabase y usa el UUID de `auth.users`.
- **Solo desarrollo / herramientas:** con `LAB10_ALLOW_X_USER_ID=1`, también se acepta `X-User-Id: <uuid>` sin Bearer. Si envías Bearer válido y `X-User-Id` distinto, **prevalece el usuario del Bearer**.

## Endpoints de gastos

El usuario debe existir en `auth.users` (crear usuario de prueba en Supabase Auth para pruebas manuales).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/receipts/upload` | Subir PDF/imagen al bucket `receipts` y crear `expense_receipts`. |
| POST | `/api/receipts/{id}/extract` | Cuerpo JSON alineado al brief (`date`, `nit`, `amount_cop`, etc.) → `expense_records`. |
| GET | `/api/expense-records` | Listar registros del usuario; query `approval_status`, `include_pending`. |
| PATCH | `/api/expense-records/{id}` | Aprobar/rechazar y opcionalmente corregir campos. |
| GET | `/api/export/excel` | Descargar `.xlsx` consolidado (solo `approved`); query `filter_from`, `filter_to` (YYYY-MM-DD). |
