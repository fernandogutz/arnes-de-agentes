import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TarjetaSucursal } from '../componentes/TarjetaSucursal'
import { SUCURSALES_RESPALDO } from '../datos/respaldo'

const lasCondes = SUCURSALES_RESPALDO[0]!

describe('TarjetaSucursal', () => {
  it('muestra nombre, comuna, horario de hoy y estado abierta en hora de Chile', () => {
    // Martes 22-09-2026 a las 10:00 de Chile (13:00Z).
    render(
      <MemoryRouter>
        <TarjetaSucursal sucursal={lasCondes} ahora={new Date('2026-09-22T13:00:00.000Z')} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Nébula Las Condes' })).toBeInTheDocument()
    expect(screen.getByText(/Las Condes · Santiago/)).toBeInTheDocument()
    expect(screen.getByText('Hoy: 08:00 a 21:00')).toBeInTheDocument()
    expect(screen.getByText(/Abierta/)).toBeInTheDocument()
  })

  it('muestra cerrada un domingo y enlaza al mapa con la dirección', () => {
    render(
      <MemoryRouter>
        <TarjetaSucursal sucursal={lasCondes} ahora={new Date('2026-09-27T15:00:00.000Z')} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Cerrada ahora')).toBeInTheDocument()
    expect(screen.getByText('Hoy: cerrado')).toBeInTheDocument()
    const mapa = screen.getByRole('link', { name: 'Ver en mapa' })
    expect(mapa).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
    expect(decodeURIComponent(mapa.getAttribute('href') ?? '')).toContain('Apoquindo 4820')
  })
})
