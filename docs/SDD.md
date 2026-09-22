# SDD — el proceso que siguen los agentes

> Spec-Driven Development: **requirements → design → tasks → código**, con dos puertas humanas. No se escribe código hasta que el spec está aprobado; no se mergea nada hasta que un humano validó el resultado. Markdown y JSON locales son la fuente de verdad: si no está en `sdd/`, no existe.

Los agentes viven en `.claude/agents/` (`orchestrator` reparte, `spec` planifica, `implementer` ejecuta, `revisor` aprueba o rechaza). El estado vive en `sdd/`: la cola en `feature_list.json`, los specs en `specs/<name>/`, la evidencia en `progress/`. El código vive en `apps/api` y `apps/web`.

## SDD para todo

**Toda** feature pasa por spec, incluso un fix de una línea. Lo que escala con el tamaño es la **mecánica** (cuánta exploración, cuántos R<n>, cuántas tasks), no si hay spec. El `complexity` de la feature fija la escala:

| `complexity` | `requirements.md` | `design.md` | `tasks.md` |
|---|---|---|---|
| `trivial` (1 archivo, 1 área) | 1-3 R<n> | 3-5 líneas: archivo a tocar + alternativa descartada | 2-3 tasks |
| `media` (2-5 archivos, 1-2 áreas) | 3-8 R<n> | archivos por área, firmas nuevas, una alternativa descartada | 4-8 tasks |
| `compleja` (módulo nuevo, refactor, varias áreas) | spec completo, puede requerir exploración previa | archivos por área, contratos, riesgos, alternativas | tasks por área en orden de dependencia |

## Estados y las dos puertas

```
pending → [spec] → spec_ready → ⏸ PUERTA 1: el humano aprueba el spec → in_progress
        → [implementer] → in_review → [revisor] → merge_ready → ⏸ PUERTA 2: el humano valida
              ├─ confirma → [orchestrator mergea --no-ff a develop] → done
              └─ rechaza  → in_progress (el implementer aplica el feedback)
```

| Estado | Significado | Quién lo escribe |
|---|---|---|
| `pending` | En la cola, sin spec. | humano (o el orchestrator, con confirmación humana) |
| `spec_ready` | Spec escrito en `sdd/specs/<name>/`. **Puerta 1**: esperando aprobación. No se toca código. | `spec` |
| `in_progress` | Spec aprobado. El `implementer` trabaja en la rama `feat/<id>-<name>`. Solo una a la vez. | `orchestrator` |
| `in_review` | El `revisor` está evaluando el trabajo. | `orchestrator` |
| `merge_ready` | Revisor aprobó y dejó la guía de validación. **Puerta 2**: esperando al humano. | `orchestrator` |
| `done` | El humano confirmó; la rama está mergeada en `develop`; el resumen está en `history.md`. | `orchestrator` |
| `blocked` | Atascada. La razón está en `sdd/progress/current.md`. | cualquiera |

**Por qué dos puertas.** La puerta 1 te da control del **qué** antes de que alguien gaste horas en el **cómo**: leer un spec de 40 líneas cuesta dos minutos; deshacer una implementación equivocada cuesta una tarde. La puerta 2 es la validación del resultado: el revisor te deja una guía de 3-4 pasos con curl o URL, tú la sigues, y solo si confirmas el código entra a `develop`. Entre las dos puertas los agentes corren solos.

**`main` nunca lo toca una máquina.** Los agentes mergean solo a `develop` (`--no-ff`, tras la puerta 2). Promover `develop → main` es siempre un acto humano, a mano. El hook `.claude/hooks/guard_bash.sh` lo hace físicamente imposible; esta regla lo hace explícito.

## Cómo se registra la aprobación de la puerta 1

El humano aprueba en el chat ("apruebo los specs", "aprobado el 2 y el 3"). El orchestrator responde escribiendo en la feature, dentro de `sdd/feature_list.json`:

```json
"status": "spec_ready",
"spec_aprobado": "2026-09-22T21:40:00Z"
```

La feature **sigue en `spec_ready`** hasta que le toca: `in_progress` es un estado exclusivo (una sola a la vez), y la aprobación no es lo mismo que empezar. El orden de ejecución es por `id` ascendente entre las aprobadas, respetando `depends_on`.

## La noche

Con varias features aprobadas, la orden "implementa todas las aprobadas" hace que el orchestrator las **encadene**: toma la primera aprobada → `in_progress` → rama → implementer → `in_review` → revisor → `merge_ready`, y pasa a la siguiente **sin parar**. Ninguna cruza la puerta 2 sola: al terminar la cola (o al bloquearse una), el orchestrator presenta las guías de validación de todas las `merge_ready` y PARA.

