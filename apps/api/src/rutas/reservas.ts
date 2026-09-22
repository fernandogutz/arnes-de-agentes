import { Hono } from "hono";
import type { Db } from "../db/conexion.ts";
import { calcularSlots } from "../dominio/disponibilidad.ts";
import { fechaLocal } from "../dominio/fechas.ts";
import { buscarPorCodigo, iniciosReservados, insertarReserva, validarNuevaReserva } from "../dominio/reservas.ts";
import { buscarServicio } from "../dominio/servicios.ts";
import { buscarSucursal } from "../dominio/sucursales.ts";

export function rutasReservas(db: Db) {
  const rutas = new Hono();

  // POST /reservas
  rutas.post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      return c.json({ error: "validacion", detalles: ["el body debe ser JSON válido"] }, 400);
    }

    const validacion = validarNuevaReserva(body);
    if (!validacion.ok) return c.json({ error: "validacion", detalles: validacion.detalles }, 400);
    const datos = validacion.datos;

    const sucursal = buscarSucursal(db, datos.sucursal);
    const servicio = buscarServicio(db, datos.servicio);
    const detalles: string[] = [];
    if (!sucursal) detalles.push(`la sucursal "${datos.sucursal}" no existe`);
    if (!servicio) detalles.push(`el servicio "${datos.servicio}" no existe`);
    if (!sucursal || !servicio) return c.json({ error: "validacion", detalles }, 400);

    // El inicio debe ser un slot libre del día (dentro del horario y sin otra reserva confirmada).
    const fecha = fechaLocal(new Date(datos.inicio));
    const libres = calcularSlots(sucursal.horario, fecha, iniciosReservados(db, sucursal.id, fecha));
    if (!libres.includes(datos.inicio)) return c.json({ error: "horario_no_disponible" }, 409);

    const reserva = insertarReserva(db, datos, { sucursalId: sucursal.id, servicioId: servicio.id });
    return c.json(reserva, 201);
  });

  // GET /reservas/:codigo
  rutas.get("/:codigo", (c) => {
    const reserva = buscarPorCodigo(db, c.req.param("codigo"));
    if (!reserva) return c.json({ error: "reserva_no_encontrada" }, 404);
    return c.json(reserva);
  });

  return rutas;
}
