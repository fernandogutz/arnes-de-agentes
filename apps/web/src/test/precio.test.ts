import { describe, expect, it } from 'vitest'
import { formatearCLP, precioDesde } from '../lib/precio'

describe('formatearCLP', () => {
  it('separa miles con punto y no muestra decimales', () => {
    expect(formatearCLP(25000)).toBe('$25.000')
    expect(formatearCLP(1900000)).toBe('$1.900.000')
    expect(formatearCLP(450000)).toBe('$450.000')
  })
  it('maneja montos chicos, cero y negativos', () => {
    expect(formatearCLP(0)).toBe('$0')
    expect(formatearCLP(999)).toBe('$999')
    expect(formatearCLP(-1500)).toBe('-$1.500')
  })
  it('arma el texto "desde"', () => {
    expect(precioDesde(35000)).toBe('desde $35.000')
  })
})
