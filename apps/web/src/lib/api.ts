// Cliente mínimo de la API. Si la API no responde, cada llamada devuelve datos de respaldo.
import { useEffect, useState } from 'react'
import { SERVICIOS_RESPALDO, SUCURSALES_RESPALDO } from '../datos/respaldo'
import type { Disponibilidad, NuevaReserva, Reserva, Servicio, Sucursal } from './tipos'

const BASE = '/api'
const TIMEOUT_MS = 4000

export class ErrorApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    public detalles: string[] = [],
  ) {
    super(codigo)
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${ruta}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    const tipo = res.headers.get('content-type') ?? ''
    // Sin API, Vite devuelve el index.html: lo tratamos como caída.
    if (!tipo.includes('application/json')) throw new ErrorApi(res.status, 'sin_api')
    const cuerpo = (await res.json()) as unknown
    if (!res.ok) {
      const e = cuerpo as { error?: string; detalles?: string[] }
      throw new ErrorApi(res.status, e.error ?? 'error', e.detalles ?? [])
    }
    return cuerpo as T
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  sucursales: () => pedir<Sucursal[]>('/sucursales'),
  servicios: () => pedir<Servicio[]>('/servicios'),
  disponibilidad: (sucursal: string, fecha: string) =>
    pedir<Disponibilidad>(`/disponibilidad?sucursal=${encodeURIComponent(sucursal)}&fecha=${fecha}`),
  crearReserva: (datos: NuevaReserva) =>
    pedir<Reserva>('/reservas', { method: 'POST', body: JSON.stringify(datos) }),
  reserva: (codigo: string) => pedir<Reserva>(`/reservas/${encodeURIComponent(codigo)}`),
}

export type EstadoRecurso<T> = { datos: T; cargando: boolean; deRespaldo: boolean }

// Hook genérico: intenta la API y, si falla, entrega el respaldo marcando deRespaldo=true.
export function useRecurso<T>(cargar: () => Promise<T>, respaldo: T): EstadoRecurso<T> {
  const [estado, setEstado] = useState<EstadoRecurso<T>>({ datos: respaldo, cargando: true, deRespaldo: false })
  useEffect(() => {
    let vivo = true
    cargar()
      .then((datos) => vivo && setEstado({ datos, cargando: false, deRespaldo: false }))
      .catch(() => vivo && setEstado({ datos: respaldo, cargando: false, deRespaldo: true }))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return estado
}

export const useSucursales = () => useRecurso(api.sucursales, SUCURSALES_RESPALDO)
export const useServicios = () => useRecurso(api.servicios, SERVICIOS_RESPALDO)
