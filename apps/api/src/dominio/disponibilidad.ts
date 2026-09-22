// Cálculo de slots disponibles. Lógica pura: recibe el horario y las horas ya tomadas, devuelve ISO UTC.
import type { Horario } from "../tipos.ts";
import { diaSemana, localAUtc } from "./fechas.ts";

export const DURACION_SLOT_MIN = 30;

/** Rango "HH:MM-HH:MM" que aplica a esa fecha según el día de la semana, o `null` si está cerrado. */
export function rangoDelDia(horario: Horario, fecha: string): string | null {
  const dia = diaSemana(fecha);
  if (dia === 0) return horario.dom;
  if (dia === 6) return horario.sab;
  return horario.lunVie;
}

/**
 * Slots de 30 min dentro del horario de la sucursal para `fecha`, en ISO UTC,
 * sin los que ya están en `reservados` (también ISO UTC).
 */
export function calcularSlots(horario: Horario, fecha: string, reservados: Iterable<string> = []): string[] {
  const rango = rangoDelDia(horario, fecha);
  if (!rango) return [];

  const [apertura, cierre] = rango.split("-");
  const inicio = localAUtc(fecha, apertura).getTime();
  const fin = localAUtc(fecha, cierre).getTime();
  const paso = DURACION_SLOT_MIN * 60_000;
  const tomados = new Set(reservados);

  const slots: string[] = [];
  // El último slot debe caber completo antes del cierre.
  for (let t = inicio; t + paso <= fin; t += paso) {
    const iso = new Date(t).toISOString();
    if (!tomados.has(iso)) slots.push(iso);
  }
  return slots;
}
