// Tipos del dominio. Espejo 1:1 de docs/API-CONTRATO.md.

/** Horario en hora local (America/Santiago), formato "HH:MM-HH:MM". `null` = cerrado. */
export type Horario = {
  lunVie: string | null;
  sab: string | null;
  dom: string | null;
};

export type Sucursal = {
  id: number;
  slug: string;
  nombre: string;
  comuna: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  lat: number;
  lng: number;
  horario: Horario;
  /** Ruta relativa servida por la web, ej. "/img/sucursal-las-condes.jpg". */
  imagen: string;
};

export type Categoria =
  | "diagnostico"
  | "estetica"
  | "ortodoncia"
  | "cirugia"
  | "ninos"
  | "urgencias";

export type Servicio = {
  id: number;
  slug: string;
  nombre: string;
  categoria: Categoria;
  descripcion: string;
  duracionMin: number;
  /** Precio "desde", en CLP. */
  precioDesde: number;
};

export type Paciente = {
  nombre: string;
  email: string;
  telefono: string;
};

export type EstadoReserva = "confirmada" | "cancelada";

export type Reserva = {
  id: number;
  /** 6 caracteres [A-Z0-9] sin O/0 ni I/1, ej. "NB7K2Q". */
  codigo: string;
  sucursal: string;
  servicio: string;
  /** ISO 8601 en UTC. */
  inicio: string;
  paciente: Paciente;
  estado: EstadoReserva;
  /** ISO 8601 en UTC. */
  creadaEn: string;
};

/** Body de POST /reservas. */
export type NuevaReserva = {
  sucursal: string;
  servicio: string;
  inicio: string;
  paciente: Paciente;
};
