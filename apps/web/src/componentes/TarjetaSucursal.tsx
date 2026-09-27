import { Link } from 'react-router-dom'
import { estaAbierta, horarioDeHoy, textoEstado } from '../lib/fechas'
import type { Sucursal } from '../lib/tipos'
import { IconoPin, IconoReloj, IconoTelefono } from './Iconos'

type Props = { sucursal: Sucursal; ahora?: Date }

export function urlMapa(s: Sucursal): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.direccion}, ${s.ciudad}, Chile`)}`
}

export function TarjetaSucursal({ sucursal, ahora = new Date() }: Props) {
  const abierta = estaAbierta(sucursal.horario, ahora)
  const hoy = horarioDeHoy(sucursal.horario, ahora)
  return (
    <article className="vidrio vidrio--opaca vidrio--interactiva tarjeta-sucursal" id={sucursal.slug} data-testid="tarjeta-sucursal">
      <div className="tarjeta-sucursal__foto">
        <img src={sucursal.imagen} alt={`Interior de ${sucursal.nombre}`} loading="lazy" />
        <span className={`tarjeta-sucursal__estado ${abierta ? 'abierta' : ''}`}>{textoEstado(sucursal.horario, ahora)}</span>
      </div>
      <div className="tarjeta-sucursal__cuerpo">
        <span className="tarjeta-sucursal__comuna">
          {sucursal.comuna} · {sucursal.ciudad}
        </span>
        <h3>{sucursal.nombre}</h3>
        <div className="tarjeta-sucursal__dato">
          <IconoPin />
          <span>{sucursal.direccion}</span>
        </div>
        <div className="tarjeta-sucursal__dato">
          <IconoReloj />
          <span>Hoy: {hoy ? hoy.replace('-', ' a ') : 'cerrado'}</span>
        </div>
        <div className="tarjeta-sucursal__dato">
          <IconoTelefono />
          <a href={`tel:${sucursal.telefono.replace(/\s/g, '')}`}>{sucursal.telefono}</a>
        </div>
        <div className="tarjeta-sucursal__acciones">
          <Link to={`/reservar?sucursal=${sucursal.slug}`} className="boton boton--primario boton--pequeno">
            Reservar aquí
          </Link>
          <a href={urlMapa(sucursal)} target="_blank" rel="noreferrer" className="boton boton--fantasma boton--pequeno">
            Ver en mapa
          </a>
        </div>
      </div>
    </article>
  )
}
