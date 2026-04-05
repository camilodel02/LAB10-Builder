---
name: inspecting-database
description: Inspecciona esquema y datos de solo lectura vía MCP de Supabase (list_tables, execute_sql SELECT, advisors, migraciones listadas). Use cuando el usuario pida ver tablas, esquema, depurar SQL de lectura, estado de migraciones en el proyecto Supabase o documentación; nunca para alterar la base por MCP.
---

# Inspecting database (Supabase MCP, solo lectura)

## Objetivo

Usar el **MCP de Supabase** (servidor configurado en `.cursor/mcp.json`, p. ej. clave `supabase`) para **entender el esquema**, **consultar información** y **depurar** con SQL de lectura. Este flujo es **read-only**: no sustituye migraciones ni cambios persistentes de esquema.

## Regla de oro

- **Cambios de esquema o datos que deban quedar en el repo / historia de BD:** seguir el skill **modifying-database** (`npx supabase migration new`, editar SQL, `npx supabase migration up` / `db reset` en local).
- **Prohibido en este skill:** usar MCP para **DDL**, **DML de escritura** o **aplicar migraciones remotas** como sustituto de ese flujo.

## Herramientas MCP permitidas (inspección)

Invocar vía MCP del servidor Supabase del proyecto. Muchas requieren `project_id`: obtenerlo con `list_projects` / `get_project` si el usuario no lo dio.

| Herramienta | Uso |
|-------------|-----|
| `list_tables` | Tablas por esquema; `verbose: true` para columnas, PKs y FKs. |
| `list_migrations` | Qué migraciones registra el proyecto (solo listar; no aplicar). |
| `list_extensions` | Extensiones instaladas en Postgres. |
| `execute_sql` | **Solo consultas de lectura** (ver sección siguiente). |
| `get_advisors` | Avisos de seguridad o rendimiento (útil tras cambios de esquema, solo lectura de recomendaciones). |
| `search_docs` | Buscar en la documentación de Supabase (GraphQL válido). |
| `get_logs` | Logs para depuración (lectura). |
| `get_project`, `get_project_url`, `list_projects` | Contexto del proyecto / URL. |
| `generate_typescript_types` | Tipos a partir del esquema (salida informativa; no modifica BD por sí misma). |
| `list_edge_functions`, `get_edge_function` | Inspeccionar edge functions existentes. |

## `execute_sql`: solo lectura

La herramienta **ejecuta SQL arbitrario**; el riesgo es escribir en la base. En este skill **solo** se permite:

- `SELECT` (incl. agregados, CTEs de lectura).
- `EXPLAIN` / `EXPLAIN ANALYZE` sobre consultas de lectura.
- Consultas a catálogos: `information_schema`, `pg_catalog` (columnas, tipos, constraints).

**Prohibido vía `execute_sql` en este skill:** `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, `ALTER`, `CREATE`, `GRANT`, `REVOKE`, `COPY ... FROM`, funciones que modifiquen datos, o cualquier SQL que el usuario pretenda dejar como “cambio oficial” (eso va en **migraciones**).

Si el usuario pide “arreglar datos” o “crear tabla”, redirigir a **modifying-database** (y tests según **defining-tdd**).

## Herramientas MCP que no debes usar para “solo inspeccionar”

No invocar para cumplir tareas de este skill (alteran proyecto, ramas, despliegue o esquema vía API):

- `apply_migration` (DDL vía MCP: **no**; las migraciones van por CLI/repo según **modifying-database**).
- `deploy_edge_function`, `create_branch`, `delete_branch`, `merge_branch`, `rebase_branch`, `reset_branch`.
- `create_project`, `pause_project`, `restore_project`, y otras operaciones de ciclo de vida del proyecto salvo petición explícita distinta a inspección.

## Flujo sugerido

1. Confirmar `project_id` si hace falta (`list_projects` / `get_project`).
2. Explorar esquema: `list_tables` con `schemas` acorde (p. ej. `public`) y `verbose: true` si se necesitan columnas y FKs.
3. Profundizar: `execute_sql` solo con SQL de lectura acotado (`LIMIT` en exploración de filas).
4. Contexto Supabase: `search_docs` o `get_advisors` según la duda (seguridad/rendimiento).
5. Si surge necesidad de cambio estructural: parar y seguir **modifying-database**.

## Ubicación en el repo

Copia para descubrimiento en Cursor. La otra copia está en `Herramientas_IA/2_module/inspecting-database/SKILL.md`; mantén ambas sincronizadas al editar.
