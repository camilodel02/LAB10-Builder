---
name: improving-code-format
description: >-
  Aplica Ruff (linter y formateador Python ultrarrápido) para comprobar estilo,
  corregir con --fix y formatear. Incluye instalación con uv/pip, configuración
  en pyproject.toml y errores frecuentes (p. ej. uv ruff). Use cuando el usuario
  pida Ruff, formatear o lintear Python, calidad de código en FastAPI/pyproject,
  o alinear estilo con Black/Flake8/isort.
---

# Improving code format (Ruff)

Herramienta: [astral-sh/ruff](https://github.com/astral-sh/ruff) — linter + formateador en un solo CLI; sustituye buena parte de Flake8, Black, isort, etc. Documentación: [docs.astral.sh/ruff](https://docs.astral.sh/ruff/).

## Ideas clave (resumen)

- **Dos comandos distintos:** `ruff check` (lint) y `ruff format` (formato). No mezclar responsabilidades: el linter por defecto evita reglas que chocan con el formatter.
- **Velocidad y caché:** pensado para ejecutarse en cada guardado, pre-commit o CI sin fricción.
- **Config en cascada:** `pyproject.toml` (`[tool.ruff]`, `[tool.ruff.lint]`, `[tool.ruff.format]`), o `ruff.toml` / `.ruff.toml`; útil en monorepos con jerarquía de carpetas.
- **`--fix`:** muchas reglas se autocorrigen; revisar el diff igual que con cualquier auto-fix.
- **Preview:** `preview = true` en config o `--preview` en CLI activa reglas/comportamientos inestables que pueden cambiar entre versiones.

## Cómo invocar Ruff (no confundir con `uv`)

| Objetivo | Comando típico |
|----------|------------------|
| Lint del directorio actual | `ruff check` |
| Lint con correcciones seguras | `ruff check --fix` |
| Formatear | `ruff format` |
| Sin instalar global (uv) | `uvx ruff check` / `uvx ruff format` |
| Herramienta instalada con uv | `uv tool install ruff` → luego `ruff ...` |
| Dependencia del proyecto | `uv add --dev ruff` → `uv run ruff check` |

**Error frecuente:** `uv ruff` **no existe**. `uv` no tiene subcomando `ruff`. Usar `ruff`, `uvx ruff` o `uv run ruff`.

En Windows, Ruff también tiene [instalador standalone](https://github.com/astral-sh/ruff#installation): `powershell -c "irm https://astral.sh/ruff/install.ps1 | iex"`.

## Flujo recomendado para el agente

1. **Localizar config:** buscar `[tool.ruff]` en `pyproject.toml` o `ruff.toml` en el proyecto o en un padre del paquete.
2. **Alcance:** ejecutar desde la raíz del paquete Python relevante (p. ej. `apps/api`) para que apliquen excludes y `src` layout si están definidos.
3. **Orden práctico:** `ruff format` y después `ruff check` (o `check --fix`), para que el formato estable y el lint no peleen en el mismo paso mental.
4. **CI / equipo:** alinear versión de Ruff en `pyproject.toml` (optional-deps `dev` o grupo dev) o pin en pre-commit / GitHub Action ([ruff-action](https://github.com/astral-sh/ruff-action)).

## Configuración mínima en `pyproject.toml`

Los encabezados bajo `pyproject.toml` van con prefijo `tool.ruff` (p. ej. `[tool.ruff.lint]`, no `[lint]` suelto).

Valores por defecto razonables (referencia; el proyecto puede sobreescribirlos):

- `line-length = 88` (alineado con Black).
- `target-version` acorde al Python soportado (p. ej. `py311`).
- `[tool.ruff.lint] select` / `ignore` según política del equipo.
- `exclude` para `.venv`, `build`, `dist`, etc. (Ruff ya trae una lista amplia por defecto).

Si el usuario pide "como Black/isort", priorizar `ruff format` + reglas de import en lint según [docs de configuración](https://docs.astral.sh/ruff/configuration/).

## Integración habitual

- **pre-commit:** repo [astral-sh/ruff-pre-commit](https://github.com/astral-sh/ruff-pre-commit) con hooks `ruff-check` (y `args: [--fix]`) y `ruff-format`.
- **GitHub Actions:** `astral-sh/ruff-action@v3` en el workflow.
- **Editor:** extensión oficial Ruff para formatear y mostrar diagnósticos en caliente.

## Lo que Ruff no sustituye

- **Tests:** seguir usando pytest (u otro runner); Ruff no ejecuta tests.
- **Tipado estricto:** para análisis de tipos usar mypy, pyright o ty según el proyecto.

## Checklist rápido

- [ ] Comando correcto: `ruff` / `uvx ruff` / `uv run ruff`, nunca `uv ruff`.
- [ ] Respetar `pyproject.toml` / `ruff.toml` del repo.
- [ ] `ruff format` + `ruff check` (y `--fix` solo donde tenga sentido).
- [ ] Diff revisado; no silenciar reglas sin criterio (preferir `ignore` acotado o `per-file-ignores`).

## Referencia externa

- Reglas y categorías: [Rules](https://docs.astral.sh/ruff/rules/) en la documentación oficial.
