import { describe, expect, it } from 'vitest'
import { centroVertical, crearDienteGeometria, tipoPorIndice, type TipoDiente } from '../tres/geometriaDiente'

// Ojo: este test corre en jsdom. La geometría es pura matemática sobre BufferGeometry,
// no toca WebGL ni descarga modelos, así que es seguro importarla acá.

const TIPOS: TipoDiente[] = ['molar', 'premolar', 'canino', 'incisivo']

describe('geometría dental', () => {
  it.each(TIPOS)('%s: geometría válida, cerrada y sin NaN', (tipo) => {
    const g = crearDienteGeometria(tipo, 'baja')
    const pos = g.getAttribute('position')
    const idx = g.getIndex()

    expect(pos.count).toBeGreaterThan(100)
    expect(idx).not.toBeNull()
    expect(idx!.count % 3).toBe(0)
    expect(Array.from(pos.array as Float32Array).every(Number.isFinite)).toBe(true)
    // Ningún índice puede apuntar fuera del buffer.
    expect(Math.max(...Array.from(idx!.array))).toBeLessThan(pos.count)
    expect(g.getAttribute('normal')).toBeDefined()
  })

  it('la corona queda sobre el cuello (y = 0) y la raíz debajo', () => {
    const g = crearDienteGeometria('molar', 'baja')
    g.computeBoundingBox()
    const bb = g.boundingBox!
    expect(bb.max.y).toBeGreaterThan(0.5) // corona
    expect(bb.min.y).toBeLessThan(-1) // raíces
    expect(centroVertical(g)).toBeLessThan(0)
  })

  it('el molar es más ancho mesio-distal que el incisivo, y el incisivo más plano', () => {
    const molar = crearDienteGeometria('molar', 'baja')
    const incisivo = crearDienteGeometria('incisivo', 'baja')
    molar.computeBoundingBox()
    incisivo.computeBoundingBox()
    const anchoZ = (g: typeof molar) => g.boundingBox!.max.z - g.boundingBox!.min.z
    expect(molar.boundingBox!.max.x).toBeGreaterThan(incisivo.boundingBox!.max.x)
    expect(anchoZ(incisivo)).toBeLessThan(anchoZ(molar) / 2)
  })

  it('memoiza por tipo y calidad', () => {
    expect(crearDienteGeometria('premolar', 'baja')).toBe(crearDienteGeometria('premolar', 'baja'))
    expect(crearDienteGeometria('premolar', 'baja')).not.toBe(crearDienteGeometria('premolar', 'media'))
  })

  it('la arcada ordena las piezas de incisivo central a molar', () => {
    const tipos = Array.from({ length: 14 }, (_, i) => tipoPorIndice(i, 14))
    expect(tipos[0]).toBe('molar')
    expect(tipos[6]).toBe('incisivo')
    expect(tipos[7]).toBe('incisivo')
    expect(tipos[13]).toBe('molar')
    // Simétrica respecto de la línea media.
    expect(tipos.slice(0, 7)).toEqual([...tipos.slice(7)].reverse())
  })
})
