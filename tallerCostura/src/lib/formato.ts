export function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

export function formatNumero(n: number): string {
  return n.toLocaleString('es-EC')
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  return ((partes[0][0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

interface Cantidades {
  confeccion: number
  mullos: number
  ataches: number
}

// "6 blusas, 6 mullos": solo las cantidades mayores a 0, con palabras completas.
export function formatCantidades({ confeccion, mullos, ataches }: Cantidades): string {
  const partes = [
    [confeccion, 'blusa', 'blusas'],
    [mullos, 'mullo', 'mullos'],
    [ataches, 'atache', 'ataches'],
  ] as const
  const texto = partes
    .filter(([n]) => n > 0)
    .map(([n, uno, varios]) => `${formatNumero(n)} ${n === 1 ? uno : varios}`)
    .join(', ')
  return texto || 'Sin cantidades'
}

export function cantidadesDe(registro: { cantidadConfeccion: number; cantidadMullos: number; cantidadAtaches: number }): Cantidades {
  return { confeccion: registro.cantidadConfeccion, mullos: registro.cantidadMullos, ataches: registro.cantidadAtaches }
}
