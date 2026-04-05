# App (`@lab10/app`)

React + Vite + Tailwind v4 + TypeScript.

## Tests unitarios (Vitest)

- **Utilidades puras:** `src/lib/*.test.ts` junto al módulo (o en `src/lib/__tests__/` si prefieres).
- **Componentes:** `*.test.tsx` con Testing Library; `src/test/setup.ts` carga `@testing-library/jest-dom`.

Comandos: `npm run test` (CI) o `npm run test:watch` durante desarrollo.

## Proxy API

En desarrollo, las peticiones a `/api/*` se envían a `http://127.0.0.1:8000` (ver `vite.config.ts`).
