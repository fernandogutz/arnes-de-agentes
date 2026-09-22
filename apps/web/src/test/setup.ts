import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Las escenas 3D no se cargan en jsdom (no hay WebGL): se reemplazan por un div marcador.
vi.mock('../tres/EscenaHero', () => ({ default: () => null }))
vi.mock('../tres/EscenaEscaner', () => ({ default: () => null }))
vi.mock('../tres/soporte', () => ({ soportaWebGL: () => false, prefiereMenosMovimiento: () => true }))

// jsdom no trae IntersectionObserver ni scrollIntoView.
class IOFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
Object.defineProperty(globalThis, 'IntersectionObserver', { value: IOFalso, writable: true })
Element.prototype.scrollIntoView = () => {}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
