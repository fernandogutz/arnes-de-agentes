# Decisiones de arquitectura (ADRs)

> El **por qué** del proyecto, en formato corto: Contexto / Decisión / Consecuencias / Fecha. El `spec` lo lee antes de diseñar; el `revisor` rechaza cualquier cambio que contradiga una decisión cerrada. Si hay que revisar una, se abre una entrada nueva que la reemplace: no se edita la vieja en silencio.
>
> Append-only. Numeración estable `D-<nn>`.

---

## D-01 — Monorepo npm-workspaces con tres áreas

**Contexto.** Nébula Dental tiene una web y una API que evolucionan juntas (el front consume el contrato de la API en cada feature). Además vive aquí el arnés (agentes, hooks, specs), que necesita ver todo el código para revisar y verificar. Con repos separados cada feature que toca web + API serían dos ramas, dos PRs, dos estados en dos colas.

**Decisión.** Un solo repo git con npm workspaces (`apps/*`). Tres **áreas**, cada una un directorio con su propia QA:

| Área | Directorio |
|---|---|
| `harness` | `.claude/` + `docs/` + `sdd/` + raíz |
| `api` | `apps/api/` |
| `web` | `apps/web/` |

Una feature = **una rama** `feat/<id>-<name>` (aunque toque varias áreas). Commits Conventional con **scope = área** (`feat(api): …`, `feat(web): …`, `docs(harness): …`); un commit por área lógica cuando la feature toca varias.

**Alternativa descartada.** Repos separados (`nebula-web`, `nebula-api`, `nebula-harness`). Más limpio para deploy independiente, pero el loop de agentes tendría que coordinar tres repos por feature y el revisor no podría verificar el contrato web ↔ API en un solo diff. Para un proyecto de este tamaño, el costo de coordinación supera el beneficio.

**Consecuencias.**
- `sdd/feature_list.json` declara `areas: [...]` por feature; el implementer sabe qué QA correr por área (`docs/VERIFICATION.md`).
- El scope del commit no es opcional: sin scope claro el revisor rechaza.
- `npm run qa` desde la raíz corre typecheck + test + build de todos los workspaces; `npm run qa:harness` valida el arnés.

**Fecha.** 2026-09-21.

---

## D-02 — Fechas en UTC en la API; hora local solo en el front

**Contexto.** La clínica opera en `America/Santiago`, que cambia de UTC-4 a UTC-3 según la estación. La disponibilidad se calcula a partir de horarios locales ("09:00-20:00"), pero las reservas se comparan, ordenan y deduplican en la base de datos. Mezclar hora local y UTC en la API es la forma más rápida de reservar dos veces el mismo slot en el cambio de hora.

**Decisión.** Las fechas y horas se guardan y viajan en **UTC (ISO 8601)** en la API (`2026-09-22T13:00:00.000Z`). La conversión a hora local (`America/Santiago`) ocurre **solo en el front** (`apps/web/src/lib/fechas.ts`). Dentro de la API, la única conversión local → UTC vive en `apps/api/src/dominio/fechas.ts` y sirve para calcular los slots a partir del horario de la sucursal; el resultado ya sale en UTC.

**Alternativa descartada.** Guardar hora local con la zona como columna aparte. Legible en la base, pero cada comparación necesita convertir, y el índice único `(sucursal, inicio)` que respalda el 409 dejaría de ser trivial.

**Consecuencias.**
- **Cualquier campo de fecha nuevo en la API (p. ej. en el modelo de reserva) se guarda en UTC; nunca hora local ni timestamps sin zona.** Columna `TEXT` con ISO UTC, `Z` incluida.
- El front nunca envía hora local a la API: manda el ISO UTC que recibió en `/disponibilidad`.
- Los tests de fechas cubren las dos estaciones (UTC-3 y UTC-4).
- El contrato (`docs/API-CONTRATO.md`) lo declara en su primera línea.

**Fecha.** 2026-09-21.
