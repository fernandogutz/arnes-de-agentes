// Conexión a SQLite (node:sqlite, sin dependencias), migraciones y siembra idempotente.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SERVICIOS_SEMILLA, SUCURSALES_SEMILLA } from "./semilla.ts";

export type Db = DatabaseSync;

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS sucursales (
    id             INTEGER PRIMARY KEY,
    slug           TEXT NOT NULL UNIQUE,
    nombre         TEXT NOT NULL,
    comuna         TEXT NOT NULL,
    ciudad         TEXT NOT NULL,
    direccion      TEXT NOT NULL,
    telefono       TEXT NOT NULL,
    lat            REAL NOT NULL,
    lng            REAL NOT NULL,
    horario_lun_vie TEXT,
    horario_sab    TEXT,
    horario_dom    TEXT,
    imagen         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS servicios (
    id            INTEGER PRIMARY KEY,
    slug          TEXT NOT NULL UNIQUE,
    nombre        TEXT NOT NULL,
    categoria     TEXT NOT NULL,
    descripcion   TEXT NOT NULL,
    duracion_min  INTEGER NOT NULL,
    precio_desde  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo            TEXT NOT NULL UNIQUE,
    sucursal_id       INTEGER NOT NULL REFERENCES sucursales(id),
    servicio_id       INTEGER NOT NULL REFERENCES servicios(id),
    inicio            TEXT NOT NULL,
    paciente_nombre   TEXT NOT NULL,
    paciente_email    TEXT NOT NULL,
    paciente_telefono TEXT NOT NULL,
    estado            TEXT NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada')),
    creada_en         TEXT NOT NULL
  );

  -- Una sola reserva confirmada por sucursal y hora de inicio (respaldo del 409 de la API).
  CREATE UNIQUE INDEX IF NOT EXISTS reservas_sucursal_inicio_confirmada
    ON reservas (sucursal_id, inicio) WHERE estado = 'confirmada';
`;

/**
 * Abre (o crea) la base de datos, aplica el esquema y siembra los catálogos si están vacíos.
 * Usa ":memory:" en tests.
 */
export function abrirDb(ruta: string): Db {
  if (ruta !== ":memory:") mkdirSync(dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(ESQUEMA);
  sembrar(db);
  return db;
}

/** Inserta los catálogos de sucursales y servicios. Idempotente: no hace nada si ya hay datos. */
export function sembrar(db: Db): void {
  const contar = (tabla: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get() as { n: number }).n;

  if (contar("sucursales") === 0) {
    const insertar = db.prepare(`
      INSERT INTO sucursales
        (slug, nombre, comuna, ciudad, direccion, telefono, lat, lng, horario_lun_vie, horario_sab, horario_dom, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of SUCURSALES_SEMILLA) {
      insertar.run(
        s.slug, s.nombre, s.comuna, s.ciudad, s.direccion, s.telefono, s.lat, s.lng,
        s.horario.lunVie, s.horario.sab, s.horario.dom, s.imagen,
      );
    }
  }

  if (contar("servicios") === 0) {
    const insertar = db.prepare(`
      INSERT INTO servicios (slug, nombre, categoria, descripcion, duracion_min, precio_desde)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const s of SERVICIOS_SEMILLA) {
      insertar.run(s.slug, s.nombre, s.categoria, s.descripcion, s.duracionMin, s.precioDesde);
    }
  }
}
