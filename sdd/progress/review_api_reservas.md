# Review — feature #1 (api_reservas)

**Veredicto:** APPROVED

> Revisión ejecutada el 2026-09-21 sobre el código de `apps/api` tal como quedó en bootstrap (#1 no pasó por rama de feature: ver `history.md`). Todo lo de abajo lo re-ejecuté; ningún número del impl report se acepta sin reproducirlo. No edité código.

## 1. Trazabilidad R<n> ↔ tests

- R1: [x] `disponibilidad.test.ts` (3 tests) + `app.test.ts` "GET /api/disponibilidad devuelve slots en UTC y vacío los domingos". Verifiqué a mano que para `nunoa` (`09:00-19:00`) en un día de invierno el primer slot es `13:00:00.000Z` y el último `22:30:00.000Z` (20 slots).
- R2: [x] `disponibilidad.test.ts` "quita los slots ya reservados" + el test HTTP de creación, que consulta la disponibilidad antes y después del POST.
- R3: [x] `app.test.ts` "GET /api/disponibilidad valida parámetros" cubre: sin `sucursal`, sin `fecha`, `fecha=2026-13-40`, sucursal inexistente (404).
- R4: [x] `reservas.test.ts` (código + body válido) y `app.test.ts` (POST 201 → GET por código → mismos campos; 404 con código inexistente).
- R5: [x] `app.test.ts` "responde 409 si el horario ya está tomado o está fuera del horario": segundo POST al mismo slot → 409; POST a las `03:00Z` (fuera de horario) → 409.
- R6: [x] `reservas.test.ts` "acumula todos los problemas en detalles" (un detalle por campo faltante, no se corta en el primero) + `app.test.ts` con sucursal inexistente → 400 con el detalle correspondiente.
- R7: [x] `fechas.test.ts` en ambas estaciones + `disponibilidad.test.ts` "respeta el cambio de hora". Confirmé que ninguna columna ni respuesta lleva hora local: `grep -rn "toLocale\|getHours" apps/api/src` → 0 resultados.

## 2. Tasks

T1–T8 `[x]` en `sdd/specs/api_reservas/tasks.md`. Sin pendientes ni justificaciones.

## 3. QA por área (re-ejecutada)

- `api`: `npm run typecheck -w apps/api` → 0 errores · `npm test -w apps/api` → `tests 27 · pass 27 · fail 0 · skipped 0`.
- `harness`: `npm run qa:harness` → hook 39/39 ok · `check.mjs` OK (1 in_progress durante la revisión: la propia #1).

## 4. ADRs

- D-01: [x] todo el cambio vive en el área `api` (`apps/api/`); n/a rama y scope de commits (bootstrap).
- D-02: [x] UTC en respuestas y columnas (`inicio`, `creada_en` con `Z`); conversión local → UTC concentrada en `dominio/fechas.ts`.

## 5. Checkpoints (`sdd/CHECKPOINTS.md`)

- C1 estado coherente: [x] · C2 spec válido (EARS, acceptance cubierto): [x] · C3 trazabilidad: [x] · C4 QA real: [x] · C5 convenciones + ADRs: [x] · C6 higiene (rama, scope): n/a en bootstrap · main intacto por agentes: [x].

## 6. Guía de validación — puerta 2

> Con `npm run dev` corriendo (API en `:3001`). Fecha de ejemplo: un martes.

1. `curl -s "localhost:3001/api/disponibilidad?sucursal=providencia&fecha=2026-09-22" | jq '.slots | length, .[0], .[-1]'` → esperado: `22`, `"2026-09-22T12:00:00.000Z"`, `"2026-09-22T22:30:00.000Z"` (09:00–20:00 Santiago en UTC-3; el último slot cabe completo antes del cierre). **Cubre R1, R7.**
2. `curl -s -X POST localhost:3001/api/reservas -H 'content-type: application/json' -d '{"sucursal":"providencia","servicio":"limpieza","inicio":"2026-09-22T12:00:00.000Z","paciente":{"nombre":"Ana Soto","email":"ana@ejemplo.cl","telefono":"+56912345678"}}' | jq '.codigo, .estado'` → esperado: un código de 6 caracteres (p. ej. `"NB7K2Q"`) y `"confirmada"`. Repite el paso 1: ahora `21` slots y el primero es `12:30:00.000Z`. **Cubre R2, R4.**
3. Repite exactamente el `curl` del paso 2 → esperado: HTTP 409 `{ "error": "horario_no_disponible" }`. **Cubre R5.**
4. `curl -s -X POST localhost:3001/api/reservas -H 'content-type: application/json' -d '{"sucursal":"no-existe","paciente":{"nombre":"A"}}' | jq` → esperado: HTTP 400 `{ "error": "validacion", "detalles": [...] }` con 5 detalles acumulados (servicio obligatorio, inicio obligatorio, nombre corto, email inválido, teléfono corto). La existencia de la sucursal se comprueba solo cuando el body ya es válido. **Cubre R3, R6.**

Si los cuatro pasos dan lo esperado, la puerta 2 está validada y el orchestrator puede mergear `--no-ff` a `develop`.

## 7. Observaciones (no bloqueantes)

- `GET /api/reservas/:codigo` no distingue mayúsculas: `nb7k2q` → 404. Aceptable (el código se muestra siempre en mayúsculas); si molesta, es una feature `trivial` aparte.
- La base `apps/api/data/nebula.db` está en `.gitignore`; `npm run seed -w apps/api` la regenera.
