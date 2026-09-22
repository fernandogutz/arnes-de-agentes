// Consultas de sucursales.
import type { Db } from "../db/conexion.ts";
import type { Sucursal } from "../tipos.ts";

type Fila = {
  id: number; slug: string; nombre: string; comuna: string; ciudad: string;
  direccion: string; telefono: string; lat: number; lng: number;
  horario_lun_vie: string | null; horario_sab: string | null; horario_dom: string | null;
  imagen: string;
};

function aSucursal(f: Fila): Sucursal {
  return {
    id: f.id,
    slug: f.slug,
    nombre: f.nombre,
    comuna: f.comuna,
    ciudad: f.ciudad,
    direccion: f.direccion,
    telefono: f.telefono,
    lat: f.lat,
    lng: f.lng,
    horario: { lunVie: f.horario_lun_vie, sab: f.horario_sab, dom: f.horario_dom },
    imagen: f.imagen,
  };
}

export function listarSucursales(db: Db): Sucursal[] {
  const filas = db.prepare("SELECT * FROM sucursales ORDER BY id").all() as Fila[];
  return filas.map(aSucursal);
}

export function buscarSucursal(db: Db, slug: string): Sucursal | null {
  const fila = db.prepare("SELECT * FROM sucursales WHERE slug = ?").get(slug) as Fila | undefined;
  return fila ? aSucursal(fila) : null;
}
