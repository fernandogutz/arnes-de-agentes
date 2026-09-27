import { useSucursales } from '../lib/api'
import { AvisoRespaldo } from './AvisoRespaldo'
import { Reveal } from './Reveal'
import { TarjetaSucursal } from './TarjetaSucursal'

export function Sucursales({ conEncabezado = true }: { conEncabezado?: boolean }) {
  const { datos, deRespaldo, cargando } = useSucursales()
  return (
    <section className="seccion" id="sucursales">
      <div className="contenedor">
        {conEncabezado && (
          <Reveal className="encabezado">
            <span className="sobretitulo">Sucursales</span>
            <h2>Cuatro puntos en el mapa. Un mismo estándar.</h2>
            <p>Tu ficha y tus escaneos viajan contigo: puedes partir un tratamiento en Santiago y controlarlo en Viña.</p>
          </Reveal>
        )}
        <AvisoRespaldo visible={deRespaldo} />
        <div className="grilla grilla--4" aria-busy={cargando}>
          {cargando
            ? Array.from({ length: 4 }, (_, i) => <div className="esqueleto" key={i} style={{ minHeight: 380 }} />)
            : datos.map((s, i) => (
                <Reveal key={s.slug} className="celda" retraso={i * 80}>
                  <TarjetaSucursal sucursal={s} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  )
}
