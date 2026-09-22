// Arma la app Hono sobre una conexión dada. Exportado así para poder testear con app.request() sin puerto.
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Db } from "./db/conexion.ts";
import { rutasDisponibilidad } from "./rutas/disponibilidad.ts";
import { rutasReservas } from "./rutas/reservas.ts";
import { rutasServicios } from "./rutas/servicios.ts";
import { rutasSucursales } from "./rutas/sucursales.ts";

export function createApp(db: Db) {
  const app = new Hono();

  // CORS abierto para cualquier origen de localhost (la web de Nébula corre en otro puerto).
  app.use(
    "/api/*",
    cors({ origin: (origen) => (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen) ? origen : null) }),
  );

  app.get("/api/health", (c) => c.json({ ok: true, servicio: "nebula-api" }));
  app.route("/api/sucursales", rutasSucursales(db));
  app.route("/api/servicios", rutasServicios(db));
  app.route("/api/disponibilidad", rutasDisponibilidad(db));
  app.route("/api/reservas", rutasReservas(db));

  app.notFound((c) => c.json({ error: "ruta_no_encontrada" }, 404));
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "error_interno" }, 500);
  });

  return app;
}
