# Arnés de agentes — Nébula Dental

Un **arnés** es lo que pones alrededor del modelo para que trabaje solo sin romper nada: **reglas** que no dependen de que obedezca, **herramientas** que le enseñan cómo se hace aquí, y **memoria** en disco para que el estado no viva en el chat. Este repo es un arnés completo para Claude Code, montado sobre un proyecto chico y real para que lo veas funcionar de punta a punta, no en diapositivas.

```
                 ┌──────────── REGLAS ────────────┐
                 │ AGENTS.md · settings.json      │
                 │ hooks/guard_bash.sh            │
                 └───────────────┬────────────────┘
 ┌── HERRAMIENTAS ──┐            │            ┌──── MEMORIA ────┐
 │ skills/          │      ┌─────┴─────┐      │ sdd/ · docs/    │
 │  api-endpoint    ├──────┤  MODELO   ├──────┤  feature_list   │
 │  web-componente  │      └─────┬─────┘      │  specs/ progress│
 │  commit          │            │            │  decisions-log  │
 └──────────────────┘            │            └─────────────────┘
                     ┌───────────┴───────────┐
                     │ orchestrator  reparte │
                     │ spec          planifica
                     │ implementer   ejecuta │
                     │ revisor       revisa  │
                     └───────────────────────┘
```

Cuatro agentes: el **orchestrator** reparte y no escribe código; el **spec** planifica; el **implementer** ejecuta; el **revisor** aprueba o rechaza y deja la guía de validación. Y un loop con **dos puertas humanas**: tú apruebas el spec antes de que exista código, y validas el resultado antes de que entre a `develop`. Entre las dos, los agentes corren solos.

## El proyecto: Nébula Dental

Clínica dental ficticia con cuatro sucursales. Dos apps:

- **`apps/web`** — sitio con reserva de horas (Vite + React 19 + TypeScript + Three.js). Rutas: `/`, `/sucursales`, `/servicios`, `/reservar`, `/reserva/:codigo`.
- **`apps/api`** — API de disponibilidad y reservas (Hono + `node:sqlite`, TypeScript nativo en Node, sin build). Contrato en `docs/API-CONTRATO.md`.

```bash
npm install
npm run dev          # API en http://localhost:3001 · web en http://localhost:5173
```

## Mapa del repo

| Carpeta / archivo | Caja del arnés | Para qué |
|---|---|---|
| `AGENTS.md` (+ `CLAUDE.md` = `@AGENTS.md`) | Reglas | El doc maestro: mapa de áreas, las 5 reglas no negociables, qué skill se invoca cuándo. |
| `.claude/settings.json` | Reglas | `permissions.deny` (force push), `permissions.allow` (lo rutinario, para que el loop no pregunte) y el hook `PreToolUse`. |
| `.claude/hooks/` | Reglas | `guard_bash.sh`: frena escritura sobre `main`, force push y `rm -rf` peligroso, con lógica que un patrón no puede expresar. Con su test (`tests/`) y su README. |
| `.claude/skills/` | Herramientas | `api-endpoint`, `web-componente`, `commit`: el "cómo se hace aquí" de cada acción, con comandos reales. |
| `.claude/agents/` | Los 4 agentes | `orchestrator`, `spec`, `implementer`, `revisor`: qué hace cada uno, qué no hace, qué devuelve. |
| `sdd/feature_list.json` | Memoria | La cola de trabajo. Estado de cada feature, `spec_aprobado`, dependencias. |
| `sdd/specs/<name>/` | Memoria | Un spec por feature: `requirements.md` (EARS), `design.md`, `tasks.md`. |
| `sdd/progress/` | Memoria | Lo que pasó: `current.md`, `history.md`, `impl_<name>.md`, `review_<name>.md` (con la guía de validación). |
| `sdd/tools/check.mjs` · `sdd/CHECKPOINTS.md` | Memoria | Validador del estado del loop y checklist que recorre el revisor. |
| `docs/SDD.md` · `docs/VERIFICATION.md` · `docs/decisions-log.md` | Memoria | El proceso, la QA por área y los ADRs (el "por qué"). |
| `apps/api` · `apps/web` | El proyecto | El código que los agentes tocan. |

## El loop

```
pending → [spec] → spec_ready → ⏸ PUERTA 1: apruebas el spec → in_progress
        → [implementer] → in_review → [revisor] → merge_ready → ⏸ PUERTA 2: validas
              ├─ confirmas → merge --no-ff a develop → done
              └─ rechazas  → in_progress (el implementer aplica tu feedback)
```

Tres ramas: `main` (solo humano), `develop` (donde mergean los agentes tras la puerta 2), `feat/<id>-<name>` (una por feature). **`main` nunca lo toca una máquina**: el hook lo bloquea aunque el modelo se confunda.

## Cómo partir

1. Abre Claude Code en la raíz del repo (`claude`), en auto mode. `CLAUDE.md` carga `AGENTS.md`; el hook y las skills ya están cableados en `.claude/`.
2. Escribe: **"escribe los specs de todas las tareas pending"**. El orchestrator lanza un `spec` por cada feature de la cola (#2, #3, #4) y para en la puerta 1.
3. Lee `sdd/specs/<name>/` de cada una. Cuando estés de acuerdo: **"apruebo los specs"** (o "apruebo el 2 y el 3"). Queda `spec_aprobado` en cada feature.
4. Escribe: **"implementa todas las aprobadas"**. Vete. El orchestrator encadena las features una a una (rama → implementer → revisor → `merge_ready`) sin parar entre ellas.
5. Al volver, abre `sdd/progress/review_<name>.md` de cada una y sigue su **guía de validación** (3-4 pasos con `curl` o URL, con `npm run dev` corriendo).
6. **"confirmo la 2"** → merge `--no-ff` a `develop` y `done`. **"rechazo la 3: <motivo>"** → vuelve al implementer con tu feedback. Cuando quieras, `develop → main` lo haces tú, a mano.

## La rama `desde-cero`

`git checkout desde-cero` te deja el proyecto **sin arnés**: solo `apps/`, `docs/API-CONTRATO.md` y el `package.json`. Es el punto de partida para montar el arnés a mano siguiendo el video, archivo por archivo. `main` tiene el resultado terminado.

## QA

```bash
npm run qa            # typecheck + test + build de apps/api y apps/web
npm run qa:harness    # test del hook (39 casos) + validador del estado SDD
```

Cada área tiene su comando propio en `docs/VERIFICATION.md`; el implementer lo corre después de cada task y el revisor lo vuelve a correr antes de aprobar.

## Requisitos

- Node ≥ 22.13 (`.nvmrc`); `node:sqlite` y TypeScript nativo vienen con Node, sin pasos extra.
- [Claude Code](https://docs.claude.com/en/docs/claude-code) instalado.
- `jq` opcional (el hook cae a `python3` si no está).

## Licencia

MIT. Úsalo, cámbialo, móntalo sobre tu propio proyecto.
