// Consultas de servicios.
import type { Db } from "../db/conexion.ts";
import type { Categoria, Servicio } from "../tipos.ts";

type Fila = {
  id: number; slug: string; nombre: string; categoria: Categoria;
  descripcion: string; duracion_min: number; precio_desde: number;
};

function aServicio(f: Fila): Servicio {
  return {
    id: f.id,
    slug: f.slug,
    nombre: f.nombre,
    categoria: f.categoria,
    descripcion: f.descripcion,
    duracionMin: f.duracion_min,
    precioDesde: f.precio_desde,
  };
}

export function listarServicios(db: Db): Servicio[] {
  const filas = db.prepare("SELECT * FROM servicios ORDER BY id").all() as Fila[];
  return filas.map(aServicio);
}

export function buscarServicio(db: Db, slug: string): Servicio | null {
  const fila = db.prepare("SELECT * FROM servicios WHERE slug = ?").get(slug) as Fila | undefined;
  return fila ? aServicio(fila) : null;
}
