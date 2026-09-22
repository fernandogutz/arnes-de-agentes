# impl — #1 `api_reservas`

- **Origen:** construida en **bootstrap** (antes de que existiera el loop): entró directo en `main`, sin rama `feat/1-…`. Este archivo se escribió después, sobre el código real, como ejemplo del mapa R<n> → test que el `implementer` deja en cada feature.
- **Fecha:** 2026-09-21 · **Spec:** `sdd/specs/api_reservas/` (R1–R7, T1–T8).
- **Resultado:** T1–T8 `[x]`. QA del área en verde: `npm run typecheck -w apps/api` sin errores · `npm test -w apps/api` → 4 archivos de test, 27 tests, `fail 0`.

## 1. Commits

No hubo commits del loop para #1 (bootstrap, ver arriba). En una feature normal aquí va la tabla `scope → contenido` de los commits Conventional de la rama `feat/<id>-<name>`.

## 2. Mapa R<n> → test

| R | Archivo | Test |
|---|---|---|
| R1 | `apps/api/src/dominio/disponibilidad.test.ts` | "genera slots de 30 min dentro del horario de lunes a viernes, en UTC" · "usa el horario de sábado" · "devuelve vacío cuando la sucursal está cerrada ese día" |
| R1 | `apps/api/src/app.test.ts` | "GET /api/disponibilidad devuelve slots en UTC y vacío los domingos" |
| R2 | `apps/api/src/dominio/disponibilidad.test.ts` | "quita los slots ya reservados" |
| R2 | `apps/api/src/app.test.ts` | "POST /api/reservas crea, GET por código la devuelve y el slot desaparece de la disponibilidad" |
| R3 | `apps/api/src/app.test.ts` | "GET /api/disponibilidad valida parámetros" |
| R3 | `apps/api/src/dominio/fechas.test.ts` | "valida fechas YYYY-MM-DD" |
| R4 | `apps/api/src/dominio/reservas.test.ts` | "produce 6 caracteres legibles (sin O, 0, I ni 1)" · "acepta un body correcto y normaliza el inicio a ISO UTC" |
| R4 | `apps/api/src/app.test.ts` | "POST /api/reservas crea, GET por código la devuelve…" · "GET /api/reservas/:codigo responde 404 si no existe" |
| R5 | `apps/api/src/app.test.ts` | "POST /api/reservas responde 409 si el horario ya está tomado o está fuera del horario" |
| R6 | `apps/api/src/dominio/reservas.test.ts` | "acumula todos los problemas en detalles" · "rechaza un inicio que no es ISO 8601" |
| R6 | `apps/api/src/app.test.ts` | "POST /api/reservas responde 400 con detalles si el body es inválido o la sucursal/servicio no existen" |
| R7 | `apps/api/src/dominio/fechas.test.ts` | "convierte hora local a UTC en horario de verano (UTC-3)" · "convierte hora local a UTC en horario de invierno (UTC-4)" · "devuelve la fecha local de un instante UTC (cruce de medianoche)" |
| R7 | `apps/api/src/dominio/disponibilidad.test.ts` | "respeta el cambio de hora: el mismo horario local da otro UTC en invierno" |

Además (sin R propio, higiene): "GET /api/health", "GET /api/sucursales devuelve las 4 sucursales…", "GET /api/servicios devuelve los 8 servicios", "404 JSON genérico para rutas desconocidas", "CORS permite orígenes localhost".

## 3. Archivos tocados

`apps/api/package.json` · `apps/api/tsconfig.json` · `apps/api/src/{server,app,tipos,config}.ts` · `apps/api/src/db/{conexion,semilla,seed}.ts` · `apps/api/src/dominio/{fechas,disponibilidad,reservas,sucursales,servicios}.ts` · tests `src/app.test.ts`, `src/dominio/{fechas,disponibilidad,reservas}.test.ts` · `apps/api/data/.gitkeep`.

## 4. Decisiones tomadas durante la implementación

- El último slot debe caber **completo** antes del cierre: con horario `09:00-19:00` el último es `18:30`, no `19:00`. Coherente con R1 ("el último slot que cabe completo").
- `validarNuevaReserva` normaliza el `inicio` a `toISOString()` para que la comparación con los slots sea textual (mismo formato con milisegundos).
- El body no-JSON se trata como validación (400 `detalles: ["el body debe ser JSON válido"]`) y no como 500.

## 5. Fuera de alcance

Cancelación (#3), filtro por categoría (#2). Sin cambios en `docs/API-CONTRATO.md`: el código lo sigue tal cual.
