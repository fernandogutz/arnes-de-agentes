// Tipos espejo del contrato de la API (docs/API-CONTRATO.md).

export type Horario = { lunVie: string | null; sab: string | null; dom: string | null }

export type Sucursal = {
  id: number
  slug: string
  nombre: string
  comuna: string
  ciudad: string
  direccion: string
  telefono: string
  lat: number
  lng: number
  horario: Horario
  imagen: string
}

export type CategoriaServicio = 'diagnostico' | 'estetica' | 'ortodoncia' | 'cirugia' | 'ninos' | 'urgencias'

export type Servicio = {
  id: number
  slug: string
  nombre: string
  categoria: CategoriaServicio
  descripcion: string
  duracionMin: number
  precioDesde: number
}

export type Paciente = { nombre: string; email: string; telefono: string }

export type Reserva = {
  id: number
  codigo: string
  sucursal: string
  servicio: string
  inicio: string
  paciente: Paciente
  estado: 'confirmada' | 'cancelada'
  creadaEn: string
}

export type NuevaReserva = {
  sucursal: string
  servicio: string
  inicio: string
  paciente: Paciente
}

export type Disponibilidad = { sucursal: string; fecha: string; slots: string[] }
