import { lazy, Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DienteSvg } from '../tres/DienteSvg'
import { LimiteEscena } from '../tres/LimiteEscena'
import { soportaWebGL } from '../tres/soporte'
import { useVisible } from '../tres/useVisible'
import { IconoFlecha } from './Iconos'

// La escena 3D se carga aparte: la home base pinta sin esperar a Three.js.
const EscenaHero = lazy(() => import('../tres/EscenaHero'))

// Sin WebGL (o mientras carga el chunk 3D) se muestra el mismo diente en SVG.
function DienteFallback() {
  return (
    <div className="diente-css">
      <DienteSvg />
    </div>
  )
}

const STATS = [
  { valor: '4', texto: 'sucursales en Chile' },
  { valor: '12.000+', texto: 'pacientes atendidos' },
  { valor: '98%', texto: 'nos recomienda' },
]

export function Hero() {
  const webgl = useMemo(() => soportaWebGL(), [])
  const { ref, visible } = useVisible<HTMLElement>()

  return (
    <section className="hero" ref={ref} aria-labelledby="titulo-hero">
      <div className="hero__lienzo" aria-hidden="true">
        {webgl ? (
          <LimiteEscena respaldo={<DienteFallback />}>
            <Suspense fallback={<DienteFallback />}>
              <EscenaHero activo={visible} />
            </Suspense>
          </LimiteEscena>
        ) : (
          <DienteFallback />
        )}
      </div>

      <div className="contenedor">
        <div className="hero__contenido">
          <span className="hero__etiqueta reveal visible">
            <b>Nuevo</b> Diagnóstico 3D en menos de 3 minutos
          </span>
          <h1 id="titulo-hero">
            Odontología <span className="degradado">de otra órbita.</span>
          </h1>
          <p className="hero__sub">
            Diagnóstico digital 3D, implantes guiados y ortodoncia invisible en 4 sucursales. Ves tu tratamiento antes de
            empezarlo.
          </p>
          <div className="hero__ctas">
            <Link to="/reservar" className="boton boton--primario">
              Reservar hora <IconoFlecha />
            </Link>
            <Link to="/servicios" className="boton boton--fantasma">
              Ver servicios y precios
            </Link>
          </div>
          <div className="hero__stats">
            {STATS.map((s) => (
              <div className="stat" key={s.texto}>
                <b>{s.valor}</b>
                <span>{s.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hero__scroll" aria-hidden="true">
        Desliza
      </div>
    </section>
  )
}
