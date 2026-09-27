import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Reservar } from '../paginas/Reservar'

describe('Reservar (wizard)', () => {
  beforeEach(() => {
    // Martes 22-09-2026 a las 09:00 de Chile: hay horas disponibles "hoy".
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date('2026-09-22T12:00:00.000Z') })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('salta al paso 3 con sucursal y servicio en la URL, y valida el formulario antes de enviar', async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <MemoryRouter initialEntries={['/reservar?sucursal=las-condes&servicio=limpieza']}>
        <Routes>
          <Route path="/reservar" element={<Reservar />} />
        </Routes>
      </MemoryRouter>,
    )

    // Paso 3: fecha y hora (con slots de respaldo en hora local).
    expect(await screen.findByRole('heading', { name: '¿Cuándo?' })).toBeInTheDocument()
    const horas = await screen.findAllByRole('option')
    expect(horas.length).toBeGreaterThan(0)
    expect(horas[0]).toHaveTextContent(/^\d{2}:\d{2}$/)
    await usuario.click(horas[0]!)
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))

    // Paso 4: enviar vacío → 3 errores y ningún POST.
    expect(await screen.findByRole('heading', { name: 'Tus datos' })).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(3))
    expect(screen.getByText('Escribe tu nombre completo.')).toBeInTheDocument()
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    const posts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST')
    expect(posts).toHaveLength(0)

    // Con datos válidos sí intenta el POST y, sin API, avisa claro.
    await usuario.type(screen.getByLabelText('Nombre y apellido'), 'Josefa Morales')
    await usuario.type(screen.getByLabelText('Teléfono'), '+56 9 1234 5678')
    await usuario.type(screen.getByLabelText(/Correo/), 'josefa@correo.cl')
    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(await screen.findByText(/No pudimos conectar con la API de reservas/)).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(true)
  })

  it('el botón Continuar dice por qué está deshabilitado y se habilita al elegir', async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <MemoryRouter initialEntries={['/reservar']}>
        <Routes>
          <Route path="/reservar" element={<Reservar />} />
        </Routes>
      </MemoryRouter>,
    )

    const continuar = screen.getByRole('button', { name: /Continuar/ })
    expect(continuar).toBeDisabled()
    expect(screen.getByText('Elige una sucursal para continuar.')).toBeInTheDocument()

    await usuario.click(screen.getAllByRole('button', { name: /Nébula Las Condes/ })[0]!)
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeEnabled()
    expect(screen.queryByText('Elige una sucursal para continuar.')).not.toBeInTheDocument()
  })

  it('el riel permite volver a un paso ya completado y conserva lo elegido', async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <MemoryRouter initialEntries={['/reservar?sucursal=las-condes&servicio=limpieza']}>
        <Routes>
          <Route path="/reservar" element={<Reservar />} />
        </Routes>
      </MemoryRouter>,
    )

    // Llegamos al paso 4 eligiendo una hora.
    expect(await screen.findByRole('heading', { name: '¿Cuándo?' })).toBeInTheDocument()
    const horas = await screen.findAllByRole('option')
    const horaElegida = horas[2]!.textContent!
    await usuario.click(horas[2]!)
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(await screen.findByRole('heading', { name: 'Tus datos' })).toBeInTheDocument()

    // El riel muestra lo elegido y deja volver al paso 2.
    const pasoServicio = screen.getByRole('button', { name: /^Paso 2: Servicio, Limpieza profunda/ })
    expect(pasoServicio).toBeEnabled()
    await usuario.click(pasoServicio)
    expect(await screen.findByRole('heading', { name: '¿Qué necesitas?' })).toBeInTheDocument()

    // Y al volver al paso 3 la hora sigue seleccionada.
    await usuario.click(screen.getByRole('button', { name: /^Paso 3: Fecha y hora/ }))
    expect(await screen.findByRole('heading', { name: '¿Cuándo?' })).toBeInTheDocument()
    await waitFor(() => {
      const seleccionada = screen.getAllByRole('option').find((o) => o.getAttribute('aria-selected') === 'true')
      expect(seleccionada).toHaveTextContent(horaElegida)
    })
  })
})
