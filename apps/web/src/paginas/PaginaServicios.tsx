import { Servicios } from '../componentes/Servicios'

export function PaginaServicios() {
  return (
    <main className="pagina">
      <div className="contenedor pagina__cabecera">
        <span className="sobretitulo">Servicios</span>
        <h1>Todo lo que hacemos, con precio.</h1>
        <p>Los valores son "desde": el diagnóstico digital define el presupuesto exacto y lo firmamos antes de partir.</p>
      </div>
      <Servicios conFiltros conEncabezado={false} />
    </main>
  )
}
