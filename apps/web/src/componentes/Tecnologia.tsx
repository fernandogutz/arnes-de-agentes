import { lazy, Suspense, useMemo } from 'react'
import { TECNOLOGIAS } from '../datos/contenido'
import { soportaWebGL } from '../tres/soporte'
import { useVisible } from '../tres/useVisible'
import { IconoEscaner, IconoImplante, IconoLaser, IconoRayos } from './Iconos'
import { Reveal } from './Reveal'

const EscenaEscaner = lazy(() => import('../tres/EscenaEscaner'))

const ICONOS = {
  escaner: IconoEscaner,
  rayos: IconoRayos,
  implantes: IconoImplante,
  laser: IconoLaser,
} as const

export function Tecnologia() {
  const webgl = useMemo(() => soportaWebGL(), [])
  const { ref, visible } = useVisible<HTMLElement>()

  return (
    <section className="seccion" id="tecnologia" ref={ref}>
      <div className="contenedor">
        <Reveal className="encabezado">
          <span className="sobretitulo">Tecnología</span>
          <h2>Menos adivinar. Más ver.</h2>
          <p>Todo el diagnóstico es digital: lo que hacemos en tu boca primero lo planificamos en pantalla, contigo al lado.</p>
        </Reveal>

        <div className="tecnologia">
          <div className="grilla grilla--2">
            {TECNOLOGIAS.map((t, i) => {
              const Icono = ICONOS[t.id]
              return (
                <Reveal key={t.id} as="article" className="vidrio vidrio--opaca vidrio--interactiva tarjeta-tec" retraso={i * 80}>
                  <span className="tarjeta-tec__icono">
                    <Icono />
                  </span>
                  <h3>{t.titulo}</h3>
                  <p>{t.texto}</p>
                  <span className="tarjeta-tec__dato">{t.dato}</span>
                </Reveal>
              )
            })}
          </div>

          <Reveal as="div" retraso={120}>
            <figure className="tecnologia__escena" style={{ margin: 0 }}>
              {webgl ? (
                <Suspense fallback={<img src="/img/tecnologia-instrumental.jpg" alt="" loading="lazy" />}>
                  <EscenaEscaner activo={visible} />
                </Suspense>
              ) : (
                <img src="/img/tecnologia-instrumental.jpg" alt="Instrumental dental junto a una ventana" loading="lazy" />
              )}
              <figcaption>Escáner intraoral · simulación</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
