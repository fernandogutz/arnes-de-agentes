# Design — api_reservas (#1)

> Área `api`. Sin dependencias nuevas: Hono + `node:sqlite` + TypeScript nativo de Node (imports con `.ts`). ADR: D-01 (área `api`, scope `feat(api)`), D-02 (UTC).

## 1. Archivos (área `api`)

| Archivo | Qué |
|---|---|
| `apps/api/src/tipos.ts` | Tipos del contrato: `Horario`, `Sucursal`, `Servicio`, `Reserva`, `NuevaReserva`, `EstadoReserva`. Espejo de `docs/API-CONTRATO.md`. |
| `apps/api/src/db/conexion.ts` | `abrirDb(ruta | ":memory:")`, esquema (`sucursales`, `servicios`, `reservas`), índice único `reservas_sucursal_inicio_confirmada (sucursal_id, inicio) WHERE estado = 'confirmada'`, `sembrar(db)` idempotente. |
| `apps/api/src/db/semilla.ts` | `SUCURSALES_SEMILLA`, `SERVICIOS_SEMILLA` (los del contrato). |
| `apps/api/src/dominio/fechas.ts` | `ZONA_HORARIA`, `offsetMinutos(instante)`, `localAUtc(fecha, "HH:MM")`, `fechaLocal(instante)`, `esFechaValida(fecha)`, `diaSemana(fecha)`, `parsearIso(texto)`. Única conversión local ↔ UTC de la API. |
| `apps/api/src/dominio/disponibilidad.ts` | `DURACION_SLOT_MIN = 30`, `rangoDelDia(horario, fecha)`, `calcularSlots(horario, fecha, reservados)` → `string[]` ISO UTC. Pura, sin DB. |
| `apps/api/src/dominio/reservas.ts` | `generarCodigo()` (alfabeto sin O/0/I/1), `validarNuevaReserva(body)` → `{ ok, datos } | { ok: false, detalles }`, `iniciosReservados(db, sucursalId, fecha)`, `insertarReserva(db, datos, ids)`, `buscarPorCodigo(db, codigo)`. |
| `apps/api/src/dominio/{sucursales,servicios}.ts` | `listarSucursales(db)`, `buscarSucursal(db, slug)`, `listarServicios(db)`, `buscarServicio(db, slug)`. |
| `apps/api/src/rutas/disponibilidad.ts` | `GET /` → valida params (R3) → `calcularSlots` con `iniciosReservados` (R1, R2). |
| `apps/api/src/rutas/reservas.ts` | `POST /` (R4, R5, R6) y `GET /:codigo` (R4). |
| `apps/api/src/app.ts` | `createApp(db)`: CORS para `localhost`, `/api/health`, `app.route(...)` por recurso, 404 y 500 en JSON. Testeable con `app.request()`. |
| `apps/api/src/server.ts` | Abre la DB (`apps/api/data/nebula.db`), siembra, sirve en `:3001`. |
| Tests | `src/app.test.ts` (HTTP con DB `:memory:`), `src/dominio/{fechas,disponibilidad,reservas}.test.ts` (unitarios). |

## 2. Decisiones

- **Slots calculados, no almacenados.** `calcularSlots` genera los instantes del día a partir del horario y resta los `inicio` de reservas confirmadas. No hay tabla de slots que mantener; el 409 se decide comparando el `inicio` del body contra esa lista (R5).
- **Índice único parcial como respaldo del 409.** `(sucursal_id, inicio) WHERE estado = 'confirmada'`. Si dos requests simultáneos pasan la validación, el segundo falla en el `INSERT`; la ruta lo traduce a 409. Deja el camino abierto a la cancelación (#3): una reserva `cancelada` no bloquea el slot.
- **Conversión con `Intl.DateTimeFormat`** (D-02): el offset de `America/Santiago` para la fecha sale del runtime, sin librerías ni tabla de DST a mano. `localAUtc("2026-01-15", "09:00")` → `12:00Z`; en julio → `13:00Z`.
- **Errores con forma fija** `{ error, detalles? }`: `validacion` (400, con `detalles`), `sucursal_no_encontrada` (404), `reserva_no_encontrada` (404), `horario_no_disponible` (409). Los mensajes de `detalles` en español, acumulados (no se corta en el primero).
- **Código de reserva dictable por teléfono**: 6 chars de `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` con `crypto.randomInt`. Colisión → `UNIQUE` en `codigo` y reintento.

## 3. Alternativa descartada

**Persistir los slots como filas** (`slots(sucursal_id, inicio, estado)` generadas por adelantado para N días). Hace el `GET` trivial y el 409 un `UPDATE ... WHERE estado = 'libre'`, pero obliga a un job que genere días nuevos, a regenerar cuando cambia un horario, y a decidir qué pasa con los slots de días pasados. Para 4 sucursales con horario fijo, calcular al vuelo es más barato y no tiene estado que se pueda desincronizar.

## 4. Contrato

`docs/API-CONTRATO.md` ya describe `/disponibilidad`, `/reservas` y los tipos; este design no lo cambia. Cualquier ajuste durante la implementación se refleja allí **antes** que en el código (skill `api-endpoint`).
