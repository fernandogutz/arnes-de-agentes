# Bitácora — features cerradas

> Append-only. El `orchestrator` agrega aquí el resumen de cada feature al marcarla `done`, después de la puerta 2. Lo más nuevo abajo.

## #1 · api_reservas — `done` (2026-09-21)

**Cómo se hizo:** en **bootstrap**, antes de que el loop existiera (igual que el propio arnés). El código entró directo en `main`; no hubo rama `feat/1-…` ni merge del orchestrator. El spec (`sdd/specs/api_reservas/`), el mapa R<n> → test (`impl_api_reservas.md`) y el veredicto con guía de validación (`review_api_reservas.md`) se escribieron **después**, sobre el código real, para dejar el ejemplo del nivel que se espera de las features siguientes. La guía de validación sí se ejecutó contra la API real el 2026-09-21.

Núcleo de la API: `GET /api/disponibilidad` (slots de 30 min en ISO UTC según el horario local de la sucursal, sin los reservados) y `POST /api/reservas` + `GET /api/reservas/:codigo` (código de 6 caracteres dictable, 400 con `detalles` acumulados, 409 `horario_no_disponible`). Esquema SQLite con índice único parcial `(sucursal_id, inicio) WHERE estado = 'confirmada'` como respaldo del 409, que deja el camino abierto a la cancelación (#3). Conversión local ↔ UTC en un solo módulo (`dominio/fechas.ts`) usando `Intl.DateTimeFormat`, probada en verano (UTC-3) e invierno (UTC-4).

**Quedó fuera (a propósito):** cancelación de reservas (#3), filtro de servicios (#2), notificaciones por correo (no encolado).
