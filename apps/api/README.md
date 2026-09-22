# Nébula Dental · API

API de reservas de una clínica dental ficticia con 4 sucursales en Chile. Stack mínimo: **Hono** sobre `@hono/node-server`, **SQLite** con `node:sqlite` (sin drivers) y **TypeScript ejecutado nativo por Node** (sin build ni `tsx`). Requiere Node >= 22.13.

El contrato completo (rutas, shapes, datos semilla) vive en [`docs/API-CONTRATO.md`](../../docs/API-CONTRATO.md).

## Correr

```bash
npm install                      # desde la raíz del monorepo
npm run dev -w apps/api          # http://localhost:3001/api, recarga con --watch
npm run typecheck -w apps/api
npm test -w apps/api
```

Variables opcionales: `PORT` (3001) y `DB_PATH` (`apps/api/data/nebula.db`). La base se crea y se siembra sola al arrancar; `npm run seed -w apps/api` hace lo mismo sin levantar el servidor.

## Rutas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | `{ ok: true, servicio: "nebula-api" }` |
| GET | `/api/sucursales` | Las 4 sucursales con horario local (`America/Santiago`) |
| GET | `/api/sucursales/:slug` | Una sucursal · 404 |
| GET | `/api/servicios` | Los 8 servicios |
| GET | `/api/disponibilidad?sucursal=<slug>&fecha=YYYY-MM-DD` | Slots libres de 30 min, en ISO UTC |
| POST | `/api/reservas` | Crea una reserva · 201 / 400 / 409 |
| GET | `/api/reservas/:codigo` | Busca por código de 6 caracteres · 404 |

Todas las fechas viajan en **UTC ISO 8601**. Los horarios de sucursal están en hora local y la API los convierte al offset correcto del día (Chile cambia entre UTC-4 y UTC-3).

Errores: siempre `{ error: string, detalles?: string[] }`.

## Ejemplo

```bash
curl 'http://localhost:3001/api/disponibilidad?sucursal=las-condes&fecha=2026-09-23'

curl -X POST http://localhost:3001/api/reservas \
  -H 'content-type: application/json' \
  -d '{
    "sucursal": "las-condes",
    "servicio": "limpieza",
    "inicio": "2026-09-23T13:00:00.000Z",
    "paciente": { "nombre": "Camila Rojas", "email": "camila@ejemplo.cl", "telefono": "+56 9 8765 4321" }
  }'
```

## Estructura

```
src/
  server.ts          arranque (@hono/node-server)
  app.ts             createApp(db): app Hono, testeable con app.request()
  config.ts          PORT y DB_PATH
  db/                conexion.ts (esquema + siembra idempotente), semilla.ts, seed.ts
  dominio/           fechas.ts, disponibilidad.ts (lógica pura), sucursales.ts, servicios.ts, reservas.ts
  rutas/             un archivo por recurso
  tipos.ts           tipos del contrato
```
