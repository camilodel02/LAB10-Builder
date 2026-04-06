---
name: executing-browser
description: Automatiza el navegador con el CLI agent-browser (Vercel Labs) para pruebas e2e, snapshots accesibles y flujos guiados por IA. Incluye avisos para PowerShell (comillas en refs @eN), orden snapshot-antes-de-actuar y SPAs con upload. Use cuando el usuario pida agent-browser, e2e en localhost, o smoke con recibos/LAB10.
---

# Executing browser (agent-browser)

Herramienta oficial: [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) — CLI nativo (Rust) + daemon CDP para que un agente controle Chrome sin depender de Node en el daemon.

## Instalación rápida

```bash
npm install -g agent-browser
agent-browser install   # Primera vez: descarga Chrome for Testing
```

Alternativas: `brew install agent-browser`, `cargo install agent-browser`, o dependencia local en `package.json` y ejecutar `npx agent-browser ...`.

**Requisito:** Chrome (el `install` prepara el canal de testing). En Linux: `agent-browser install --with-deps`.

## Flujo recomendado para IA (refs)

1. `agent-browser open <url>` — Navegar (aliases: `goto`, `navigate`).
2. `agent-browser snapshot -i` — Árbol de accesibilidad **solo elementos interactivos** con refs `@e1`, `@e2`… (óptimo para tokens).
3. Actuar con refs deterministas: `agent-browser click @e2`, `agent-browser fill @e3 "texto"`.
4. Tras cambiar el DOM, **volver a `snapshot`** antes de asumir refs viejos.

**Salida máquina:** añade `--json` a comandos que lo soporten (p. ej. `snapshot -i --json`) para parseo estable.

## Errores frecuentes (aprendizajes LAB10 / Windows)

Estos puntos evitan fallos ya vistos al automatizar la app en `localhost:5173` y entornos similares.

### 1. PowerShell y el carácter `@` en los refs

En **PowerShell**, `@` tiene significado sintáctico. Los selectores tipo `@e3` deben ir **entre comillas simples** para que lleguen al CLI:

```powershell
agent-browser click '@e5'
agent-browser fill '@e3' 'usuario@ejemplo.com'
```

Sin comillas, pueden aparecer errores como `Missing arguments for: click` o `Unknown ref: e5` aunque el ref exista.

En **bash/cmd** suele bastar `agent-browser click @e5`; en PowerShell priorizar las comillas simples.

### 2. `Unknown ref` justo después de `open`

Los refs `@eN` **no están disponibles** hasta que la sesión haya generado un snapshot con árbol y refs. Orden **obligatorio** en cada nueva navegación o sesión:

1. `agent-browser open <url>`
2. `agent-browser wait --load networkidle` (o `wait` razonable)
3. **`agent-browser snapshot -i`** (o `snapshot` completo)
4. Luego `fill`, `click`, etc. con `'@e3'`, `'@e5'`, …

Hacer `screenshot` antes del primer `snapshot -i` no registra refs: si se intentó `fill '@e3'` sin paso 3, falla.

### 3. Alternativa si los refs fallan

Usar localizadores semánticos del propio agent-browser (no dependen del caché de refs del último snapshot):

```text
agent-browser find label "Correo electrónico" fill "correo@test.com"
agent-browser find role button click --name "Entrar"
```

### 4. Subida de archivos (`upload`) en SPAs

- Inputs `type="file"` a menudo están ocultos (`sr-only`); el CLI igual puede apuntar al input por **selector CSS**.
- Si el proyecto expone `data-testid`, suele ser lo más estable:  
  `agent-browser upload '[data-testid=receipt-file-input]' "C:\ruta\completa\archivo.pdf"`
- Rutas con espacios: entrecomillar la ruta. En Windows usar rutas absolutas claras.

### 5. E2E no sustituye comprobar backend (Supabase / API)

