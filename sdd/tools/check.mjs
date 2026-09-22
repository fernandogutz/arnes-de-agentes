#!/usr/bin/env node
// check.mjs — valida el estado del loop SDD en sdd/feature_list.json. Node puro, sin dependencias.
// Correr: node sdd/tools/check.mjs   (también dentro de `npm run qa:harness`)
// Sale 0 si todo es coherente; 1 si hay algún problema, listándolos todos.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARCHIVO = join(RAIZ, "sdd", "feature_list.json");
const SPEC_ARCHIVOS = ["requirements.md", "design.md", "tasks.md"];
const CAMPOS = ["id", "name", "title", "description", "areas", "complexity", "acceptance", "status", "depends_on"];

const problemas = [];
const falla = (msg) => problemas.push(msg);

// 1. JSON válido
let data;
try {
  data = JSON.parse(readFileSync(ARCHIVO, "utf8"));
} catch (e) {
  console.error(`FAIL sdd/feature_list.json no es JSON válido: ${e.message}`);
  process.exit(1);
}

const rules = data.rules ?? {};
const validStatus = new Set(rules.valid_status ?? []);
const validComplexity = new Set(rules.valid_complexity ?? []);
const validAreas = new Set(rules.valid_areas ?? []);
const features = Array.isArray(data.features) ? data.features : [];

if (!data.project) falla("falta `project` en la cabecera");
if (validStatus.size === 0) falla("falta `rules.valid_status`");
if (validComplexity.size === 0) falla("falta `rules.valid_complexity`");
if (validAreas.size === 0) falla("falta `rules.valid_areas`");
if (features.length === 0) falla("`features` está vacío o no es un array");

// 2. Por feature
const ids = new Map();
const names = new Map();
for (const f of features) {
  const ref = `#${f.id ?? "?"} ${f.name ?? "(sin name)"}`;

  for (const campo of CAMPOS) if (!(campo in f)) falla(`${ref}: falta el campo \`${campo}\``);

  if (!Number.isInteger(f.id)) falla(`${ref}: \`id\` debe ser entero`);
  else if (ids.has(f.id)) falla(`${ref}: id duplicado (también en ${ids.get(f.id)})`);
  else ids.set(f.id, f.name);

  if (typeof f.name !== "string" || !/^[a-z0-9_]+$/.test(f.name)) falla(`${ref}: \`name\` debe ser snake_case ascii`);
  else if (names.has(f.name)) falla(`${ref}: name duplicado`);
  else names.set(f.name, f.id);

  if (!validStatus.has(f.status)) falla(`${ref}: status \`${f.status}\` no está en valid_status`);
  if (!validComplexity.has(f.complexity)) falla(`${ref}: complexity \`${f.complexity}\` no está en valid_complexity`);

  if (!Array.isArray(f.areas) || f.areas.length === 0) falla(`${ref}: \`areas\` debe ser un array no vacío`);
  else for (const a of f.areas) if (!validAreas.has(a)) falla(`${ref}: área \`${a}\` no está en valid_areas`);

  if (!Array.isArray(f.acceptance) || f.acceptance.length === 0) falla(`${ref}: \`acceptance\` debe tener al menos un criterio`);
  if (!Array.isArray(f.depends_on)) falla(`${ref}: \`depends_on\` debe ser un array (puede ser vacío)`);

  if ("spec_aprobado" in f && Number.isNaN(Date.parse(f.spec_aprobado))) {
    falla(`${ref}: \`spec_aprobado\` debe ser una fecha ISO`);
  }
  if (["in_progress", "in_review", "merge_ready", "done"].includes(f.status) && !("spec_aprobado" in f)) {
    falla(`${ref}: está en \`${f.status}\` pero no tiene \`spec_aprobado\` (nadie pasó la puerta 1)`);
  }

  // Toda feature que ya pasó de pending (y no está blocked) tiene su spec en disco.
  if (f.status !== "pending" && f.status !== "blocked" && typeof f.name === "string") {
    const dir = join(RAIZ, "sdd", "specs", f.name);
    if (!existsSync(dir)) falla(`${ref}: status \`${f.status}\` pero no existe sdd/specs/${f.name}/`);
    else for (const a of SPEC_ARCHIVOS) if (!existsSync(join(dir, a))) falla(`${ref}: falta sdd/specs/${f.name}/${a}`);
  }
}

// 3. depends_on apunta a ids existentes (y no a sí misma)
for (const f of features) {
  if (!Array.isArray(f.depends_on)) continue;
  for (const d of f.depends_on) {
    if (!ids.has(d)) falla(`#${f.id} ${f.name}: depends_on ${d} no existe`);
    if (d === f.id) falla(`#${f.id} ${f.name}: depends_on apunta a sí misma`);
  }
}

// 4. Una sola in_progress
const enCurso = features.filter((f) => f.status === "in_progress");
if (enCurso.length > 1) {
  falla(`hay ${enCurso.length} features in_progress (${enCurso.map((f) => `#${f.id}`).join(", ")}); el máximo es 1`);
}

// Resumen
const conteo = {};
for (const s of validStatus) conteo[s] = 0;
for (const f of features) conteo[f.status] = (conteo[f.status] ?? 0) + 1;
const aprobadas = features.filter((f) => f.status === "spec_ready" && f.spec_aprobado).length;

console.log(`sdd/feature_list.json — ${data.project} — ${features.length} features`);
console.log(
  Object.entries(conteo)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${s}: ${n}`)
    .join(" · "),
);
if (aprobadas > 0) console.log(`spec_ready con puerta 1 aprobada: ${aprobadas}`);

if (problemas.length > 0) {
  console.error(`\nFAIL — ${problemas.length} problema(s):`);
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("OK");
