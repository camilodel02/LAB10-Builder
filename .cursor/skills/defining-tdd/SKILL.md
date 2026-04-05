---
name: defining-tdd
description: Aplica TDD delimitando casos de uso, tests antes que código y verificación de criterios. Incluye convenciones del monorepo LAB10 (pytest en apps/api, Vitest en apps/app). Use cuando el usuario pida TDD, tests primero, casos de uso, pytest, Vitest, red-green-refactor o verificación antes de implementar.
---

# Defining TDD (casos de uso y verificación)

## Objetivo

Forzar un ciclo **test primero**: cada caso de uso queda expresado como criterios comprobables; el código existe para hacer pasar esos tests, no al revés.

## Definiciones rápidas

| Término | En la práctica |
|--------|----------------|
| **Caso de uso** | Flujo que el sistema debe permitir, con entrada esperada y resultado observable (API, DB, archivo, error). |
| **Criterio de aceptación** | Condición binaria (pasa / no pasa) que cierra el caso de uso. |
| **Test** | Automatización de uno o más criterios; debe fallar antes de existir la implementación real (Red). |

## Flujo obligatorio (orden)

1. **Nombrar el caso de uso**  
   Identificador estable (ej. `UC-01 subir recibo PDF`) y breve descripción en lenguaje de negocio.

2. **Escribir criterios de aceptación**  
   Lista numerada, cada ítem comprobable sin ambigüedad (qué entrada, qué salida o qué error).

3. **Escribir tests que fallen (Red)**  
   - **API:** nuevo archivo en `apps/api/tests/unit/` (ej. `test_uc01_upload.py`) o ampliar uno existente del mismo caso de uso.  
   - **App:** nuevo `*.test.ts` / `*.test.tsx` bajo `apps/app/src/` (ideal junto al módulo en `src/lib/` o junto al componente).  
   - Cada criterio importante tiene al menos un test (o un parametrizado claro).  
   - Ejecutar la suite relevante: deben fallar por comportamiento ausente, no por sintaxis o imports rotos.

4. **Implementar lo mínimo (Green)**  
   Solo lo necesario para que los tests del paso 3 pasen. No añadir features sin criterio previo.

5. **Verificar**  
   Toda la suite relevante pasa; los criterios del caso de uso quedan cubiertos por tests explícitos (comandos en [Tests en el monorepo LAB10-Builder](#tests-en-el-monorepo-lab10-builder)).

6. **Refactor (opcional pero habitual)**  
   Mejorar nombres y estructura sin cambiar comportamiento; tests siguen en verde.

## Cómo se “ve” en el código base

- **Trazabilidad**: comentario en el test o nombre de archivo que referencie el caso de uso (ej. `# UC-01` o prefijo `test_uc01_`).  
- **Un criterio, una intención clara**: evitar tests gigantes que mezclen varios casos de uso; si falla, el nombre debe indicar qué criterio se rompió.  
- **Datos de prueba**: fixtures o builders mínimos; sin red ni APIs externas en unitarios salvo integración explícita y acotada.

## Tests en el monorepo LAB10-Builder

### Para qué se usan

- **TDD:** el test fija el comportamiento esperado **antes** del código de producción (Red → Green → Refactor).  
- **Regresión:** tras un bug, el test que lo reproduce queda en la suite.  
- **Documentación viva:** nombres y aserciones comunican criterios de aceptación a quien lea el repo.

### Dónde están

| Área | Ubicación | Herramienta |
|------|-----------|-------------|
| Tests unitarios API | `apps/api/tests/unit/` | pytest |
| Fixtures compartidos API | `apps/api/tests/conftest.py` | pytest (ej. `client` con `TestClient`) |
| Código bajo prueba (API) | `apps/api/src/lab10_api/app/` (dominio), `lab10_api/api/` (HTTP) | |
| Config pytest / `PYTHONPATH` | `apps/api/pyproject.toml` → `[tool.pytest.ini_options]` (`pythonpath = ["src"]`) | |
| Tests frontend | `apps/app/src/**/*.test.ts`, `*.test.tsx` | Vitest |
| Setup DOM (frontend) | `apps/app/src/test/setup.ts` | `@testing-library/jest-dom` |

### Cómo implementarlos

- **Dominio (Python):** importar funciones/clases desde `lab10_api.app...` y aserciones directas (`assert`); no hace falta levantar servidor.  
- **Rutas HTTP (Python):** usar el fixture `client`; las rutas del router viven bajo prefijo `/api` (ej. `GET /api/health`).  
- **Convención nombres Python:** funciones `test_*` en módulos `test_*.py`.  
- **Frontend:** utilidades puras en `src/lib/` + `archivo.test.ts`; componentes con `archivo.test.tsx` y Testing Library (`render`, `screen`, `userEvent` cuando aplique).  
- **Nuevos casos de uso:** preferir un archivo de test por caso o por slice vertical (`test_uc01_...`) para mantener trazabilidad con el skill y el brief.

### Cómo verificarlos

- **Todo el monorepo (desde la raíz):** `npm test` — corre tests de `apps/app` y `apps/api` vía workspaces.  
- **Solo API:** `npm run test:api` o, en `apps/api`, `python -m pytest tests -v` (requiere entorno Python con dependencias instaladas; ver `apps/api/README.md`).  
- **Solo app:** `npm run test:app` o `npm run test --workspace @lab10/app`.  
- **Durante desarrollo (app):** `npm run test:watch` en `apps/app` para feedback continuo.  
- **Cierre TDD:** (1) test nuevo en **rojo** por la razón correcta; (2) implementación mínima; (3) misma suite en **verde**; (4) refactor opcional sin romper verde.

## Reglas de prioridad

1. **No implementar lógica de producto nueva sin test que la exija** (salvo spike desechable documentado como prototipo sin merge a main).  
2. **Si el criterio no se puede testear**, reformular el criterio hasta que sea observable (salida, estado persistido, código HTTP, excepción controlada).  
3. **Bugs**: reproducir primero con un test que falle; luego arreglar; el test queda como regresión.

## Anti-patrones

- Escribir implementación y “after tests” solo para cobertura.  
- Tests que dependen del orden de ejecución o de estado global sin reset.  
- Mockear todo hasta que el test no pruebe comportamiento real útil; equilibrar unitario vs integración según el criterio.

## Red-Green-Refactor (recordatorio)

```text
Red    → test nuevo que falla
Green  → código mínimo que pasa
Refactor → limpieza manteniendo verde
```

## Ubicación en el repo

Copia para descubrimiento automático en Cursor. La otra copia vive en `Herramientas_IA/2_module/defining-tdd/SKILL.md`; al editar el contenido, mantén ambas sincronizadas.
