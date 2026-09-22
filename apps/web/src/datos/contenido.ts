// Contenido editorial del sitio (no viene de la API).

export const TECNOLOGIAS = [
  {
    id: 'escaner',
    titulo: 'Escáner intraoral 3D',
    texto: 'Un modelo digital de tu boca en menos de 3 minutos. Cero pasta, cero moldes.',
    dato: '< 3 min',
  },
  {
    id: 'rayos',
    titulo: 'Radiografía de baja dosis',
    texto: 'Sensores digitales con hasta 90% menos radiación que una placa tradicional.',
    dato: '-90% dosis',
  },
  {
    id: 'implantes',
    titulo: 'Implantes guiados por computador',
    texto: 'Planificamos el implante en 3D y lo colocamos con una guía impresa a tu medida.',
    dato: '0,1 mm',
  },
  {
    id: 'laser',
    titulo: 'Blanqueamiento láser',
    texto: 'Activación por luz fría: más tonos en una sesión y menos sensibilidad después.',
    dato: '8 tonos',
  },
] as const

export const EQUIPO = [
  {
    nombre: 'Dr. Tomás Riquelme',
    cargo: 'Director clínico · Implantología',
    detalle: 'Cirugía guiada por 3D. Más de 1.200 implantes colocados.',
    foto: '/img/equipo-1.jpg',
  },
  {
    nombre: 'Dra. Camila Arrieta',
    cargo: 'Ortodoncia invisible',
    detalle: 'Planificación digital de alineadores y ortodoncia para adultos.',
    foto: '/img/equipo-2.jpg',
  },
  {
    nombre: 'Dr. Ignacio Valdebenito',
    cargo: 'Rehabilitación oral',
    detalle: 'Diseño de sonrisa, carillas y prótesis sobre implantes.',
    foto: '/img/equipo-3.jpg',
  },
  {
    nombre: 'Dra. Antonia Fuenzalida',
    cargo: 'Odontopediatría',
    detalle: 'Primera consulta sin instrumentos: los niños vuelven contentos.',
    foto: '/img/equipo-4.jpg',
  },
]

export const TESTIMONIOS = [
  {
    nombre: 'Josefa M.',
    lugar: 'Providencia',
    texto: 'Vi mi boca en 3D en la pantalla antes de que me explicaran nada. Nunca había entendido tan bien qué me iban a hacer.',
    servicio: 'Ortodoncia invisible',
  },
  {
    nombre: 'Rodrigo P.',
    lugar: 'Las Condes',
    texto: 'Implante un martes, trabajando el miércoles. Cero drama. Y la reserva online funcionó sin llamar a nadie.',
    servicio: 'Implantes guiados por 3D',
  },
  {
    nombre: 'Valentina S.',
    lugar: 'Viña del Mar',
    texto: 'Mi hijo de 5 años pidió volver. Eso lo dice todo.',
    servicio: 'Odontopediatría',
  },
]

export const TELEFONO_CENTRAL = '+56 2 2940 1000'
export const EMAIL_CONTACTO = 'hola@nebuladental.cl'
