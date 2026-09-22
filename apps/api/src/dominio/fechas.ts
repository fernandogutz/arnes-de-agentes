// Helpers de fecha. La clínica opera en hora local de Chile; la API habla UTC hacia afuera.
// Sin librerías: el offset del día se obtiene de Intl.DateTimeFormat, que ya conoce el DST chileno.

export const ZONA_HORARIA = "America/Santiago";

const formateador = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_HORARIA,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Componentes de `instante` vistos desde America/Santiago. */
function partesLocales(instante: Date) {
  const p: Record<string, number> = {};
  for (const { type, value } of formateador.formatToParts(instante)) {
    if (type !== "literal") p[type] = Number(value);
  }
  return { anio: p.year, mes: p.month, dia: p.day, hora: p.hour, minuto: p.minute, segundo: p.second };
}

/** Offset local respecto a UTC en minutos para ese instante (Chile: -240 en invierno, -180 en verano). */
export function offsetMinutos(instante: Date): number {
  const l = partesLocales(instante);
  const comoUtc = Date.UTC(l.anio, l.mes - 1, l.dia, l.hora, l.minuto, l.segundo);
  return Math.round((comoUtc - instante.getTime()) / 60_000);
}

/** ¿`YYYY-MM-DD` bien formada y existente en el calendario? */
export function esFechaValida(fecha: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return false;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** Día de la semana de una fecha `YYYY-MM-DD` (0 = domingo … 6 = sábado). */
export function diaSemana(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
}

/**
 * Convierte una hora local (`fecha` + `"HH:MM"` en America/Santiago) al instante UTC correspondiente.
 * Se calcula el offset dos veces para resolver bien los días de cambio de hora.
 */
export function localAUtc(fecha: string, hora: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const supuesto = Date.UTC(anio, mes - 1, dia, hh, mm);
  const primerIntento = supuesto - offsetMinutos(new Date(supuesto)) * 60_000;
  const definitivo = supuesto - offsetMinutos(new Date(primerIntento)) * 60_000;
  return new Date(definitivo);
}

/** Fecha local `YYYY-MM-DD` (America/Santiago) en la que cae un instante. */
export function fechaLocal(instante: Date): string {
  const { anio, mes, dia } = partesLocales(instante);
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Fecha-hora ISO 8601 con zona explícita (Z o ±HH:MM). Evita el parser permisivo de `new Date()`.
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/** Parsea un ISO 8601 con zona horaria y devuelve la fecha, o `null` si no es válido. */
export function parsearIso(texto: unknown): Date | null {
  if (typeof texto !== "string" || !ISO_8601.test(texto)) return null;
  const d = new Date(texto);
  return Number.isNaN(d.getTime()) ? null : d;
}
