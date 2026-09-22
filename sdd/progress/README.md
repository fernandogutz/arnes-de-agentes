# sdd/progress/ — la evidencia del loop

Aquí queda lo que pasó, no lo que se planeó (eso está en `sdd/specs/`). Cada agente escribe su resultado en un archivo y devuelve al chat **solo la ruta** (regla 5 de `AGENTS.md`: anti-teléfono-descompuesto).

| Archivo | Quién lo escribe | Qué contiene |
|---|---|---|
| `current.md` | `orchestrator` e `implementer` | La sesión activa: feature en curso (o ninguna), cola con estados, bloqueos. Se sobrescribe al cambiar de feature. Es lo primero que lee el orchestrator al arrancar. |
| `history.md` | `orchestrator` | Bitácora append-only. Una entrada por feature `done`: rama, merge, qué se hizo, qué quedó fuera. |
| `impl_<name>.md` | `implementer` | Rama y commits, mapa `R<n> → test` (archivo y nombre del test), QA ejecutada con sus números, lo que no entró y por qué. |
| `review_<name>.md` | `revisor` | Veredicto `APPROVED` / `CHANGES_REQUESTED`, trazabilidad verificada, QA re-ejecutada, checkpoints C1–C6 y la **guía de validación** para la puerta 2 (3-4 pasos con `curl` o URL, resultado esperado, qué R cubre). |

Convención de nombres: `<name>` es el `name` de la feature en `sdd/feature_list.json` (`impl_api_cancelar_reserva.md`, `review_web_pagina_sucursal.md`).

Si el revisor rechaza, el implementer sobrescribe `impl_<name>.md` con la ronda nueva y el revisor sobrescribe `review_<name>.md`. La historia de rondas no se guarda aquí: está en los commits de la rama.
