import { Link } from 'react-router-dom'
import { TELEFONO_CENTRAL } from '../datos/contenido'
import { IconoFlecha } from './Iconos'
import { Reveal } from './Reveal'

export function CTA() {
  return (
    <section className="seccion seccion--compacta">
      <div className="contenedor">
        <Reveal className="cta">
          <img className="cta__foto" src="/img/sonrisa.jpg" alt="" loading="lazy" />
          <span className="sobretitulo" style={{ marginBottom: 0 }}>
            Primera consulta
          </span>
          <h2>Tu diagnóstico 3D, hoy mismo. Sin llamar a nadie.</h2>
          <p>Elige sucursal, servicio y hora en menos de un minuto. Te confirmamos al instante con un código.</p>
          <div className="hero__ctas" style={{ justifyContent: 'center' }}>
            <Link to="/reservar" className="boton boton--primario">
              Reservar hora <IconoFlecha />
            </Link>
            <a href={`tel:${TELEFONO_CENTRAL.replace(/\s/g, '')}`} className="boton boton--fantasma">
              o llama al {TELEFONO_CENTRAL}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
