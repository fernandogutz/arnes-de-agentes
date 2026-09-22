import { Hono } from "hono";
import type { Db } from "../db/conexion.ts";
import { calcularSlots } from "../dominio/disponibilidad.ts";
import { esFechaValida } from "../dominio/fechas.ts";
import { iniciosReservados } from "../dominio/reservas.ts";
import { buscarSucursal } from "../dominio/sucursales.ts";

export function rutasDisponibilidad(db: Db) {
  const rutas = new Hono();

  // GET /disponibilidad?sucursal=<slug>&fecha=YYYY-MM-DD
  rutas.get("/", (c) => {
    const slug = c.req.query("sucursal");
    const fecha = c.req.query("fecha");

    const detalles: string[] = [];
    if (!slug) detalles.push("falta el parámetro sucursal");
    if (!fecha) detalles.push("falta el parámetro fecha");
    else if (!esFechaValida(fecha)) detalles.push("fecha debe tener formato YYYY-MM-DD");
    if (detalles.length > 0) return c.json({ error: "validacion", detalles }, 400);

    const sucursal = buscarSucursal(db, slug!);
    if (!sucursal) return c.json({ error: "sucursal_no_encontrada" }, 404);

    const reservados = iniciosReservados(db, sucursal.id, fecha!);
    const slots = calcularSlots(sucursal.horario, fecha!, reservados);
    return c.json({ sucursal: sucursal.slug, fecha, slots });
  });

  return rutas;
}
