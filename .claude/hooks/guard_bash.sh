#!/usr/bin/env bash
# guard_bash.sh — hook PreToolUse (matcher "Bash") del arnés de Nébula Dental.
#
# Lo cablea .claude/settings.json:  "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard_bash.sh"
# Claude Code le pasa por stdin el JSON del evento; de ahí sacamos tool_input.command y cwd.
#
# LA PARTICIÓN (qué vive dónde):
#   - permissions.deny (settings.json) = patrones de string. Barato, corre ANTES del
#     clasificador de auto mode, y no necesita script. Sirve para lo que un patrón puede
#     expresar: el force push.
#   - este hook = lo que necesita LÓGICA: saber en qué rama estamos (push sin refspec),
#     resolver rutas contra el cwd (rm -rf), tolerar opciones globales de git (git -C dir push).
#
# TRES REGLAS:
#   R1  escritura sobre main   (push a main, push sin refspec estando en main, --all/--mirror,
#                               merge/rebase en main o nombrando main, branch -f / checkout -B / switch -C main)
#   R2  force push             (--force, --force-with-lease, -f agrupado) — red doble: settings.json ya lo frena
#   R3  rm -rf                 fuera del cwd o con metacaracteres / cd / rutas absolutas / .. / ~
#
# SEÑALES:
#   deny  = stdout con JSON hookSpecificOutput.permissionDecision="deny" (exit 0), o exit 2 (trap).
#   allow = stdout vacío + exit 0 (sigue el flujo normal de permisos: allow-list, ask, etc.).
#
# FAIL-CLOSED: set -euo pipefail + trap ERR. Si algo falla dentro del script (jq roto, JSON
# ilegible, sin command) → deny. Nunca degrada a "permitir" por un error interno.
#
# LÍMITE HONESTO: si este archivo FALTA o NO es ejecutable, Claude Code trata el hook como
# error no bloqueante y el comando PROCEDE (fail-open). Eso no se controla desde aquí.
# Por eso el bit +x va versionado en git (mode 100755) y el force push tiene además su
# red en permissions.deny.

set -euo pipefail
set -f   # sin globbing: tokenizamos comandos con `set -- $cmd` y no queremos que un '*' expanda

emit_deny() {
  local esc="${1//\\/\\\\}"; esc="${esc//\"/\\\"}"
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$esc"
  exit 0
}
trap 'printf "guard_bash.sh: fail-closed (error interno)\n" >&2; exit 2' ERR

# --- Entrada ------------------------------------------------------------------
for bin in grep git; do command -v "$bin" >/dev/null 2>&1 || emit_deny "fail-closed: falta '$bin' en PATH; el guard no puede evaluar."; done
command -v jq >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || emit_deny "fail-closed: falta jq o python3 para leer el evento."
RAW="$(cat || true)"

json_get() {  # $1 = ruta tipo .a.b ; imprime el valor o falla
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$RAW" | jq -er "$1 // empty" 2>/dev/null
  else
    printf '%s' "$RAW" | python3 -c '
import sys, json
obj = json.loads(sys.stdin.read())
for k in sys.argv[1].strip(".").split("."):
    obj = obj[k]
if obj is None or obj == "": sys.exit(1)
sys.stdout.write(str(obj))' "$1" 2>/dev/null
  fi
}

CMD="$(json_get '.tool_input.command')" || emit_deny "fail-closed: no pude leer tool_input.command del evento."
[ -n "$CMD" ] || emit_deny "fail-closed: comando vacío."
CWD="$(json_get '.cwd' || true)"

# --- Helpers ------------------------------------------------------------------

# git_sub <cmd>: imprime el subcomando real de git, saltando opciones globales
# (git -C dir push · git -c k=v push · git --git-dir=x push). Vacío si no es git.
git_sub() {
  local tok seen=0 skip=0
  # shellcheck disable=SC2086
  set -- $1
  for tok in "$@"; do
    if [ "$seen" -eq 0 ]; then [ "$tok" = "git" ] && seen=1; continue; fi
    if [ "$skip" -eq 1 ]; then skip=0; continue; fi
    case "$tok" in
      -C|-c|--git-dir|--work-tree|--namespace) skip=1 ;;   # opción global con valor aparte
      -*) ;;                                               # otra opción global: saltar
      *) printf '%s' "$tok"; return 0 ;;
    esac
  done
  return 0
}

