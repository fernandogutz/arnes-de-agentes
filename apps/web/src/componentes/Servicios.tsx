import { useState } from 'react'
import { Link } from 'react-router-dom'
import { NOMBRES_CATEGORIA } from '../datos/respaldo'
import { useServicios } from '../lib/api'
import type { CategoriaServicio } from '../lib/tipos'
import { AvisoRespaldo } from './AvisoRespaldo'
import { Reveal } from './Reveal'
import { TarjetaServicio } from './TarjetaServicio'

type Props = { conFiltros?: boolean; limite?: number; conEncabezado?: boolean }

// Grilla de servicios desde la API (o respaldo). Con filtros por categoría en la página /servicios.
export function Servicios({ conFiltros = false, limite, conEncabezado = true }: Props) {
  const { datos, deRespaldo, cargando } = useServicios()
  const [filtro, setFiltro] = useState<CategoriaServicio | 'todos'>('todos')

  const categorias = Array.from(new Set(datos.map((s) => s.categoria)))
  const visibles = datos.filter((s) => filtro === 'todos' || s.categoria === filtro).slice(0, limite)

  return (
    <section className="seccion" id="servicios">
      <div className="contenedor">
        {conEncabezado && (
          <Reveal className="encabezado">
            <span className="sobretitulo">Servicios</span>
            <h2>Precios claros, desde el primer clic.</h2>
            <p>Cada tratamiento parte con un diagnóstico digital y un presupuesto cerrado. Sin sorpresas al final.</p>
          </Reveal>
        )}
        <AvisoRespaldo visible={deRespaldo} />

        {conFiltros && (
          <div className="filtros" role="tablist" aria-label="Filtrar por categoría">
            <button className={`filtro ${filtro === 'todos' ? 'activo' : ''}`} onClick={() => setFiltro('todos')}>
              Todos
            </button>
            {categorias.map((c) => (
              <button key={c} className={`filtro ${filtro === c ? 'activo' : ''}`} onClick={() => setFiltro(c)}>
                {NOMBRES_CATEGORIA[c]}
              </button>
            ))}
          </div>
        )}

        <div className="grilla grilla--servicios" aria-busy={cargando}>
          {cargando
            ? Array.from({ length: limite ?? 8 }, (_, i) => <div className="esqueleto" key={i} />)
            : visibles.map((s, i) => (
                <Reveal key={s.slug} className="celda" retraso={(i % 3) * 70}>
                  <TarjetaServicio servicio={s} />
                </Reveal>
              ))}
        </div>

        {limite && datos.length > limite && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link to="/servicios" className="boton boton--fantasma">
              Ver los {datos.length} servicios
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
