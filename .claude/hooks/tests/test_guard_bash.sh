#!/usr/bin/env bash
# test_guard_bash.sh — alimenta JSON de PreToolUse al hook y verifica allow/deny.
# Sin dependencias: bash + python3 (para armar el JSON) + git (repos temporales).
# Correr: bash .claude/hooks/tests/test_guard_bash.sh   (o `npm run qa:harness`)
# Bloqueo = stdout contiene "permissionDecision":"deny"  O  exit code 2 (fail-closed).

set -uo pipefail
set -f

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GUARD="$HERE/../guard_bash.sh"
PASS=0; FAIL=0

[ -x "$GUARD" ] || { echo "FAIL: el hook no es ejecutable: $GUARD (chmod +x y versiona el bit)"; exit 1; }

mk_input() {  # $1=command $2=cwd
  python3 -c 'import json,sys; print(json.dumps({"hook_event_name":"PreToolUse","cwd":sys.argv[2],"tool_name":"Bash","tool_input":{"command":sys.argv[1]}}))' "$1" "$2"
}

# run_case <deny|allow> <descripcion> <command> [cwd] [stdin_crudo]
run_case() {
  local expect="$1" desc="$2" cmd="$3" cwd="${4:-/tmp/no-es-repo}" raw="${5:-}"
  local out rc got="allow"
  if [ -n "$raw" ] || [ "$cmd" = "__RAW__" ]; then
    out="$(printf '%s' "$raw" | "$GUARD" 2>/dev/null)"; rc=$?
  else
    out="$(mk_input "$cmd" "$cwd" | "$GUARD" 2>/dev/null)"; rc=$?
  fi
  if printf '%s' "$out" | grep -q '"permissionDecision": *"deny"' || [ "$rc" -eq 2 ]; then got="deny"; fi
  if [ "$got" = "$expect" ]; then
    PASS=$((PASS+1)); printf 'ok   [%-5s] %s\n' "$expect" "$desc"
  else
    FAIL=$((FAIL+1)); printf 'FAIL [%-5s] %s\n      cmd=%s\n      got=%s rc=%s out=%s\n' "$expect" "$desc" "$cmd" "$got" "$rc" "$out"
  fi
}

# Repos temporales para los casos que dependen de la rama actual.
REPO_MAIN="$(mktemp -d)"; REPO_DEV="$(mktemp -d)"
for r in "$REPO_MAIN" "$REPO_DEV"; do
  ( cd "$r" && git init -q && git symbolic-ref HEAD refs/heads/main \
    && git -c user.email=t@t.t -c user.name=t commit -q --allow-empty -m init \
    && git branch -q develop ) >/dev/null 2>&1
done
( cd "$REPO_DEV" && git checkout -q develop ) >/dev/null 2>&1
trap 'rm -rf "$REPO_MAIN" "$REPO_DEV"' EXIT

echo "== R1: escritura sobre main =="
run_case deny  "push origin main"                          "git push origin main"
run_case deny  "push origin HEAD:main"                     "git push origin HEAD:main"
run_case deny  "push origin develop:refs/heads/main"       "git push origin develop:refs/heads/main"
run_case deny  "push --all"                                "git push --all origin"
run_case allow "push origin develop"                       "git push origin develop"
run_case allow "push origin feat/2-x"                      "git push origin feat/2-x"
run_case deny  "push sin refspec estando en main"          "git push" "$REPO_MAIN"
run_case deny  "push -u origin sin refspec estando en main" "git push -u origin" "$REPO_MAIN"
run_case allow "push sin refspec estando en develop"       "git push" "$REPO_DEV"
run_case deny  "push sin refspec, cwd no es repo (fail-closed)" "git push" "/tmp/no-es-repo"
run_case deny  "git -C /tmp/x push origin main"            "git -C /tmp/x push origin main"
run_case deny  "merge develop estando en main"             "git merge develop" "$REPO_MAIN"
run_case allow "merge feat/x estando en develop"           "git merge feat/x" "$REPO_DEV"
run_case allow "merge --no-ff feat/2-x estando en develop" "git merge --no-ff feat/2-x" "$REPO_DEV"
run_case deny  "rebase main"                               "git rebase main" "$REPO_DEV"
run_case deny  "branch -f main"                            "git branch -f main HEAD~1" "$REPO_DEV"
run_case deny  "checkout -B main"                          "git checkout -B main" "$REPO_DEV"
run_case deny  "switch -C main"                            "git switch -C main" "$REPO_DEV"

