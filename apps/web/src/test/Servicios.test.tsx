import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Servicios } from '../componentes/Servicios'
import { SERVICIOS_RESPALDO } from '../datos/respaldo'

describe('Servicios', () => {
  it('con la API caída muestra los 8 servicios de respaldo y el aviso', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(
      <MemoryRouter>
        <Servicios />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getAllByTestId('tarjeta-servicio')).toHaveLength(SERVICIOS_RESPALDO.length))
    expect(screen.getByRole('status')).toHaveTextContent(/datos de referencia/)
    expect(screen.getByText('Ortodoncia invisible')).toBeInTheDocument()
    expect(screen.getByText('$1.900.000')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('con la API arriba usa lo que devuelve y no muestra el aviso', async () => {
    const respuesta = [SERVICIOS_RESPALDO[0], SERVICIOS_RESPALDO[1]]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(respuesta), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      ),
    )
    render(
      <MemoryRouter>
        <Servicios />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getAllByTestId('tarjeta-servicio')).toHaveLength(2))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
