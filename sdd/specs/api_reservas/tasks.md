# Tasks — api_reservas (#1)

> Feature de bootstrap (sin rama de feature, ver `sdd/progress/history.md`). Cada task lleva su test verde antes de pasar a la siguiente. QA del área: `npm run typecheck -w apps/api && npm test -w apps/api`.

- [x] T1 (api) — `tipos.ts` + `db/semilla.ts` + `db/conexion.ts` (esquema, índice único parcial, `sembrar` idempotente, `abrirDb(":memory:")`). Test: siembra dos veces y cuenta 4 sucursales / 8 servicios. Cubre: R4 (base), R5 (índice).
- [x] T2 (api) — `dominio/fechas.ts` (`offsetMinutos`, `localAUtc`, `fechaLocal`, `esFechaValida`, `diaSemana`, `parsearIso`) + `fechas.test.ts` en verano e invierno. Cubre: **R7**, R3.
- [x] T3 (api) — `dominio/disponibilidad.ts` (`rangoDelDia`, `calcularSlots`) + `disponibilidad.test.ts` (lun-vie, sábado, cerrado, reservados, cambio de hora). Cubre: **R1**, **R2**, R7.
- [x] T4 (api) — `dominio/reservas.ts` (`generarCodigo`, `validarNuevaReserva`, `iniciosReservados`, `insertarReserva`, `buscarPorCodigo`) + `reservas.test.ts`. Cubre: **R4**, **R6**.
- [x] T5 (api) — `rutas/disponibilidad.ts` con validación de params y 404 de sucursal; `dominio/sucursales.ts`. Cubre: R1, R2, **R3**.
- [x] T6 (api) — `rutas/reservas.ts` (`POST /`, `GET /:codigo`) con 400 / 409 / 404; `dominio/servicios.ts`. Cubre: R4, **R5**, R6.
- [x] T7 (api) — `app.ts` (`createApp`, CORS, health, 404/500 JSON) + `server.ts` + `app.test.ts` con `app.request()` cubriendo cada R. Cubre: R1–R7.
- [x] T8 (api) — QA del área en verde, `sdd/progress/impl_api_reservas.md` con el mapa R → test, `tasks.md` en `[x]`. Cubre: evidencia de R1–R7.
