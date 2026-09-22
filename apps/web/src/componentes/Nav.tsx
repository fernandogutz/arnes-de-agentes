import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
import { IconoCerrar, IconoMenu } from './Iconos'

const LINKS = [
  { a: '/servicios', texto: 'Servicios' },
  { a: '/sucursales', texto: 'Sucursales' },
  { a: '/#tecnologia', texto: 'Tecnología' },
  { a: '/#equipo', texto: 'Equipo' },
]

export function Nav() {
  const [pegada, setPegada] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const alScroll = () => setPegada(window.scrollY > 24)
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  // Cierra el menú móvil al navegar.
  useEffect(() => setAbierto(false), [pathname])

  const esHome = pathname === '/'
  const clase = `nav ${pegada || !esHome || abierto ? 'nav--pegada' : ''}`

  return (
    <header className={clase}>
      <div className="contenedor">
        <nav className="nav__barra" aria-label="Principal">
          <Logo />
          <ul className="nav__links">
            {LINKS.map((l) => (
              <li key={l.a}>
                {l.a.includes('#') ? (
                  <a href={l.a}>{l.texto}</a>
                ) : (
                  <NavLink to={l.a} className={({ isActive }) => (isActive ? 'activo' : '')}>
                    {l.texto}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
          <div className="nav__acciones">
            <Link to="/reservar" className="boton boton--primario boton--pequeno">
              Reservar hora
            </Link>
            <button
              className="nav__hamburguesa"
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={abierto}
              onClick={() => setAbierto((v) => !v)}
            >
              {abierto ? <IconoCerrar /> : <IconoMenu />}
            </button>
          </div>
        </nav>
        {abierto && (
          <div className="nav__movil">
            {LINKS.map((l) => (
              <a key={l.a} href={l.a} onClick={() => setAbierto(false)}>
                {l.texto}
              </a>
            ))}
            <Link to="/reservar" className="boton boton--primario">
              Reservar hora
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
