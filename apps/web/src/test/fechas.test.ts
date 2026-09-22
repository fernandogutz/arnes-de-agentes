import { describe, expect, it } from 'vitest'
import { estaAbierta, fechaISOLocal, fechaLarga, horaLocal, horarioDeHoy, slotsDeRespaldo, textoEstado } from '../lib/fechas'
import type { Horario } from '../lib/tipos'

const HORARIO: Horario = { lunVie: '09:00-19:00', sab: '10:00-14:00', dom: null }

describe('conversión UTC → America/Santiago', () => {
  it('en horario de verano (UTC-3) 13:00Z son las 10:00', () => {
    expect(horaLocal('2026-09-22T13:00:00.000Z')).toBe('10:00')
  })
  it('en horario de invierno (UTC-4) 13:00Z son las 09:00', () => {
    expect(horaLocal('2026-07-01T13:00:00.000Z')).toBe('09:00')
  })
  it('cambia de día cuando corresponde', () => {
    // 02:30Z del 23 es aún 23:30 del 22 en Chile.
    expect(fechaISOLocal(new Date('2026-09-23T02:30:00.000Z'))).toBe('2026-09-22')
    expect(horaLocal('2026-09-23T02:30:00.000Z')).toBe('23:30')
  })
  it('arma la fecha larga en español', () => {
    expect(fechaLarga('2026-09-22T13:00:00.000Z')).toBe('martes 22 de septiembre')
  })
})

describe('estado de la sucursal', () => {
  it('abierta un martes a las 09:00 local', () => {
    expect(estaAbierta(HORARIO, new Date('2026-09-22T12:00:00.000Z'))).toBe(true)
    expect(textoEstado(HORARIO, new Date('2026-09-22T12:00:00.000Z'))).toBe('Abierta · cierra 19:00')
  })
  it('cerrada a las 19:30 local y los domingos', () => {
    expect(estaAbierta(HORARIO, new Date('2026-09-22T22:30:00.000Z'))).toBe(false)
    expect(estaAbierta(HORARIO, new Date('2026-09-27T15:00:00.000Z'))).toBe(false) // domingo
    expect(horarioDeHoy(HORARIO, new Date('2026-09-27T15:00:00.000Z'))).toBeNull()
  })
  it('usa el horario de sábado', () => {
    expect(horarioDeHoy(HORARIO, new Date('2026-09-26T15:00:00.000Z'))).toBe('10:00-14:00')
    expect(textoEstado(HORARIO, new Date('2026-09-26T11:00:00.000Z'))).toBe('Cerrada · abre hoy 10:00')
  })
})

describe('slots de respaldo', () => {
  it('genera horas cada 30 min en UTC a partir del horario local', () => {
    expect(slotsDeRespaldo('2026-09-22', '09:00-10:30')).toEqual([
      '2026-09-22T12:00:00.000Z',
      '2026-09-22T12:30:00.000Z',
      '2026-09-22T13:00:00.000Z',
    ])
  })
  it('sin horario no hay slots', () => {
    expect(slotsDeRespaldo('2026-09-27', null)).toEqual([])
  })
})
