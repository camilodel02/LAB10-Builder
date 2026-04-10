# App (`@lab10/app`)

React + Vite + Tailwind v4 + TypeScript.

## Tests unitarios (Vitest)

- **Utilidades puras:** `src/lib/*.test.ts` junto al módulo (o en `src/lib/__tests__/` si prefieres).
- **Componentes:** `*.test.tsx` con Testing Library; `src/test/setup.ts` carga `@testing-library/jest-dom`.

Comandos: `npm run test` (CI) o `npm run test:watch` durante desarrollo.

## Variables de entorno

Copia [`.env.example`](./.env.example) a `.env` y rellena con la URL y la anon key del proyecto Supabase (Settings → API). El cliente usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para Auth y sesión en el navegador.

Rutas principales de auth: `/login`, `/register` (públicas); `/` (recibos, protegida); `/profile` (correo y contraseña, protegida).

## Proxy API

En desarrollo, las peticiones a `/api/*` se envían a `http://127.0.0.1:8000` (ver `vite.config.ts`). Tras el login, las subidas de recibos envían `Authorization: Bearer <access_token>` a `POST /api/receipts/upload`.
