import { Link } from 'react-router-dom'

export function NoEncontrada() {
  return (
    <main className="pagina contenedor no-encontrada">
      <div>
        <span className="sobretitulo">404</span>
        <h1>Esta página se salió de órbita.</h1>
        <p className="silenciado" style={{ marginTop: 12 }}>
          No encontramos lo que buscabas.
        </p>
        <Link to="/" className="boton boton--fantasma" style={{ marginTop: 24 }}>
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
