# .claude/hooks/ — las reglas que no dependen de que el modelo obedezca

Un `AGENTS.md` le dice al modelo qué no hacer. Un hook lo **impide**. Esta carpeta es la parte del arnés que corre aunque el modelo se equivoque, se confunda de rama o lea una instrucción envenenada en un archivo.

## Las dos capas

| Capa | Dónde | Qué frena | Por qué ahí |
|---|---|---|---|
| `permissions.deny` | `.claude/settings.json` | Force push (`git push --force*`, `git push * --force*`, `git push * -f *`) | Es un patrón de string. Barato, corre antes que cualquier clasificador, no necesita script. Lo que un patrón puede expresar, va aquí. |
| Hook `PreToolUse` | `.claude/hooks/guard_bash.sh` | R1 escritura sobre `main` · R2 force push (red doble) · R3 `rm -rf` peligroso | Necesita **lógica**: saber en qué rama estamos, resolver rutas contra el cwd, tolerar `git -C dir push`. Un patrón no puede. |

`main` no está en `permissions.deny` a propósito: un patrón `*main*` frenaría `git log main` o `git checkout -b feat/9-main-menu`. La detección de `main` es exclusiva del hook, que sí sabe distinguir leer de escribir.

`permissions.allow` (mismo `settings.json`) es la otra mitad: lo rutinario del proyecto (`npm run *`, `git commit *`, `git merge --no-ff *`, `curl localhost*`…) pasa sin preguntar, para que el loop corra solo por la noche. Lo que no está en `allow` ni en `deny` sigue el flujo normal de permisos.

## Qué hace el hook

`guard_bash.sh` recibe por stdin el JSON del evento (`tool_input.command`, `cwd`) y responde:

- **deny**: imprime `{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"R1: …"}}`. Esa razón la ve el agente (y tú, en cámara).
- **allow**: no imprime nada, exit 0. El comando sigue al flujo normal.

Las tres reglas, en una línea cada una:

- **R1 — main.** `push` a `main` en cualquier forma (`origin main`, `HEAD:main`, `develop:refs/heads/main`, `--all`, `--mirror`), `push` sin refspec estando en `main` (resuelve la rama con `git -C "$cwd" rev-parse --abbrev-ref HEAD`; si no puede, deny), `merge`/`rebase` estando en `main` o nombrando `main`, `branch -f main`, `checkout -B main`, `switch -C main`.
- **R2 — force push.** `--force`, `--force-with-lease`, `-f` suelto o agrupado (`-fv`). Tolerante a opciones globales (`git -c k=v push -f`).
- **R3 — rm -rf.** Se permite solo si es trivialmente simple: rutas relativas, dentro del cwd, sin `..`, `~`, `$`, `;`, `&&`, `|`, backticks, paréntesis ni `cd`. Todo lo demás, deny. `rm -rf dist` pasa; `cd .. && rm -rf x` no.

**Comandos encadenados.** Una llamada a Bash puede traer varios comandos en una línea. El guard la parte por `&&`, `||`, `;` y `|`, evalúa **cada** segmento, y arrastra el cambio de rama: en `git checkout main && git merge --no-ff develop`, el merge se juzga como si ya estuviera en `main` — porque cuando corra, lo estará. (Antes solo se miraba el primer comando y esa línea se colaba; encontrado probando el guard en vivo el 2026-09-27.) `rm -rf` se sigue evaluando sobre la línea completa, porque su regla ya deniega ante cualquier metacarácter y partirla la debilitaría.

Fail-closed: `set -euo pipefail` + `trap ERR`. Si el JSON no se puede leer, si falta `command`, si falta `grep`/`git`/`jq`/`python3`, el hook deniega. Nunca degrada a "permitir" por un error interno.

## Cómo probar

```bash
npm run qa:harness          # = bash .claude/hooks/tests/test_guard_bash.sh && node sdd/tools/check.mjs
bash .claude/hooks/tests/test_guard_bash.sh   # solo el hook: 49 casos, una línea ok/FAIL por caso
```

El test no necesita nada instalado más allá de bash, python3 y git. Para los casos que dependen de la rama actual (push sin refspec, merge estando en main) crea dos repos temporales con `mktemp -d`, uno en `main` y otro en `develop`.

Probar un comando a mano:

```bash
echo '{"cwd":"'$PWD'","tool_input":{"command":"git push origin main"}}' | .claude/hooks/guard_bash.sh
```

## El límite honesto

Si `guard_bash.sh` **falta** o **no es ejecutable**, Claude Code trata el hook como error no bloqueante y el comando **procede**. Es fail-open y no se controla desde el script. Por eso:

1. El bit `+x` va **versionado en git** (`git ls-files -s .claude/hooks/guard_bash.sh` debe decir `100755`). Un clon fresco llega con el hook listo.
2. El force push tiene además su red en `permissions.deny`: aunque el hook desaparezca, lo obvio sigue frenado.
3. El test falla en la primera línea si el hook no es ejecutable.

Lo que el hook **no** cubre tampoco se promete: no inspecciona scripts que el agente escriba en disco y luego ejecute, ni comandos que pasen por otra tool que no sea `Bash`. Es un piso, no una jaula.

## Cómo agregar una regla

1. Escribe el predicado como función en `guard_bash.sh` (`es_X() { …; return 0|1; }`), usando `has "$1" '<regex>'` para patrones y `git_sub "$1"` si depende del subcomando de git. Cuidado con `set -e`: toda comprobación que pueda fallar va en un `if`, un `||` o un `&&`.
2. Añade el `emit_deny "R4: …"` en el bloque de evaluación, con razón en español que explique **qué hacer en su lugar**.
3. Añade los casos al test: al menos un `deny` por variante y un `allow` vecino que descarte falsos positivos (si bloqueas `docker push`, prueba que `docker ps` pase).
4. `npm run qa:harness` en verde. Actualiza la tabla de este README.

Si la regla es un patrón de string puro (sin rama ni cwd), va en `permissions.deny` del `settings.json`, no aquí.
