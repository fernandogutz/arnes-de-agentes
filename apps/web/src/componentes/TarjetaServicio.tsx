import { Link } from 'react-router-dom'
import { NOMBRES_CATEGORIA } from '../datos/respaldo'
import { formatearCLP } from '../lib/precio'
import type { Servicio } from '../lib/tipos'

// Orden vertical fijo: etiqueta sola arriba, título, descripción (crece) y pie pegado abajo.
// Así el badge nunca compite con el título y todas las tarjetas de una fila terminan igual.
export function TarjetaServicio({ servicio }: { servicio: Servicio }) {
  const urgente = servicio.categoria === 'urgencias'
  return (
    <article className="vidrio vidrio--opaca vidrio--interactiva tarjeta-servicio" data-testid="tarjeta-servicio">
      <span className={`etiqueta ${urgente ? 'etiqueta--roja' : ''}`}>{NOMBRES_CATEGORIA[servicio.categoria]}</span>
      <h3 className="tarjeta-servicio__titulo">{servicio.nombre}</h3>
      <p className="tarjeta-servicio__texto">{servicio.descripcion}</p>
      <div className="tarjeta-servicio__pie">
        <span className="precio">
          {formatearCLP(servicio.precioDesde)}
          <small>desde · {servicio.duracionMin} min</small>
        </span>
        <Link to={`/reservar?servicio=${servicio.slug}`} className="boton boton--texto pequeno">
          Reservar →
        </Link>
      </div>
    </article>
  )
}
