import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { IconoCheck } from '../componentes/Iconos'
import { urlMapa } from '../componentes/TarjetaSucursal'
import { SERVICIOS_RESPALDO, SUCURSALES_RESPALDO } from '../datos/respaldo'
import { api, useServicios, useSucursales } from '../lib/api'
import { capitalizar, fechaLarga, horaLocal } from '../lib/fechas'
import type { Reserva } from '../lib/tipos'

export function Confirmacion() {
  const { codigo = '' } = useParams()
  const { state } = useLocation() as { state?: { reserva?: Reserva } }
  const [reserva, setReserva] = useState<Reserva | null>(state?.reserva ?? null)
  const [error, setError] = useState<string | null>(null)
  const { datos: sucursales } = useSucursales()
  const { datos: servicios } = useServicios()

  // Venimos de un wizard que quedó scrolleado: la confirmación siempre parte arriba, sin animación.
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'auto' })
      } catch {
        window.scrollTo(0, 0)
      }
    }
  }, [])

  useEffect(() => {
    api
      .reserva(codigo)
      .then(setReserva)
      .catch((e: { codigo?: string }) => {
        if (!state?.reserva) setError(e.codigo === 'sin_api' ? 'sin_api' : 'no_encontrada')
      })
  }, [codigo, state])

  if (error) {
    return (
      <main className="pagina contenedor no-encontrada">
        <div>
          <span className="sobretitulo">Reserva {codigo}</span>
          <h1>{error === 'sin_api' ? 'No pudimos consultar la reserva.' : 'No encontramos esa reserva.'}</h1>
          <p className="silenciado" style={{ marginTop: 12 }}>
            {error === 'sin_api'
              ? 'La API no está respondiendo. Revisa que esté corriendo en el puerto 3001.'
              : 'Revisa el código: son 6 letras y números en mayúscula.'}
          </p>
          <Link to="/reservar" className="boton boton--fantasma" style={{ marginTop: 24 }}>
            Hacer una nueva reserva
          </Link>
        </div>
      </main>
    )
  }

  if (!reserva) {
    return (
      <main className="pagina confirmacion">
        <span className="cargando" aria-label="Cargando" />
      </main>
    )
  }

  const sucursal = (sucursales.length ? sucursales : SUCURSALES_RESPALDO).find((s) => s.slug === reserva.sucursal)
  const servicio = (servicios.length ? servicios : SERVICIOS_RESPALDO).find((s) => s.slug === reserva.servicio)

  return (
    <main className="pagina confirmacion">
      <div className="contenedor" style={{ display: 'grid', justifyItems: 'center' }}>
        <section className="vidrio confirmacion__tarjeta" aria-labelledby="titulo-confirmacion">
          <span className="confirmacion__check" aria-hidden="true">
            <IconoCheck tamano={34} />
          </span>
          <div>
            <span className="sobretitulo" style={{ marginBottom: 8 }}>
              Reserva {reserva.estado}
            </span>
            <h1 id="titulo-confirmacion" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
              Te esperamos, {reserva.paciente.nombre.split(' ')[0]}.
            </h1>
          </div>
          <p className="silenciado pequeno">Tu código de reserva</p>
          <div className="codigo" data-testid="codigo-reserva">
            {reserva.codigo}
          </div>
          <div className="resumen">
            <div>
              <span>Fecha</span>
              <b>{capitalizar(fechaLarga(reserva.inicio))}</b>
            </div>
            <div>
              <span>Hora</span>
              <b>{horaLocal(reserva.inicio)} hrs (hora de Chile)</b>
            </div>
            <div>
              <span>Servicio</span>
              <b>{servicio?.nombre ?? reserva.servicio}</b>
            </div>
            <div>
              <span>Sucursal</span>
              <b>{sucursal ? `${sucursal.nombre} · ${sucursal.direccion}` : reserva.sucursal}</b>
            </div>
            <div>
              <span>Confirmación a</span>
              <b>{reserva.paciente.email}</b>
            </div>
          </div>
          <div className="confirmacion__acciones">
            {sucursal && (
              <a href={urlMapa(sucursal)} target="_blank" rel="noreferrer" className="boton boton--fantasma">
                Cómo llegar
              </a>
            )}
            <Link to="/" className="boton boton--texto">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
