// Helpers de fecha/hora. La API habla UTC; aquí todo se muestra en America/Santiago.
import type { Horario } from './tipos'

export const ZONA = 'America/Santiago'

type Partes = { anio: number; mes: number; dia: number; hora: number; minuto: number; diaSemana: number }

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Descompone un instante en sus partes en hora de Santiago.
export function partesSantiago(fecha: Date): Partes {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  })
  const p: Record<string, string> = {}
  for (const parte of fmt.formatToParts(fecha)) p[parte.type] = parte.value
  const semana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    anio: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora: Number(p.hour) % 24,
    minuto: Number(p.minute),
    diaSemana: semana.indexOf(p.weekday ?? 'Sun'),
  }
}

// Primera letra en mayúscula (para mostrar 'Martes 22 de septiembre').
export const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

const dosDigitos = (n: number) => n.toString().padStart(2, '0')

// "13:00" en hora local a partir de un ISO UTC.
export function horaLocal(iso: string): string {
  const { hora, minuto } = partesSantiago(new Date(iso))
  return `${dosDigitos(hora)}:${dosDigitos(minuto)}`
}

// "lunes 22 de septiembre" en hora local.
export function fechaLarga(iso: string): string {
  const { dia, mes, diaSemana } = partesSantiago(new Date(iso))
  return `${DIAS[diaSemana]} ${dia} de ${MESES[mes - 1]}`
}

// "YYYY-MM-DD" del día en Santiago para un instante dado.
export function fechaISOLocal(fecha: Date): string {
  const { anio, mes, dia } = partesSantiago(fecha)
  return `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`
}

export function hoyISO(ahora: Date = new Date()): string {
  return fechaISOLocal(ahora)
}

// Los próximos N días (incluye hoy) como fechas "YYYY-MM-DD" con etiqueta corta.
export function proximosDias(n: number, ahora: Date = new Date()): { iso: string; etiqueta: string; diaSemana: number }[] {
  const salida = []
  for (let i = 0; i < n; i++) {
    const d = new Date(ahora.getTime() + i * 86_400_000)
    const p = partesSantiago(d)
    salida.push({
      iso: fechaISOLocal(d),
      etiqueta: i === 0 ? 'Hoy' : `${DIAS_CORTOS[p.diaSemana]} ${p.dia}`,
      diaSemana: p.diaSemana,
    })
  }
  return salida
}

// Horario que aplica a un día de la semana (0 = domingo).
export function horarioDelDia(horario: Horario, diaSemana: number): string | null {
  if (diaSemana === 0) return horario.dom
  if (diaSemana === 6) return horario.sab
  return horario.lunVie
}

export function horarioDeHoy(horario: Horario, ahora: Date = new Date()): string | null {
  return horarioDelDia(horario, partesSantiago(ahora).diaSemana)
}

// ¿Está abierta la sucursal en este instante (hora de Santiago)?
export function estaAbierta(horario: Horario, ahora: Date = new Date()): boolean {
  const rango = horarioDeHoy(horario, ahora)
  if (!rango) return false
  const [ini, fin] = rango.split('-')
  if (!ini || !fin) return false
  const aMin = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }
  const { hora, minuto } = partesSantiago(ahora)
  const actual = hora * 60 + minuto
  return actual >= aMin(ini) && actual < aMin(fin)
}

// Texto amable para el estado: "Abierta hasta las 21:00" / "Cerrada · abre mañana 09:00".
export function textoEstado(horario: Horario, ahora: Date = new Date()): string {
  const hoy = horarioDeHoy(horario, ahora)
  if (estaAbierta(horario, ahora) && hoy) return `Abierta · cierra ${hoy.split('-')[1]}`
  if (hoy) {
    const { hora, minuto } = partesSantiago(ahora)
    const [ini] = hoy.split('-')
    const [h, m] = (ini ?? '0:0').split(':').map(Number)
    if (hora * 60 + minuto < (h ?? 0) * 60 + (m ?? 0)) return `Cerrada · abre hoy ${ini}`
  }
  return 'Cerrada ahora'
}

// Genera slots locales (ISO UTC) cada 30 min dentro de un horario "HH:MM-HH:MM" para un día
// "YYYY-MM-DD" de Santiago. Solo se usa como respaldo cuando la API no responde.
export function slotsDeRespaldo(fechaISO: string, rango: string | null, cadaMin = 30): string[] {
  if (!rango) return []
  const [ini, fin] = rango.split('-')
  if (!ini || !fin) return []
  const offsetMin = offsetSantiagoMinutos(new Date(`${fechaISO}T12:00:00Z`))
  const aUTC = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    const localMs = Date.UTC(...desarmar(fechaISO), h ?? 0, m ?? 0)
    return new Date(localMs - offsetMin * 60_000)
  }
  const salida: string[] = []
  for (let t = aUTC(ini).getTime(); t < aUTC(fin).getTime(); t += cadaMin * 60_000) {
    salida.push(new Date(t).toISOString())
  }
  return salida
}

function desarmar(fechaISO: string): [number, number, number] {
  const [a, m, d] = fechaISO.split('-').map(Number)
  return [a ?? 1970, (m ?? 1) - 1, d ?? 1]
}

// Diferencia (en minutos) entre Santiago y UTC para un instante: -180 o -240 según horario de verano.
export function offsetSantiagoMinutos(fecha: Date): number {
  const p = partesSantiago(fecha)
  const comoUTC = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto)
  const real = Math.floor(fecha.getTime() / 60_000) * 60_000
  return Math.round((comoUTC - real) / 60_000)
}
