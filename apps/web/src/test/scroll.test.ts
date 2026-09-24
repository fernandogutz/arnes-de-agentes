import { afterEach, describe, expect, it, vi } from 'vitest'
import { DESFASE_NAV, desplazarAlElemento } from '../lib/scroll'

// Elemento falso: solo necesitamos su posición respecto al viewport.
function nodoEn(top: number): HTMLElement {
  const nodo = document.createElement('div')
  nodo.getBoundingClientRect = () => ({ top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) })
  return nodo
}

function fingirMotionReducido(reducido: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((consulta: string) => ({
      matches: reducido && consulta.includes('prefers-reduced-motion'),
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

describe('desplazarAlElemento', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('desplaza suave dejando el elemento justo bajo la barra fija', () => {
    fingirMotionReducido(false)
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('scrollY', 100)

    desplazarAlElemento(nodoEn(400))

    expect(scrollTo).toHaveBeenCalledWith({ top: 500 - DESFASE_NAV, behavior: 'smooth' })
  })

  it('sin animación si el usuario pidió menos movimiento', () => {
    fingirMotionReducido(true)
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)

    desplazarAlElemento(nodoEn(300))

    expect(scrollTo).toHaveBeenCalledWith({ top: 300 - DESFASE_NAV, behavior: 'auto' })
  })

  it('no hace nada si ya estamos en el destino ni si no hay elemento', () => {
    fingirMotionReducido(false)
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)

    desplazarAlElemento(nodoEn(DESFASE_NAV))
    desplazarAlElemento(null)

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('nunca desplaza a un valor negativo', () => {
    fingirMotionReducido(false)
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('scrollY', 500)

    desplazarAlElemento(nodoEn(-1000))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
