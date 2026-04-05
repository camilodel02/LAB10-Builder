# LAB10-Builder

Monorepo para el MVP **Dental Clinic Expense Extraction** (brief en `Herramientas_IA/1_templates/`).

## Estructura

```text
apps/
  app/          # React + Vite + Tailwind (frontend)
  api/          # FastAPI — paquete Python `lab10_api` (`app/` dominio, `api/` HTTP)
packages/       # Librerías compartidas (vacío por ahora; ver `packages/README.md`)
Herramientas_IA/  # Brief, review, reglas y skills
```

## Requisitos

- Node.js 20+ y npm
- Python 3.11+

## Setup

```powershell
# Raíz: dependencias JS de todas las apps
npm install

# API (una vez por máquina)
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cd ../..
```

Para `npm run dev:api` sin activar el venv, necesitas que `python` en PATH tenga instalado `fastapi`, `uvicorn` y `pytest` (por ejemplo el mismo venv globalmente no recomendado); lo habitual es activar `.venv` y usar `pytest` / `uvicorn` desde `apps/api`.

## Scripts (desde la raíz)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | API + Vite en paralelo (asegúrate de tener Python deps instaladas). |
| `npm run dev:app` | Solo frontend (`:5173`). |
| `npm run dev:api` | Solo API (`:8000`). |
| `npm test` | Vitest (app) + pytest (api). |
| `npm run supabase:gen` | Placeholder hasta conectar Supabase CLI. |

## Tests

- **API:** `apps/api/tests/unit/` — pytest; `pythonpath` incluye `src` vía `pyproject.toml`.
- **App:** `apps/app/src/**/*.test.ts(x)` — Vitest + jsdom; setup en `src/test/setup.ts`.