Al volver, el humano atiende la puerta 2 **por feature**: sigue la guía de `sdd/progress/review_<name>.md`, confirma o rechaza. Cada confirmación es un merge `--no-ff` independiente a `develop`. Si rechaza una, esa vuelve a `in_progress` con el feedback; las demás no se ven afectadas.

## `requirements.md` — EARS estricto

Cada requirement es un párrafo numerado (`R1`, `R2`, …) con **uno** de estos patrones:

| Patrón | Plantilla | Cuándo |
|---|---|---|
| Ubicuo | `El sistema DEBE <acción>.` | siempre cierto, sin disparador |
| Evento | `CUANDO <disparador>, el sistema DEBE <acción>.` | responde a algo que pasa |
| Estado | `MIENTRAS <estado>, el sistema DEBE <acción>.` | vale durante una condición |
| Opcional | `DONDE <feature opcional>, el sistema DEBE <acción>.` | solo si una capacidad está presente |
| No deseado | `SI <evento no deseado> ENTONCES el sistema DEBE <acción>.` | manejo de error o abuso |

Reglas: id estable (no se renumera); **un solo `DEBE` por requirement**; solo `DEBE` / `NO DEBE` (nada de "podría", "debería", "soporta"); cada `R<n>` termina con `*Verificable por:*` y el nombre del test que lo cubrirá. Cada criterio del `acceptance` de la feature tiene al menos un `R<n>`; la tabla de trazabilidad al final del archivo lo demuestra.

## `design.md` — decisiones técnicas

Antes de tocar código: **archivos a crear o modificar, por área** (`api` / `web` / `harness`); firmas, rutas y campos nuevos; cambios en `docs/API-CONTRATO.md` si la API cambia; **al menos una alternativa descartada** con su porqué. Lee `docs/decisions-log.md` antes: un design **no contradice un ADR cerrado**. Si el spec necesita romper uno, la feature pasa a `blocked` y se discute con el humano; nunca se rompe en silencio.

## `tasks.md` — checklist ejecutable

Pasos discretos en orden, cada uno con área y los `R<n>` que cubre:

```markdown
- [ ] T1 (api) — `cancelarReserva(db, codigo)` en `dominio/reservas.ts` + test unitario. Cubre: R1, R3.
- [ ] T2 (api) — `DELETE /:codigo` en `rutas/reservas.ts`; 404 / 409. Cubre: R1, R2, R3.
- [ ] T3 (api) — Tests de la app con `app.request()`; actualizar `docs/API-CONTRATO.md`. Cubre: R1-R4.
```

El `implementer` marca `[x]` al terminar cada una (con su test verde). El `revisor` rechaza si queda `[ ]` sin justificación escrita en `impl_<name>.md`.

## Trazabilidad R<n> ↔ test

**Verificable por un test = el loop sabe cuándo parar.** Sin esto, "terminado" es opinión del modelo. Con esto, es un comando que sale 0.

- El `spec` escribe cada `R<n>` de modo que exista un test concreto que lo pruebe. Si no puede, lo parte o lo marca blocker.
- El `implementer` documenta el mapa `R<n> → archivo::nombre del test` en `sdd/progress/impl_<name>.md`.
- El `revisor` verifica el mapa, **vuelve a correr** la QA del área (`docs/VERIFICATION.md`) y no aprueba con un `R<n>` sin test.

## Archivos de `sdd/progress/`

| Archivo | Quién | Qué |
|---|---|---|
| `current.md` | orchestrator, implementer | Feature en curso, cola, bloqueos. Se sobrescribe. |
| `history.md` | orchestrator | Bitácora append-only de features `done`. |
| `impl_<name>.md` | implementer | Rama, commits, mapa R<n> → test, QA ejecutada, lo que quedó fuera. |
| `review_<name>.md` | revisor | Veredicto, trazabilidad, checkpoints y **guía de validación** para la puerta 2. |

## El estado en git

`sdd/feature_list.json` y `sdd/progress/current.md` se editan y commitean **solo en `develop`**, por el orchestrator (`chore(harness): …`). Lo que pertenece a una feature (`sdd/specs/<name>/`, `impl_<name>.md`, `review_<name>.md`) viaja en su rama `feat/<id>-<name>` y llega a `develop` con el merge `--no-ff`. Así dos ramas nunca tocan el mismo archivo de estado y el merge no choca.
