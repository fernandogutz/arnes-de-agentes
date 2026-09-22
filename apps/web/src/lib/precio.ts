// Formato de pesos chilenos: $1.900.000 (sin decimales, punto como separador de miles).
export function formatearCLP(monto: number): string {
  const entero = Math.round(Math.abs(monto))
  const conPuntos = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${monto < 0 ? '-' : ''}$${conPuntos}`
}

export function precioDesde(monto: number): string {
  return `desde ${formatearCLP(monto)}`
}
