// Punto de entrada: abre la base, arma la app y escucha en PORT (3001 por defecto).
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { PUERTO, RUTA_DB } from "./config.ts";
import { abrirDb } from "./db/conexion.ts";

const db = abrirDb(RUTA_DB);
const app = createApp(db);

const servidor = serve({ fetch: app.fetch, port: PUERTO }, (info) => {
  console.log(`nebula-api escuchando en http://localhost:${info.port}/api (db: ${RUTA_DB})`);
});

// Cierre limpio: termina de atender lo pendiente y cierra SQLite.
for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.on(senal, () => {
    servidor.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
