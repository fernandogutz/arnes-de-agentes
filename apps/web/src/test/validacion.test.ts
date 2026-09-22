import { describe, expect, it } from 'vitest'
import { hayErrores, validarPaciente } from '../lib/validacion'

describe('validarPaciente', () => {
  it('acepta datos correctos', () => {
    const e = validarPaciente({ nombre: 'Josefa Morales', email: 'josefa@correo.cl', telefono: '+56 9 1234 5678' })
    expect(hayErrores(e)).toBe(false)
  })
  it('marca los tres campos vacíos', () => {
    const e = validarPaciente({ nombre: '', email: '', telefono: '' })
    expect(Object.keys(e).sort()).toEqual(['email', 'nombre', 'telefono'])
  })
  it('pide nombre y apellido, correo válido y teléfono razonable', () => {
    const e = validarPaciente({ nombre: 'Josefa', email: 'josefa@correo', telefono: '123' })
    expect(e.nombre).toMatch(/apellido/)
    expect(e.email).toBeDefined()
    expect(e.telefono).toBeDefined()
  })
})
