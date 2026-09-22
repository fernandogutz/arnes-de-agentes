import type { Paciente } from './tipos'

export type ErroresPaciente = Partial<Record<keyof Paciente, string>>

// Validación del formulario de datos del paciente. Devuelve un objeto vacío si todo está bien.
export function validarPaciente(p: Paciente): ErroresPaciente {
  const errores: ErroresPaciente = {}
  const nombre = p.nombre.trim()
  if (nombre.length < 3) errores.nombre = 'Escribe tu nombre completo.'
  else if (!/\s/.test(nombre)) errores.nombre = 'Incluye nombre y apellido.'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email.trim())) errores.email = 'Ese correo no se ve bien.'

  const digitos = p.telefono.replace(/\D/g, '')
  if (digitos.length < 8 || digitos.length > 12) errores.telefono = 'Teléfono chileno, ej. +56 9 1234 5678.'

  return errores
}

export function hayErrores(errores: ErroresPaciente): boolean {
  return Object.keys(errores).length > 0
}
