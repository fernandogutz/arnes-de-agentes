// Configuración por variables de entorno, con valores por defecto para desarrollo.
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const RAIZ = resolve(fileURLToPath(import.meta.url), "../..");

export const PUERTO = Number(process.env.PORT ?? 3001);
export const RUTA_DB = process.env.DB_PATH ?? resolve(RAIZ, "data/nebula.db");
