---
name: api-endpoint
description: >
  Cómo agregar o modificar un endpoint de la API de Nébula Dental (`apps/api`, Hono + node:sqlite).
  Trigger: cualquier task que cree, cambie o elimine una ruta HTTP de la API, o cambie el shape de una respuesta.
metadata:
  auto_invoke: "Agregar o modificar un endpoint de la API (`apps/api`)"
---

## Orden de trabajo (no se salta pasos)

1. **Contrato primero.** Abre `docs/API-CONTRATO.md`. Si el endpoint no está o cambia, actualiza la tabla y los tipos ANTES de escribir código. El contrato es lo que el front y los tests leen; el código lo sigue.
2. **Lógica en `apps/api/src/dominio/`.** Funciones puras o que reciben `db: Db` como primer argumento (`buscarSucursal(db, slug)`, `calcularSlots(horario, fecha, reservados)`). Sin `Hono` aquí: esto se testea sin HTTP.
3. **Ruta en `apps/api/src/rutas/<recurso>.ts`.** Una función `rutas<Recurso>(db: Db)` que devuelve un `new Hono()`. La ruta valida, llama al dominio, arma la respuesta. Nada de SQL en la ruta.
4. **Registro en `apps/api/src/app.ts`**: `app.route("/api/<recurso>", rutas<Recurso>(db))`. Si el recurso ya existe, solo agregas el método al archivo de `rutas/`.
5. **Test en `node:test`** con `app.request()` sobre una DB en memoria (sin puerto):

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.ts";
import { abrirDb, sembrar } from "./db/conexion.ts";

const db = abrirDb(":memory:"); sembrar(db);
const app = createApp(db);

it("GET /api/servicios?categoria=estetica devuelve solo esa categoría", async () => {
  const res = await app.request("/api/servicios?categoria=estetica");
  assert.equal(res.status, 200);
  const servicios = await res.json();
  assert.ok(servicios.every((s: { categoria: string }) => s.categoria === "estetica"));
});
```

Los tests de la app van en `apps/api/src/app.test.ts`; los de lógica pura, junto al módulo (`dominio/<modulo>.test.ts`). Cada `R<n>` del spec tiene al menos un `it(...)` que lo nombra.

## Convenciones que el revisor chequea

- **Errores**: siempre `{ error: "<codigo_snake>" }`, con `detalles: string[]` solo en validación (400). Códigos ya en uso: `validacion`, `horario_no_disponible`, `sucursal_no_encontrada`, `reserva_no_encontrada`, `ruta_no_encontrada`, `error_interno`. Uno nuevo se agrega al contrato.
- **Status**: 200 lectura · 201 creación · 400 body/params inválidos · 404 recurso inexistente · 409 conflicto de estado (slot tomado, ya cancelada).
- **Fechas (D-02)**: la API guarda y devuelve **UTC ISO 8601** (`2026-09-22T13:00:00.000Z`). La conversión local vive en `dominio/fechas.ts` (`localAUtc`, `fechaLocal`, `ZONA_HORARIA`) y se usa solo para calcular horarios; nunca se persiste hora local ni timestamps sin zona. Campo nuevo de fecha en la tabla `reservas` = columna `TEXT` con ISO UTC.
- **Nombres en español**, `camelCase` en TS, `snake_case` en columnas SQL (ver `db/conexion.ts`). Imports con extensión `.ts` (TypeScript nativo de Node, sin build).
- **Sin dependencias nuevas** salvo que el `design.md` lo justifique.

## QA del área (obligatoria antes de commitear)

```bash
npm run typecheck -w apps/api && npm test -w apps/api
```

Verde = cero errores de `tsc` y todos los tests `pass`. Para probar a mano: `npm run dev -w apps/api` y `curl -s localhost:3001/api/<ruta> | jq`.

Al terminar, commitea con la skill `commit` (`feat(api): …`). No pushees ni mergees: eso es del orchestrator tras la puerta 2.
