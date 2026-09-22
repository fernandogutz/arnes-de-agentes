# CHECKPOINTS — evaluación del estado final

> En un loop multiagente no se evalúa el camino, se evalúa el destino. El `revisor` recorre cada checkbox y rechaza si queda alguno vacío sin justificación.

## C1 — El estado del loop es coherente

- [ ] Como mucho una feature en `in_progress` en `sdd/feature_list.json` (`node sdd/tools/check.mjs` OK).
- [ ] Toda feature en `spec_ready` / `in_progress` / `in_review` / `merge_ready` / `done` tiene `sdd/specs/<name>/` con `requirements.md`, `design.md` y `tasks.md`.
- [ ] Toda feature más allá de `spec_ready` tiene `spec_aprobado` (alguien pasó la puerta 1).
- [ ] `sdd/progress/current.md` describe la sesión activa, sin restos de la anterior.

## C2 — El spec es válido

- [ ] `requirements.md` en EARS estricto (`docs/SDD.md`): un `DEBE` por R, id estable, `*Verificable por:*` en cada uno.
- [ ] Cada criterio del `acceptance` de la feature está cubierto por al menos un `R<n>` (tabla de trazabilidad al final).
- [ ] `design.md` lista archivos por área, al menos una alternativa descartada, y no contradice ningún ADR de `docs/decisions-log.md`.
- [ ] `tasks.md` con cada task etiquetada por área y con sus `R<n>`.

## C3 — Trazabilidad

- [ ] Cada `R<n>` tiene al menos un test concreto (archivo + nombre) que lo verifica.
- [ ] El mapa `R<n> → test` está en `sdd/progress/impl_<name>.md` y coincide con los tests que existen en la rama.
- [ ] Todas las tasks de `tasks.md` en `[x]`, o con justificación escrita en `impl_<name>.md`.

## C4 — La verificación es real (por área)

- [ ] Cada área tocada pasa su QA de `docs/VERIFICATION.md`, **re-ejecutada por el revisor** (no copiada del impl report).
- [ ] Sin tests desactivados, sin `any` nuevos, sin `@ts-ignore` sin justificar, sin `catch` vacíos.
- [ ] Si la feature tocó `sdd/` o `.claude/`: `npm run qa:harness` OK.

## C5 — Convenciones y ADRs

- [ ] Sigue la skill del área (`api-endpoint` / `web-componente`): errores `{ error, detalles? }`, lógica en `dominio/`, estilos con variables CSS, datos por hooks de `lib/api.ts`, etc.
- [ ] D-01 respetado: una rama, scope = área.
- [ ] D-02 respetado: fechas en UTC en la API; conversión local solo en el front. Ningún campo de fecha nuevo sin zona.
- [ ] Si la API cambió, `docs/API-CONTRATO.md` refleja el cambio.

## C6 — Higiene de entrega (puerta de merge)

- [ ] Rama `feat/<id>-<name>` creada desde `develop`; `develop` es ancestro de HEAD.
- [ ] Conventional Commits con scope = área (`api|web|harness`); un commit por área lógica; ninguno que mezcle áreas sin scope claro.
- [ ] `git status` limpio en la rama; nada generado (`dist/`, `*.db`) commiteado.
- [ ] Nada mergeado a `develop` ni `main`, ni push: la feature queda en `merge_ready` esperando la puerta 2.
- [ ] `main` intacto: `git log main` no muestra commits de la feature.
