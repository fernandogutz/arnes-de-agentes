# Nébula Dental — Arnés de agentes

Doc maestro del arnés con el que **construimos** Nébula Dental (web + API de reservas de una clínica dental). Loop multiagente Spec-Driven con **dos puertas humanas**: el humano aprueba el spec antes de que se escriba código (puerta 1) y valida el resultado antes de que entre a `develop` (puerta 2). Markdown/JSON local en `sdd/` = fuente de verdad. `CLAUDE.md` importa este archivo (`@AGENTS.md`).

## Mapa del proyecto

Monorepo npm-workspaces (D-01). Cada **área** es un directorio; el scope de los commits es el área.

| Área | Directorio | QA (desde la raíz) |
|---|---|---|
| `harness` | `.claude/` (agents · skills · hooks · settings.json) + `docs/` + `sdd/` + raíz | `npm run qa:harness` |
| `api` | `apps/api/` — Hono + node:sqlite, TypeScript nativo en Node | `npm run typecheck -w apps/api && npm test -w apps/api` |
| `web` | `apps/web/` — Vite + React 19 + TS + Three.js | `npm run typecheck -w apps/web && npm test -w apps/web && npm run build -w apps/web` |

Ramas: `main` (producción, solo humano) · `develop` (integración; los agentes mergean ahí `--no-ff` tras la puerta 2) · `feat/<id>-<name>` por feature, nace de `develop` y vuelve a `develop`. Contrato de la API: `docs/API-CONTRATO.md`.

## On-ramp: SDD para todo

Antes de implementar cualquier cosa, revisa `sdd/feature_list.json`. Si el trabajo no está ahí, **propón** agregarlo como `pending` (el humano confirma). No hay carril rápido: **toda** feature pasa por spec. Lo que escala es la mecánica (cuántos R<n>, cuántas tasks), no si hay spec: el spec es proporcional al `complexity` (`trivial` / `media` / `compleja`).

Proceso completo: `docs/SDD.md`. Agentes: `.claude/agents/` (`orchestrator` reparte · `spec` planifica · `implementer` ejecuta · `revisor` aprueba o rechaza y deja la guía de validación). QA por área: `docs/VERIFICATION.md`. Checklist final: `sdd/CHECKPOINTS.md`.

**La sesión principal de Claude Code ES el orchestrator.** Ante cualquier orden sobre la cola ("escribe los specs de todas las tareas pending", "apruebo los specs", "implementa todas las aprobadas", "corre el loop", "confirmo la N"), lee `.claude/agents/orchestrator.md` y síguelo tal cual: delegas en `spec` / `implementer` / `revisor` con la tool `Agent` (`subagent_type` = nombre del agente), pasando solo rutas. No lo delegues a un subagente "orchestrator": los subagentes no pueden lanzar otros subagentes, así que el reparto se hace desde la sesión principal.

## Contexto

- `docs/decisions-log.md` — ADRs (D-01 monorepo y áreas, D-02 fechas UTC). **Leer antes de proponer arquitectura.** Un design que contradiga un ADR se marca `blocked`, no se implementa.
- `docs/API-CONTRATO.md` — rutas, tipos y errores de la API. Se actualiza **antes** que el código.
- `sdd/specs/api_reservas/` + `sdd/progress/{impl,review}_api_reservas.md` — feature #1 cerrada; es el ejemplo del nivel esperado.

### Skills: cuándo se cargan solas

Antes de hacer cualquiera de estas acciones, carga SIEMPRE la skill correspondiente PRIMERO:

| Acción | Skill |
|--------|-------|
| Agregar o modificar un endpoint de la API (`apps/api`) | `api-endpoint` |
| Agregar o modificar un componente o página de la web (`apps/web`) | `web-componente` |
| Commitear cambios o crear la rama de una feature | `commit` |

## Reglas críticas — NO NEGOCIABLES

1. **Las dos puertas humanas.** Puerta 1: el humano aprueba el spec antes de implementar (queda `spec_aprobado` en la feature). Puerta 2: el humano valida con la guía del revisor antes del merge. Ningún agente las salta, ni para un cambio "chico".
2. **`main` nunca lo toca una máquina.** Los agentes mergean **solo a `develop`**, con `--no-ff`, y solo tras la confirmación de la puerta 2. Promover `develop → main` es siempre humano, a mano. El hook `.claude/hooks/guard_bash.sh` lo impide; esta regla lo hace explícito.
3. **Una sola feature en `in_progress`** a la vez. `node sdd/tools/check.mjs` falla si hay dos.
4. **Una rama `feat/<id>-<name>` por feature y Conventional Commits con scope = área** (`feat(api): …`, `feat(web): …`, `docs(harness): …`). Cuando una feature toca varias áreas, un commit por área lógica; nunca un commit sin scope que mezcle.
5. **Anti-teléfono-descompuesto.** Cada subagente escribe su resultado en disco y devuelve **solo la ruta** (`spec_ready -> sdd/specs/<name>/`, `done -> sdd/progress/impl_<name>.md`, `APPROVED -> sdd/progress/review_<name>.md`). El contenido nunca viaja por chat; el siguiente agente lo lee del archivo.

## Cuándo NO actúas como orchestrator

- Preguntas conceptuales, exploración o lectura pura → responde directo.
- Cambios solo en `docs/` o en `sdd/progress/` → edítalos directo, sin lanzar agentes.