Si el login en UI funciona pero la subida devuelve **502** o *Bucket not found*, el fallo suele ser **API + Storage local** (variable `SUPABASE_*` en `apps/api/.env`, bucket creado por migraciones, `npx supabase status`). No atribuir eso a agent-browser; corregir entorno y repetir el flujo.

### 6. Encadenar comandos en PowerShell

En versiones antiguas de PowerShell, `&&` no está disponible. Encadenar con `;` o ejecutar comandos por separado. En bash/Linux, `&&` es habitual.

### 7. Cerrar sesión entre pruebas limpias

`agent-browser close` o `close --all` entre corridas evita estado mezclado. Para probar redirección de rutas protegidas, conviene sesión nueva sin cookies de login previo.

## Comandos que más suelen usarse

| Objetivo | Comando |
|----------|---------|
| Subir archivo (form) | `agent-browser upload <selector> <ruta-archivo>` |
| Esperar carga | `agent-browser wait --load networkidle` |
| Captura | `agent-browser screenshot [ruta]` (`--full` página completa) |
| Depuración visual | `agent-browser open URL --headed` |
| Semántico | `agent-browser find role button click --name "Submit"` |
| Cerrar | `agent-browser close` (`close --all` todas las sesiones) |

**Encadenar** en una sola invocación de shell con `&&` (el daemon mantiene sesión):

```bash
agent-browser open http://localhost:5173 && agent-browser wait --load networkidle && agent-browser snapshot -i
```

**Batch** (varios pasos, menos overhead): pipe de JSON array de comandos a `agent-browser batch --json` (ver README del repo).

## Snapshot: reducir ruido

- `-i` / `--interactive` — solo botones, enlaces, inputs.
- `-c` / `--compact` — menos nodos vacíos.
- `-d N` — profundidad máxima.
- `-s "#selector"` — limitar a un subárbol.

## Sesiones y auth

- `--session <nombre>` — aislar instancias (cookies/historial propios).
- Perfil Chrome existente: `--profile Default` (en Windows, **cerrar Chrome** antes si hay bloqueo de perfil).
- Perfil persistente: `--profile /ruta/carpeta` para reutilizar login.
- Headers por origen: `open URL --headers '{"Authorization":"Bearer ..."}'` (no se filtran a otros dominios).

## Seguridad (opt-in, importante en agentes)

- `--allowed-domains` — lista de dominios permitidos (incluir CDNs que la app use).
- `--content-boundaries` — delimitar salida para el LLM.
- `--max-output` — tope de caracteres en salidas.
- `--action-policy` / `--confirm-actions` — gatear acciones sensibles.

Estado de sesión puede guardarse; **no commitear** archivos con tokens; usar `.gitignore`.

## Timeouts y fiabilidad

- Timeout por defecto **25s** en operaciones; subirlo por encima de **30s** puede chocar con timeout IPC del CLI (EAGAIN). Variable: `AGENT_BROWSER_DEFAULT_TIMEOUT` (ms).

## Config persistente

Prioridad: flags CLI > `AGENT_BROWSER_*` > `./agent-browser.json` > `~/.agent-browser/config.json`. Claves en camelCase en JSON. Si el archivo de proyecto tiene rutas sensibles, ignorarlo en git.

## Integración con asistentes

El repo recomienda instalar el skill oficial actualizado:

```bash
npx skills add vercel-labs/agent-browser
```

Este skill del repo LAB10 resume el **patrón de uso**; para detalle completo de flags y proveedores cloud, usar `agent-browser --help` o el README enlazado arriba.

## Cuándo no usar esto

- Sustituye **Playwright/Cypress** como framework de tests en CI solo si el equipo lo decide; aquí el foco es **automatización orientada al agente** y smoke manual.
- No reemplaza pruebas unitarias de API (`pytest`) ni de componentes (`Vitest`) en el monorepo LAB10.

## Ubicación en el repo

Copia bajo `Herramientas_IA/2_module/`. Cursor puede cargar desde `.cursor/skills/executing-browser/SKILL.md`; mantén ambas copias alineadas al editar.
