// `npm run seed`: crea data/nebula.db con esquema y catálogos. Seguro de correr varias veces.
import { abrirDb } from "./conexion.ts";
import { RUTA_DB } from "../config.ts";

const db = abrirDb(RUTA_DB);
const n = (tabla: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get() as { n: number }).n;
console.log(`Base lista en ${RUTA_DB}: ${n("sucursales")} sucursales, ${n("servicios")} servicios, ${n("reservas")} reservas.`);
db.close();