# push_refspecs <cmd>: imprime los argumentos posicionales del push DESPUÉS del remoto.
# Vacío = push sin refspec (la rama actual decide). "HEAD" también cuenta como sin refspec.
push_refspecs() {
  local tok seen=0 n=0 skip=0
  # shellcheck disable=SC2086
  set -- $1
  for tok in "$@"; do
    if [ "$seen" -eq 0 ]; then [ "$tok" = "push" ] && seen=1; continue; fi
    if [ "$skip" -eq 1 ]; then skip=0; continue; fi
    case "$tok" in
      -o|--push-option|--receive-pack|--exec|--repo) skip=1 ;;
      -*) ;;
      HEAD) ;;
      *) n=$((n+1)); [ "$n" -ge 2 ] && printf '%s ' "$tok" ;;
    esac
  done
  return 0
}

# rama_actual: rama de HEAD en el cwd del evento, o falla si no se puede resolver.
# RAMA_FORZADA la fija el bucle de segmentos cuando un "checkout/switch <rama>" previo
# en la MISMA línea ya cambió de rama: "git checkout main && git merge develop" tiene que
# evaluarse como si el merge ocurriera en main, porque para cuando corre, ocurre en main.
RAMA_FORZADA=""
rama_actual() {
  [ -n "$RAMA_FORZADA" ] && { printf '%s' "$RAMA_FORZADA"; return 0; }
  git -C "${CWD:-/nonexistent}" rev-parse --abbrev-ref HEAD 2>/dev/null
}

# destino_checkout: si el comando es un checkout/switch a una rama, imprime esa rama.
# Solo mira el primer argumento que no es opción; basta para seguir la pista de la rama.
destino_checkout() {
  local sub; sub="$(git_sub "$1")"
  case "$sub" in checkout|switch) : ;; *) return 1 ;; esac
  local tok visto=1
  # shellcheck disable=SC2086
  set -- $1
  for tok in "$@"; do
    if [ "$visto" -eq 1 ]; then [ "$tok" = "$sub" ] && visto=0; continue; fi
    case "$tok" in
      -b|-B|-c|-C|--track|-t) continue ;;
      -*) continue ;;
      --) continue ;;
      *) printf '%s' "$tok"; return 0 ;;
    esac
  done
  return 1
}

# partir_en_segmentos: separa una línea en los comandos que la componen (&&, ||, ;, |,
# salto de línea). Sin esto, el guard solo miraba el PRIMER comando y se colaba
# "git checkout main && git merge --no-ff develop".
partir_en_segmentos() {
  printf '%s' "$1" | sed -e 's/&&/\n/g' -e 's/||/\n/g' -e 's/;/\n/g' -e 's/|/\n/g'
}

has() { printf '%s' "$1" | grep -Eq -- "$2"; }   # has <texto> <regex>

# --- R2: force push -------------------------------------------------------------
is_force_push() {
  [ "$(git_sub "$1")" = "push" ] || return 1
  has "$1" '(^|[[:space:]])--force(-with-lease)?(=[^[:space:]]*)?([[:space:]]|$)' && return 0
  has "$1" '(^|[[:space:]])-[A-Za-z]*f[A-Za-z]*([[:space:]]|$)' && return 0   # -f, -fv, -vf
  return 1
}

# --- R1: escritura sobre main ---------------------------------------------------
writes_to_main() {
  local sub; sub="$(git_sub "$1")"
  case "$sub" in
    branch)          has "$1" '(^|[[:space:]])(-[A-Za-z]*f[A-Za-z]*|--force)([[:space:]]+[^[:space:]]+)*[[:space:]]+main([[:space:]]|$)' && return 0 ;;
    checkout|switch) has "$1" '(^|[[:space:]])-[A-Za-z]*[BC][A-Za-z]*([[:space:]]+[^[:space:]]+)*[[:space:]]+main([[:space:]]|$)' && return 0 ;;
    merge|rebase)
      has "$1" '(^|[[:space:]])(refs/heads/)?main([[:space:]]|$)' && return 0        # nombra main
      local cur; cur="$(rama_actual)" || return 0                                   # no sé dónde estoy → deny
      [ "$cur" = "main" ] && return 0 ;;                                            # estoy en main → deny
    push)
      has "$1" '(^|[[:space:]])--(all|mirror)([[:space:]]|=|$)' && return 0        # empuja todas las ramas
      has "$1" ':(refs/heads/)?main([[:space:]]|$)' && return 0                      # destino explícito main
      has "$1" '(^|[[:space:]])(refs/heads/)?main([[:space:]]|$)' && return 0        # push origin main
      local specs; specs="$(push_refspecs "$1")"
      if [ -z "$specs" ]; then                                                      # sin refspec: decide HEAD
        local cur; cur="$(rama_actual)" || return 0                                 # no resoluble → deny
        [ "$cur" = "main" ] && return 0
      fi ;;
  esac
  return 1
}

