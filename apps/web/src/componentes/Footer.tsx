import { Link } from 'react-router-dom'
import { SUCURSALES_RESPALDO } from '../datos/respaldo'
import { EMAIL_CONTACTO, TELEFONO_CENTRAL } from '../datos/contenido'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="footer">
      <div className="contenedor">
        <div className="footer__grilla">
          <div>
            <Logo />
            <p style={{ marginTop: 16, maxWidth: 320 }}>
              Odontología digital con 4 sucursales en Chile. Diagnóstico 3D, implantes guiados y ortodoncia invisible.
            </p>
          </div>
          <div>
            <h4>Sucursales</h4>
            <ul>
              {SUCURSALES_RESPALDO.map((s) => (
                <li key={s.slug}>
                  <Link to={`/sucursales#${s.slug}`}>{s.comuna}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Sitio</h4>
            <ul>
              <li><Link to="/servicios">Servicios</Link></li>
              <li><Link to="/sucursales">Sucursales</Link></li>
              <li><a href="/#tecnologia">Tecnología</a></li>
              <li><Link to="/reservar">Reservar hora</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li><a href={`tel:${TELEFONO_CENTRAL.replace(/\s/g, '')}`}>{TELEFONO_CENTRAL}</a></li>
              <li><a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a></li>
              <li>Urgencias: mismo día, todas las sucursales.</li>
            </ul>
          </div>
        </div>
        <div className="footer__pie">
          <span>© {new Date().getFullYear()} Nébula Dental · Proyecto demo, la clínica no existe.</span>
          <span>Fotos: Wikimedia Commons / Unsplash (ver <code>public/img/CREDITS.md</code>).</span>
        </div>
      </div>
    </footer>
  )
}
