import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './componentes/Footer'
import { Nav } from './componentes/Nav'
import { Confirmacion } from './paginas/Confirmacion'
import { Inicio } from './paginas/Inicio'
import { NoEncontrada } from './paginas/NoEncontrada'
import { PaginaServicios } from './paginas/PaginaServicios'
import { PaginaSucursales } from './paginas/PaginaSucursales'
import { Reservar } from './paginas/Reservar'

// Al cambiar de ruta sube al inicio; si hay #ancla, la busca.
function ScrollAlCambiarRuta() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollAlCambiarRuta />
      <Nav />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/sucursales" element={<PaginaSucursales />} />
        <Route path="/servicios" element={<PaginaServicios />} />
        <Route path="/reservar" element={<Reservar />} />
        <Route path="/reserva/:codigo" element={<Confirmacion />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
