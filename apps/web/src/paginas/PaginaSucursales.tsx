import { Sucursales } from '../componentes/Sucursales'

export function PaginaSucursales() {
  return (
    <main className="pagina">
      <div className="contenedor pagina__cabecera">
        <span className="sobretitulo">Sucursales</span>
        <h1>Dónde estamos.</h1>
        <p>Tres sucursales en Santiago y una en Viña del Mar. El estado "abierta / cerrada" se calcula con la hora de Chile.</p>
      </div>
      <Sucursales conEncabezado={false} />
    </main>
  )
}
