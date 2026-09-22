# Nébula Dental

Clínica dental ficticia con cuatro sucursales. Monorepo npm-workspaces con dos apps:

- **`apps/web`** — sitio con reserva de horas (Vite + React 19 + TypeScript + Three.js).
- **`apps/api`** — API de disponibilidad y reservas (Hono + `node:sqlite`, TypeScript nativo en Node).

```bash
npm install
npm run dev     # API en http://localhost:3001 · web en http://localhost:5173
npm run qa      # typecheck + test + build de las dos apps
```

Contrato de la API: `docs/API-CONTRATO.md`. Requiere Node ≥ 22.13.