echo "== R2: force push =="
run_case deny  "push --force"                              "git push --force origin develop"
run_case deny  "push -f"                                   "git push -f origin develop"
run_case deny  "push --force-with-lease"                   "git push --force-with-lease origin develop"
run_case deny  "git -c k=v push -f (opcion global)"        "git -c k=v push -f origin develop"

echo "== R3: rm -rf =="
run_case allow "rm -rf dist en cwd"                        "rm -rf dist" "$REPO_DEV"
run_case allow "rm -rf apps/web/dist en cwd"               "rm -rf apps/web/dist coverage" "$REPO_DEV"
run_case deny  "rm -rf /tmp/x"                             "rm -rf /tmp/x" "$REPO_DEV"
run_case deny  "rm -rf ../otro"                            "rm -rf ../otro" "$REPO_DEV"
run_case deny  "cd .. && rm -rf x"                         "cd .. && rm -rf x" "$REPO_DEV"
run_case deny  "rm -rf ~/x"                                "rm -rf ~/x" "$REPO_DEV"
run_case deny  "rm -rf \$HOME/x"                           'rm -rf $HOME/x' "$REPO_DEV"
run_case deny  "rm -rf . (el cwd entero)"                  "rm -rf ." "$REPO_DEV"

echo "== Comandos encadenados (el guard mira cada segmento, no solo el primero) =="
run_case deny  "checkout main && merge develop"            "git checkout main && git merge --no-ff develop" "$REPO_DEV"
run_case deny  "switch main ; merge develop"               "git switch main ; git merge develop" "$REPO_DEV"
run_case deny  "checkout main || merge develop"            "git checkout main || git merge develop" "$REPO_DEV"
run_case deny  "npm test && git push origin main"          "npm test && git push origin main" "$REPO_DEV"
run_case deny  "checkout main y luego push sin refspec"    "git checkout main && git push" "$REPO_DEV"
run_case deny  "checkout main && rebase develop"           "git checkout main && git rebase develop" "$REPO_DEV"
run_case allow "checkout develop && merge de una feature"  "git checkout develop && git merge --no-ff feat/2-x" "$REPO_DEV"
run_case allow "checkout main solo (leer no es escribir)"  "git checkout main" "$REPO_DEV"
run_case allow "tests y push a develop encadenados"        "npm test && git push origin develop" "$REPO_DEV"
run_case allow "rama nueva y tests encadenados"            "git checkout -b feat/9-x develop && npm test" "$REPO_DEV"

echo "== Fail-closed =="
run_case deny  "stdin vacio"                               "__RAW__" "" ""
run_case deny  "JSON sin command"                          "__RAW__" "" '{"tool_name":"Bash","tool_input":{}}'
run_case deny  "stdin no es JSON"                          "__RAW__" "" 'esto no es json'

echo "== Benignos (sin falsos positivos) =="
run_case allow "npm test"                                  "npm test" "$REPO_DEV"
run_case allow "git status"                                "git status" "$REPO_DEV"
run_case allow "git log main (solo lectura)"               "git log --oneline main" "$REPO_DEV"
run_case allow "git checkout -b feat/3-api_cancelar_reserva develop" "git checkout -b feat/3-api_cancelar_reserva develop" "$REPO_DEV"
run_case allow "rm -f archivo (sin -r)"                    "rm -f /tmp/x.log" "$REPO_DEV"
run_case allow "curl localhost"                            "curl -s localhost:3001/api/health" "$REPO_DEV"

echo
echo "Resumen: $PASS ok, $FAIL FAIL ($((PASS+FAIL)) casos)"
[ "$FAIL" -eq 0 ]
