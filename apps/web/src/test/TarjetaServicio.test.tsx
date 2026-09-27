import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TarjetaServicio } from '../componentes/TarjetaServicio'
import { SERVICIOS_RESPALDO } from '../datos/respaldo'

const diagnostico = SERVICIOS_RESPALDO[0]!
const urgencia = SERVICIOS_RESPALDO.find((s) => s.categoria === 'urgencias')!

function montar(servicio = diagnostico) {
  render(
    <MemoryRouter>
      <TarjetaServicio servicio={servicio} />
    </MemoryRouter>,
  )
  return screen.getByTestId('tarjeta-servicio')
}

describe('TarjetaServicio', () => {
  it('muestra etiqueta, título, descripción, precio y CTA a reservar', () => {
    const tarjeta = montar()
    expect(within(tarjeta).getByText('Diagnóstico')).toBeInTheDocument()
    expect(within(tarjeta).getByRole('heading', { name: diagnostico.nombre })).toBeInTheDocument()
    expect(within(tarjeta).getByText(diagnostico.descripcion)).toBeInTheDocument()
    expect(within(tarjeta).getByText('$25.000')).toBeInTheDocument()
    expect(within(tarjeta).getByText(`desde · ${diagnostico.duracionMin} min`)).toBeInTheDocument()
    expect(within(tarjeta).getByRole('link', { name: /Reservar/ })).toHaveAttribute(
      'href',
      `/reservar?servicio=${diagnostico.slug}`,
    )
  })

  it('pone la etiqueta antes del título para que no compitan en la misma línea', () => {
    const tarjeta = montar()
    const etiqueta = within(tarjeta).getByText('Diagnóstico')
    const titulo = within(tarjeta).getByRole('heading', { name: diagnostico.nombre })
    // La etiqueta es hermana directa del título y va primero: sin cabecera en fila.
    expect(etiqueta.parentElement).toBe(tarjeta)
    expect(titulo.parentElement).toBe(tarjeta)
    expect(etiqueta.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('marca en rojo la etiqueta de urgencias', () => {
    const tarjeta = montar(urgencia)
    expect(within(tarjeta).getByText('Urgencias')).toHaveClass('etiqueta--roja')
  })
})
