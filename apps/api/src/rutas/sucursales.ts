import { Hono } from "hono";
import type { Db } from "../db/conexion.ts";
import { buscarSucursal, listarSucursales } from "../dominio/sucursales.ts";

export function rutasSucursales(db: Db) {
  const rutas = new Hono();

  rutas.get("/", (c) => c.json(listarSucursales(db)));

  rutas.get("/:slug", (c) => {
    const sucursal = buscarSucursal(db, c.req.param("slug"));
    if (!sucursal) return c.json({ error: "sucursal_no_encontrada" }, 404);
    return c.json(sucursal);
  });

  return rutas;
}
