// Reservas: validación del body, generación de código, consultas e inserción.
import { randomInt } from "node:crypto";
import type { Db } from "../db/conexion.ts";
import type { EstadoReserva, NuevaReserva, Reserva } from "../tipos.ts";
import { localAUtc, parsearIso } from "./fechas.ts";

// Sin O/0 ni I/1 para que el código se pueda dictar por teléfono sin confusiones.
export const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LARGO_CODIGO = 6;

export function generarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  }
  return codigo;
}

type ResultadoValidacion =
  | { ok: true; datos: NuevaReserva }
  | { ok: false; detalles: string[] };

/** Valida el body de POST /reservas. Devuelve los datos normalizados o la lista de problemas en español. */
export function validarNuevaReserva(body: unknown): ResultadoValidacion {
  const detalles: string[] = [];
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const p = (typeof b.paciente === "object" && b.paciente !== null ? b.paciente : {}) as Record<string, unknown>;

  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const sucursal = texto(b.sucursal);
  const servicio = texto(b.servicio);
  const inicio = texto(b.inicio);
  const nombre = texto(p.nombre);
  const email = texto(p.email);
  const telefono = texto(p.telefono);

  if (!sucursal) detalles.push("sucursal es obligatoria");
  if (!servicio) detalles.push("servicio es obligatorio");
  if (!inicio) detalles.push("inicio es obligatorio");
  else if (!parsearIso(inicio)) detalles.push("inicio debe ser una fecha ISO 8601 válida con zona horaria (ej. 2026-09-23T13:00:00.000Z)");
  if (nombre.length < 3) detalles.push("paciente.nombre debe tener al menos 3 caracteres");
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) detalles.push("paciente.email no es un correo válido");
  if (telefono.replace(/\D/g, "").length < 8) detalles.push("paciente.telefono debe tener al menos 8 dígitos");

  if (detalles.length > 0) return { ok: false, detalles };
  return {
    ok: true,
    datos: {
      sucursal,
      servicio,
      inicio: parsearIso(inicio)!.toISOString(),
      paciente: { nombre, email, telefono },
    },
  };
}

type Fila = {
  id: number; codigo: string; sucursal: string; servicio: string; inicio: string;
  paciente_nombre: string; paciente_email: string; paciente_telefono: string;
  estado: EstadoReserva; creada_en: string;
};

const SELECT_RESERVA = `
  SELECT r.id, r.codigo, s.slug AS sucursal, v.slug AS servicio, r.inicio,
         r.paciente_nombre, r.paciente_email, r.paciente_telefono, r.estado, r.creada_en
  FROM reservas r
  JOIN sucursales s ON s.id = r.sucursal_id
  JOIN servicios  v ON v.id = r.servicio_id
`;

function aReserva(f: Fila): Reserva {
  return {
    id: f.id,
    codigo: f.codigo,
    sucursal: f.sucursal,
    servicio: f.servicio,
    inicio: f.inicio,
    paciente: { nombre: f.paciente_nombre, email: f.paciente_email, telefono: f.paciente_telefono },
    estado: f.estado,
    creadaEn: f.creada_en,
  };
}

export function buscarPorCodigo(db: Db, codigo: string): Reserva | null {
  const fila = db.prepare(`${SELECT_RESERVA} WHERE r.codigo = ?`).get(codigo.toUpperCase()) as Fila | undefined;
  return fila ? aReserva(fila) : null;
}

/** Inicios (ISO UTC) de reservas confirmadas en una sucursal durante un día local `YYYY-MM-DD`. */
export function iniciosReservados(db: Db, sucursalId: number, fecha: string): string[] {
  const desde = localAUtc(fecha, "00:00").toISOString();
  const hasta = localAUtc(fecha, "24:00").toISOString();
  const filas = db
    .prepare(
      `SELECT inicio FROM reservas
       WHERE sucursal_id = ? AND estado = 'confirmada' AND inicio >= ? AND inicio < ?`,
    )
    .all(sucursalId, desde, hasta) as { inicio: string }[];
  return filas.map((f) => f.inicio);
}

export function existeConfirmada(db: Db, sucursalId: number, inicio: string): boolean {
  const fila = db
    .prepare("SELECT 1 FROM reservas WHERE sucursal_id = ? AND inicio = ? AND estado = 'confirmada'")
    .get(sucursalId, inicio);
  return fila !== undefined;
}

/** Inserta la reserva como confirmada con un código único y la devuelve completa. */
export function insertarReserva(
  db: Db,
  datos: NuevaReserva,
  ids: { sucursalId: number; servicioId: number },
): Reserva {
  const insertar = db.prepare(`
    INSERT INTO reservas
      (codigo, sucursal_id, servicio_id, inicio, paciente_nombre, paciente_email, paciente_telefono, estado, creada_en)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada', ?)
  `);

  // Reintenta si el código generado ya existe (probabilidad ínfima, pero gratis de manejar).
  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigo();
    if (buscarPorCodigo(db, codigo)) continue;
    insertar.run(
      codigo, ids.sucursalId, ids.servicioId, datos.inicio,
      datos.paciente.nombre, datos.paciente.email, datos.paciente.telefono,
      new Date().toISOString(),
    );
    return buscarPorCodigo(db, codigo)!;
  }
  throw new Error("No se pudo generar un código de reserva único");
}
