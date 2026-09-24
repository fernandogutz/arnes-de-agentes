import { TESTIMONIOS } from '../datos/contenido'
import { IconoComillas } from './Iconos'
import { Reveal } from './Reveal'

export function Testimonios() {
  return (
    <section className="seccion seccion--compacta" id="testimonios">
      <div className="contenedor">
        <Reveal className="encabezado">
          <span className="sobretitulo">Pacientes</span>
          <h2>Lo que cuentan al salir.</h2>
        </Reveal>
        <div className="grilla grilla--3">
          {TESTIMONIOS.map((t, i) => (
            <Reveal key={t.nombre} as="article" className="vidrio vidrio--opaca testimonio" retraso={i * 90}>
              <IconoComillas className="testimonio__comillas" />
              <blockquote>{t.texto}</blockquote>
              <footer>
                <span className="avatar" aria-hidden="true">
                  {t.nombre[0]}
                </span>
                <span>
                  <b>{t.nombre}</b>
                  {t.servicio} · {t.lugar}
                </span>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
