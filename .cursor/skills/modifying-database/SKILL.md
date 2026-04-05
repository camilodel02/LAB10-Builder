---
name: modifying-database
description: Crea y aplica migraciones SQL con Supabase CLI en el monorepo LAB10 (supabase/migrations). Use cuando el usuario pida cambiar el esquema, migración, base de datos local, supabase migration, db reset o alterar tablas.
---

# Modifying database (Supabase, LAB10-Builder)

## Contexto del repo

- Configuración local en la raíz del repo: `supabase/config.toml` (`project_id = "LAB10_Builder"`).
- Migraciones versionadas: carpeta `supabase/migrations/` (archivos con timestamp generados por el CLI).
- Ejecutar comandos desde la **raíz del repositorio** (donde existe `supabase/`).

## Flujo estándar

1. **Crear migración** (genera el archivo vacío con nombre descriptivo):

   ```bash
   npx supabase migration new nombre_migracion
   ```

   Sustituye `nombre_migracion` por un identificador claro en snake_case (ej. `add_expenses_table`).

2. **Editar el SQL** en el archivo nuevo bajo `supabase/migrations/`. Ahí va el DDL/DML que debe aplicarse (CREATE TABLE, ALTER TABLE, índices, RLS, etc.). No dejes el archivo vacío si el cambio ya debe existir en la base.

3. **Aplicar migraciones pendientes** en la base local:

   ```bash
   npx supabase migration up
   ```

   Requiere el stack local operativo (`npx supabase start` si aún no corre). Si el CLI de tu versión no expone `migration up`, revisa `npx supabase migration --help` o aplica con `npx supabase db reset` solo cuando aceptes recrear la base local (ver abajo).

## Si el estado de migraciones quedó corrupto (local)

Recrea la base local y reaplica **todas** las migraciones desde cero:

```bash
npx supabase db reset
```

**Advertencia:** borra datos y objetos en la base **local**; úsalo cuando el historial de migraciones y la BD ya no coincidan o tras experimentos rotos.

## Reglas rápidas

- No uses `npx migration` (paquete distinto); el comando correcto es **`npx supabase migration ...`**.
- Una migración = un cambio coherente (evita mezclar refactors masivos sin revisar).
- Tras cambios de esquema, alinea la app (tipos, modelos, tests) y documenta rupturas si afectan al MVP.

## Ubicación en el repo

Copia para descubrimiento en Cursor. La otra copia está en `Herramientas_IA/2_module/modifying-database/SKILL.md`; mantén ambas sincronizadas al editar.
