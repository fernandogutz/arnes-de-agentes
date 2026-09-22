import { EQUIPO } from '../datos/contenido'
import { Reveal } from './Reveal'

export function Equipo() {
  return (
    <section className="seccion" id="equipo">
      <div className="contenedor">
        <Reveal className="encabezado">
          <span className="sobretitulo">Equipo</span>
          <h2>Especialistas que explican antes de tocar.</h2>
          <p>Cada tratamiento lo lleva un especialista de punta a punta. Nadie te va a derivar a la mitad.</p>
        </Reveal>
        <div className="grilla grilla--4">
          {EQUIPO.map((p, i) => (
            <Reveal key={p.nombre} as="article" className="vidrio vidrio--interactiva tarjeta-equipo" retraso={i * 80}>
              <div className="tarjeta-equipo__foto">
                <img src={p.foto} alt={`Retrato de ${p.nombre}`} loading="lazy" />
              </div>
              <div className="tarjeta-equipo__cuerpo">
                <h3>{p.nombre}</h3>
                <span className="tarjeta-equipo__cargo">{p.cargo}</span>
                <p>{p.detalle}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
