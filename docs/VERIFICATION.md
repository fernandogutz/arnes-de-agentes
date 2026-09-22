# VERIFICATION — QA por área

> La verificación es **por área**, no global. El `implementer` la corre después de cada task y antes de commitear; el `revisor` la **vuelve a correr** antes de aprobar (no acepta el "pasa en mi máquina" del impl report). Una feature llega a `merge_ready` solo con la QA de cada área tocada en verde.

Todos los comandos se ejecutan desde la raíz del repo, con Node ≥ 22.13 (`.nvmrc`) y `npm install` hecho.

## Comandos por área

| Área | Directorio | QA |
|---|---|---|
| `harness` | `.claude/` + `docs/` + `sdd/` + raíz | `npm run qa:harness` (= `bash .claude/hooks/tests/test_guard_bash.sh && node sdd/tools/check.mjs`) |
| `api` | `apps/api/` | `npm run typecheck -w apps/api && npm test -w apps/api` |
| `web` | `apps/web/` | `npm run typecheck -w apps/web && npm test -w apps/web && npm run build -w apps/web` |
| todas | raíz | `npm run qa` (= typecheck + test + build de todos los workspaces) |

## Qué significa "verde"

- **`harness`**: el test del hook imprime `Resumen: N ok, 0 FAIL` y `check.mjs` imprime el conteo por estado y termina con `OK`. Exit 0 en ambos.
- **`api`**: `tsc --noEmit` sin errores; `node --test` con `fail 0` y ningún test `skip`/`todo` nuevo. Tests deterministas: la DB es `:memory:`, las fechas de prueba son fijas.
- **`web`**: `tsc` sin errores; `vitest run` con todos los tests `passed`; `vite build` termina con exit 0 y sin warnings nuevos de tamaño de chunk respecto a `develop`.

No cuenta como verde: tests desactivados para que pase, `any` nuevos para callar a `tsc`, `// @ts-ignore` sin justificación en el `design.md`, o un `catch` vacío.

## Quién corre qué

| Momento | Quién | Qué corre |
|---|---|---|
| Después de cada task | `implementer` | QA del área que tocó la task. Si falla, arregla antes de la siguiente task. |
| Antes de commitear | `implementer` | QA completa de cada área en `areas` de la feature. Anota el resultado en `sdd/progress/impl_<name>.md`. |
| Al revisar | `revisor` | La misma QA, de nuevo, en la rama `feat/<id>-<name>`. Más `npm run qa:harness` si la feature tocó `sdd/` o `.claude/`. Los números van en `review_<name>.md`. |
| Puerta 2 | humano | La **guía de validación** de `review_<name>.md`: 3-4 pasos con `curl` o URL contra `npm run dev`. Esto es lo único manual. |

## Evidencia de runtime (puerta 2)

Lo que necesita los servidores levantados (`npm run dev` → API en `:3001`, web en `:5173`) no es QA estática: es evidencia de la puerta 2 y la ejecuta el humano siguiendo la guía del revisor. El revisor puede ejecutarla también y dejar constancia, pero la confirmación es humana.

```bash
npm run dev                                   # api + web
curl -s localhost:3001/api/health | jq        # { "ok": true, "servicio": "nebula-api" }
```

## Reglas transversales

- Cero flakiness: si un test falla a veces, está mal escrito; se arregla, no se reintenta.
- Nada se mergea ni se pushea durante la QA. La rama `feat/<id>-<name>` queda lista y limpia (`git status` sin pendientes) para la puerta 2.
- Si una herramienta falla de forma rara (no por el código), el agente anota `blocked` en `sdd/progress/current.md` y para; no improvisa un workaround.