# --- R3: rm -rf ---------------------------------------------------------------------
rmrf_peligroso() {
  has "$1" '(^|[[:space:]])rm([[:space:]]|$)' || return 1
  { has "$1" '(^|[[:space:]])-[A-Za-z]*[rR][A-Za-z]*([[:space:]]|$)' || has "$1" '(^|[[:space:]])--recursive([[:space:]]|$)'; } || return 1
  { has "$1" '(^|[[:space:]])-[A-Za-z]*f[A-Za-z]*([[:space:]]|$)'    || has "$1" '(^|[[:space:]])--force([[:space:]]|$)'; }     || return 1
  # Es un rm -rf. Solo se permite si es trivialmente simple y queda dentro del cwd.
  case "$1" in *';'*|*'&'*|*'|'*|*'$'*|*'`'*|*'..'*|*'~'*|*'('*|*')'*|*$'\n'*) return 0 ;; esac
  has "$1" '(^|[[:space:]])(cd|pushd|popd)([[:space:]]|$)' && return 0
  [ -n "$CWD" ] || return 0                                   # sin cwd no puedo verificar → deny
  local tok seen=0
  # shellcheck disable=SC2086
  set -- $1
  for tok in "$@"; do
    if [ "$seen" -eq 0 ]; then [ "$tok" = "rm" ] && seen=1; continue; fi
    case "$tok" in -*) ;; /*) return 0 ;; .|./) return 0 ;; esac   # ruta absoluta o el cwd entero → deny
  done
  return 1
}

# --- Evaluación --------------------------------------------------------------------
# Se evalúa CADA comando de la línea, no solo el primero, y se arrastra el cambio de
# rama: si un segmento hace checkout a main, los siguientes se juzgan como si ya
# estuvieran en main.
evaluar_segmento() {
  local seg="$1"
  if is_force_push "$seg"; then
    emit_deny "R2: force push bloqueado (--force / -f / --force-with-lease). Los agentes no reescriben historia."
  fi
  if writes_to_main "$seg"; then
    if [ "$(git_sub "$seg")" = "push" ]; then
      emit_deny "R1: push a 'main' bloqueado. Los agentes mergean solo a 'develop' (puerta 2); main lo promueve un humano a mano."
    fi
    emit_deny "R1: escritura sobre 'main' bloqueada ($(git_sub "$seg")). Los agentes trabajan en feat/* y mergean solo a 'develop'; main nunca lo toca una máquina."
  fi
  if rmrf_peligroso "$seg"; then
    emit_deny "R3: 'rm -rf' bloqueado. Solo se permite con rutas relativas dentro del cwd, sin '..', '~', rutas absolutas, 'cd' ni metacaracteres. Separa el cd en otra llamada."
  fi
}

# rm -rf se evalúa sobre la línea COMPLETA: su regla ya deniega ante cualquier
# metacarácter, así que partirla la debilitaría.
if rmrf_peligroso "$CMD"; then
  emit_deny "R3: 'rm -rf' bloqueado. Solo se permite con rutas relativas dentro del cwd, sin '..', '~', rutas absolutas, 'cd' ni metacaracteres. Separa el cd en otra llamada."
fi

while IFS= read -r segmento; do
  [ -z "${segmento//[[:space:]]/}" ] && continue
  evaluar_segmento "$segmento"
  destino="$(destino_checkout "$segmento" || true)"
  [ -n "$destino" ] && RAMA_FORZADA="$destino"
done <<EOF_SEGMENTOS
$(partir_en_segmentos "$CMD")
EOF_SEGMENTOS

exit 0
