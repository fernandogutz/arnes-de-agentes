# .claude/skills/ — Herramientas del arnés

Conocimiento reutilizable que el modelo invoca solo cuando toca (estándar [agentskills.io](https://agentskills.io)). Cada skill es una carpeta con un `SKILL.md` que lleva frontmatter `name`, `description` (con `Trigger:`) y `metadata.auto_invoke`: esa última frase es la que aparece en la tabla **Auto-invoke Skills** de `AGENTS.md`, que es como el modelo sabe que debe cargarla antes de actuar.

Una skill no es documentación general: es el "cómo se hace aquí" de una acción concreta, corto (40-80 líneas), con los comandos reales. Si algo se explica dos veces en distintos specs, es candidato a skill.

## Skills

| Skill | Cuándo se invoca | Qué enseña |
|---|---|---|
| `api-endpoint` | Agregar o modificar un endpoint de la API (`apps/api`) | Contrato primero, ruta en `rutas/`, lógica en `dominio/`, registro en `app.ts`, test con `app.request()`, errores `{ error, detalles? }`, fechas UTC (D-02), QA del área. |
| `web-componente` | Agregar o modificar un componente o página de la web (`apps/web`) | Dónde va cada cosa, variables CSS, datos de respaldo, fechas UTC → Santiago, tests con testing-library y mock del 3D, QA del área. |
| `commit` | Commitear cambios o crear la rama de una feature | Rama `feat/<id>-<name>` desde `develop`, Conventional Commits con scope = área, un commit por área lógica, nunca push ni merge desde aquí. |

## Cómo agregar una skill

1. `mkdir .claude/skills/<nombre>` y escribe `SKILL.md` con el frontmatter de las existentes (`name`, `description` con `Trigger:`, `metadata.auto_invoke`).
2. Copia la frase de `metadata.auto_invoke` a la tabla `### Auto-invoke Skills` de `AGENTS.md` (fila `| Action | Skill |`). Sin esa fila la skill existe pero nadie la carga.
3. Añade la fila a la tabla de este README.

Claude Code no necesita setup: `.claude/skills/`, `.claude/agents/`, `.claude/hooks/` y `.claude/settings.json` viven versionados en la raíz y `CLAUDE.md` importa `@AGENTS.md`.
