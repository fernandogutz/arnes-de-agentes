import { Link } from 'react-router-dom'
import { NOMBRES_CATEGORIA } from '../datos/respaldo'
import { formatearCLP } from '../lib/precio'
import type { Servicio } from '../lib/tipos'

export function TarjetaServicio({ servicio }: { servicio: Servicio }) {
  const urgente = servicio.categoria === 'urgencias'
  return (
    <article className="vidrio vidrio--interactiva tarjeta-servicio" data-testid="tarjeta-servicio">
      <div className="tarjeta-servicio__cabecera">
        <h3>{servicio.nombre}</h3>
        <span className={`etiqueta ${urgente ? 'etiqueta--roja' : ''}`}>{NOMBRES_CATEGORIA[servicio.categoria]}</span>
      </div>
      <p>{servicio.descripcion}</p>
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
