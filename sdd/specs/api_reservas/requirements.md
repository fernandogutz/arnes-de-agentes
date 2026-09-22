# Requirements — api_reservas (#1)

> Feature `media`, área `api`. Núcleo de la API de Nébula Dental: disponibilidad por sucursal y día, y creación de reservas. Contrato: `docs/API-CONTRATO.md`. ADR que manda: **D-02** (UTC en la API, hora local solo en el front).
>
> Contexto: cada sucursal declara su horario en hora local (`"09:00-20:00"` para lun-vie, sáb y dom por separado). Un slot dura 30 minutos. La API habla UTC hacia afuera; la única conversión local → UTC vive en `dominio/fechas.ts`.

## Requirements (EARS)

**R1 — Slots del día en UTC.**
CUANDO se consulta `GET /api/disponibilidad?sucursal=<slug>&fecha=YYYY-MM-DD` con una sucursal existente, el sistema DEBE responder 200 `{ sucursal, fecha, slots }` donde `slots` son instantes ISO 8601 UTC cada 30 minutos, desde la apertura hasta el último slot que cabe completo antes del cierre según el horario de la sucursal para el día de la semana de `fecha` (lun-vie / sáb / dom), y un array vacío si la sucursal está cerrada ese día.
*Verificable por:* `dominio/disponibilidad.test.ts` → "genera slots de 30 min dentro del horario de lunes a viernes, en UTC", "usa el horario de sábado", "devuelve vacío cuando la sucursal está cerrada ese día"; `app.test.ts` → "GET /api/disponibilidad devuelve slots en UTC y vacío los domingos".

**R2 — Los slots reservados desaparecen.**
CUANDO existe una reserva `confirmada` para una sucursal en un instante, el sistema DEBE excluir ese instante de los `slots` de `GET /api/disponibilidad` para esa sucursal y fecha.
*Verificable por:* `dominio/disponibilidad.test.ts` → "quita los slots ya reservados"; `app.test.ts` → "POST /api/reservas crea, GET por código la devuelve y el slot desaparece de la disponibilidad".

**R3 — Validación de parámetros de disponibilidad.**
SI `sucursal` o `fecha` faltan o `fecha` no es una `YYYY-MM-DD` válida ENTONCES el sistema DEBE responder 400 `{ error: "validacion", detalles: string[] }`; y SI la sucursal no existe ENTONCES el sistema DEBE responder 404 `{ error: "sucursal_no_encontrada" }`.
*Verificable por:* `app.test.ts` → "GET /api/disponibilidad valida parámetros"; `dominio/fechas.test.ts` → "valida fechas YYYY-MM-DD".

**R4 — Crear una reserva.**
CUANDO se envía `POST /api/reservas` con un body `NuevaReserva` válido cuyo `inicio` es un slot libre de la sucursal, el sistema DEBE crear la reserva con `estado: "confirmada"`, un `codigo` de 6 caracteres del alfabeto `A-Z2-9` sin `O`, `0`, `I` ni `1`, `inicio` y `creadaEn` en ISO UTC, y responder 201 con la `Reserva`; y `GET /api/reservas/:codigo` DEBE devolverla.
*Verificable por:* `dominio/reservas.test.ts` → "produce 6 caracteres legibles (sin O, 0, I ni 1)", "acepta un body correcto y normaliza el inicio a ISO UTC"; `app.test.ts` → "POST /api/reservas crea, GET por código la devuelve y el slot desaparece de la disponibilidad", "GET /api/reservas/:codigo responde 404 si no existe".

**R5 — Conflicto de horario.**
SI el `inicio` del body ya tiene una reserva `confirmada` en esa sucursal, o no coincide con ningún slot del horario de ese día ENTONCES el sistema DEBE responder 409 `{ error: "horario_no_disponible" }` y NO DEBE crear la reserva.
*Verificable por:* `app.test.ts` → "POST /api/reservas responde 409 si el horario ya está tomado o está fuera del horario"; índice único `reservas_sucursal_inicio_confirmada` en `db/conexion.ts` como respaldo.

**R6 — Validación del body.**
SI el body de `POST /api/reservas` no es JSON, le falta `sucursal`, `servicio`, `inicio` o `paciente.{nombre,email,telefono}`, `inicio` no es ISO 8601 con zona, `nombre` tiene menos de 3 caracteres, `email` no tiene forma de correo, `telefono` tiene menos de 8 dígitos, o la sucursal/servicio no existen ENTONCES el sistema DEBE responder 400 `{ error: "validacion", detalles: string[] }` con **todos** los problemas encontrados, en español.
*Verificable por:* `dominio/reservas.test.ts` → "acumula todos los problemas en detalles", "rechaza un inicio que no es ISO 8601"; `app.test.ts` → "POST /api/reservas responde 400 con detalles si el body es inválido o la sucursal/servicio no existen".

**R7 — UTC de punta a punta (D-02).**
El sistema DEBE calcular los slots convirtiendo el horario local de la sucursal a UTC con el offset real de `America/Santiago` para esa fecha (UTC-4 en invierno, UTC-3 en verano), y NO DEBE persistir ni devolver ninguna fecha en hora local o sin zona.
*Verificable por:* `dominio/fechas.test.ts` → "convierte hora local a UTC en horario de verano (UTC-3)", "convierte hora local a UTC en horario de invierno (UTC-4)", "devuelve la fecha local de un instante UTC (cruce de medianoche)"; `dominio/disponibilidad.test.ts` → "respeta el cambio de hora: el mismo horario local da otro UTC en invierno".

## Trazabilidad con el `acceptance`

| Criterio del `acceptance` | R |
|---|---|
| slots ISO UTC cada 30 min dentro del horario, sin los reservados; vacío si cerrada | R1, R2 |
| 400 si falta/inválido un parámetro; 404 si la sucursal no existe | R3 |
| POST crea (201) con código de 6 chars mayúsculas; GET por código la recupera | R4 |
| 409 `horario_no_disponible` si el slot está tomado o fuera de horario | R5 |
| 400 `validacion` con `detalles` si el body es inválido o sucursal/servicio no existen | R6 |
| Todas las fechas en UTC ISO 8601 (D-02); tests con node:test y app.request() | R7 (y todos) |
