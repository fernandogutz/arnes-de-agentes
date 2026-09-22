import { Hono } from "hono";
import type { Db } from "../db/conexion.ts";
import { listarServicios } from "../dominio/servicios.ts";

export function rutasServicios(db: Db) {
  const rutas = new Hono();
  rutas.get("/", (c) => c.json(listarServicios(db)));
  return rutas;
}
