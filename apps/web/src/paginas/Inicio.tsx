import { CTA } from '../componentes/CTA'
import { Equipo } from '../componentes/Equipo'
import { Hero } from '../componentes/Hero'
import { Servicios } from '../componentes/Servicios'
import { Sucursales } from '../componentes/Sucursales'
import { Tecnologia } from '../componentes/Tecnologia'
import { Testimonios } from '../componentes/Testimonios'

export function Inicio() {
  return (
    <>
      <Hero />
      <Tecnologia />
      <Servicios limite={4} />
      <Sucursales />
      <Equipo />
      <Testimonios />
      <CTA />
    </>
  )
}
