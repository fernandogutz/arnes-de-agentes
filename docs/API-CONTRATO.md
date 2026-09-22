# Contrato de la API — Nébula Dental

Base: `http://localhost:3001/api`. Todo JSON. Todas las fechas/horas viajan en **UTC, ISO 8601** (`2026-09-22T13:00:00.000Z`); el front las convierte a `America/Santiago` (ver `docs/decisions-log.md` D-02).

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | `{ "ok": true, "servicio": "nebula-api" }` |
| GET | `/sucursales` | `Sucursal[]` |
| GET | `/sucursales/:slug` | `Sucursal` · 404 `{ "error": "sucursal_no_encontrada" }` |
| GET | `/servicios` | `Servicio[]` |
| GET | `/disponibilidad?sucursal=<slug>&fecha=YYYY-MM-DD` | `{ "sucursal": slug, "fecha": "YYYY-MM-DD", "slots": string[] }` (ISO UTC, cada 30 min dentro del horario de la sucursal, sin los ya reservados) · 400 si faltan params · 404 si no existe la sucursal |
| POST | `/reservas` | 201 `Reserva` · 400 `{ "error": "validacion", "detalles": string[] }` · 409 `{ "error": "horario_no_disponible" }` |
| GET | `/reservas/:codigo` | `Reserva` · 404 |

```ts
type Sucursal = {
  id: number; slug: string; nombre: string; comuna: string; ciudad: string;
  direccion: string; telefono: string; lat: number; lng: number;
  horario: { lunVie: string | null; sab: string | null; dom: string | null }; // "09:00-20:00" hora local
  imagen: string; // ruta relativa servida por la web, ej. "/img/sucursal-las-condes.jpg"
};
type Servicio = {
  id: number; slug: string; nombre: string; categoria: "diagnostico" | "estetica" | "ortodoncia" | "cirugia" | "ninos" | "urgencias";
  descripcion: string; duracionMin: number; precioDesde: number; // CLP
};
type Reserva = {
  id: number; codigo: string; // 6 chars mayúsculas, ej. "NB7K2Q"
  sucursal: string; servicio: string; // slugs
  inicio: string; // ISO UTC
  paciente: { nombre: string; email: string; telefono: string };
  estado: "confirmada" | "cancelada";
  creadaEn: string; // ISO UTC
};
// POST /reservas body:
type NuevaReserva = { sucursal: string; servicio: string; inicio: string; paciente: { nombre: string; email: string; telefono: string } };
```

## Datos semilla

Sucursales (slug → nombre · comuna, ciudad · horario lunVie / sab / dom):

- `las-condes` → Nébula Las Condes (casa matriz) · Las Condes, Santiago · 08:00-21:00 / 09:00-14:00 / null
- `providencia` → Nébula Providencia · Providencia, Santiago · 09:00-20:00 / 09:00-14:00 / null
- `nunoa` → Nébula Ñuñoa · Ñuñoa, Santiago · 09:00-19:00 / null / null
- `vina-del-mar` → Nébula Viña del Mar · Viña del Mar, Valparaíso · 09:00-19:00 / 10:00-14:00 / null

Servicios (slug → nombre · categoría · min · desde CLP):

- `diagnostico-digital` → Diagnóstico digital 3D · diagnostico · 30 · 25000
- `limpieza` → Limpieza profunda · diagnostico · 45 · 35000
- `blanqueamiento-laser` → Blanqueamiento láser · estetica · 60 · 180000
- `diseno-de-sonrisa` → Diseño de sonrisa · estetica · 90 · 450000
- `ortodoncia-invisible` → Ortodoncia invisible · ortodoncia · 45 · 1900000
- `implantes-3d` → Implantes guiados por 3D · cirugia · 120 · 890000
- `odontopediatria` → Odontopediatría · ninos · 30 · 30000
- `urgencias` → Urgencia dental · urgencias · 30 · 45000
