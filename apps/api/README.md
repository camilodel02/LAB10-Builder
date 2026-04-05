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
