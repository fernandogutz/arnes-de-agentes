---
name: commit
description: >
  Cómo se crean ramas y se commitea en este repo: rama `feat/<id>-<name>` desde `develop`, Conventional Commits con scope = área.
  Trigger: antes de `git commit`, al empezar una feature (crear su rama), o cuando hay cambios sin commitear que hay que dejar prolijos.
metadata:
  auto_invoke: "Commitear cambios o crear la rama de una feature"
---

## La rama

Una feature = **una rama** `feat/<id>-<name>`, donde `id` y `name` son los de `sdd/feature_list.json`. Nace de `develop` y vuelve a `develop`.

```bash
git checkout develop
git checkout -b feat/3-api_cancelar_reserva
```

Si la rama ya existe (sesión retomada), solo `git checkout feat/3-api_cancelar_reserva`. Verifica con `git branch --show-current` antes del primer commit: **nunca se commitea directo en `develop` ni en `main`**. El hook (`.claude/hooks/guard_bash.sh`) frena lo peor, pero la disciplina es tuya.

## El commit

Conventional Commits. El **scope es el área** de `AGENTS.md`: `api`, `web` o `harness`.

```
<tipo>(<área>): <qué cambia, en español, imperativo, ≤ 72 chars>

<por qué, si no es obvio. Referencia a la feature: #3 R2, R3>
```

Tipos: `feat` (funcionalidad), `fix` (corrección), `test` (solo tests), `docs` (solo documentación), `refactor`, `chore` (tooling).

```bash
git add apps/api/src/rutas/reservas.ts apps/api/src/dominio/reservas.ts apps/api/src/app.test.ts docs/API-CONTRATO.md
git commit -m "feat(api): DELETE /reservas/:codigo cancela la reserva y libera el slot" -m "#3 R1-R4. 404 si no existe, 409 reserva_ya_cancelada si ya estaba cancelada."
```

Reglas:

- **Un commit por área lógica.** Si la feature toca `api` y `web`, dos commits: `feat(api): …` y `feat(web): …`. Los cambios en `sdd/` y `docs/` de la misma feature pueden ir en el commit del área o en un `docs(harness): …` aparte; nunca un commit sin scope que mezcle todo.
- `git add` con rutas explícitas. Nada de `git add -A` sin mirar `git status` antes.
- Mensaje en español, sin punto final en el título, sin emojis.
- No commitees archivos generados (`dist/`, `*.db`, `coverage/`): ya están en `.gitignore`; si aparecen en `git status`, algo anda mal.

## Lo que esta skill NO hace

- **No pushea.** El repo del demo es local; si algún día hay remoto, el push lo hace el humano.
- **No mergea.** El merge `--no-ff` a `develop` lo ejecuta el orchestrator, y solo después de que el humano confirma la puerta 2.
- **No toca `main`.** Nunca. `develop → main` es un acto humano, a mano.

Si al terminar la feature quedan cambios sin commitear, el revisor la rechaza. Deja la rama limpia: `git status` sin nada pendiente.
