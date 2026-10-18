// Muestra de color para el nombre que escribe la empleada. Son colores de la prenda (dato),
// no de la interfaz, por eso no van como tokens. Si el nombre no se reconoce, no hay muestra.
const COLORES: Record<string, string> = {
  rojo: '#d92d20',
  vino: '#7a1f2b',
  rosado: '#f290b5',
  rosa: '#f290b5',
  fucsia: '#d0219b',
  morado: '#7f3fbf',
  lila: '#b79ae0',
  azul: '#2563eb',
  celeste: '#7cc4f0',
  turquesa: '#1fb5b0',
  verde: '#16a34a',
  amarillo: '#facc15',
  naranja: '#f97316',
  anaranjado: '#f97316',
  cafe: '#7b4a2a',
  marron: '#7b4a2a',
  beige: '#e3d1b0',
  crema: '#f3e9d2',
  negro: '#111111',
  blanco: '#ffffff',
  gris: '#9ca3af',
  dorado: '#c9a227',
  plateado: '#c0c4cc',
}

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function muestraDeColor(nombre: string): string | null {
  const palabra = normalizar(nombre).split(/\s+/)[0] ?? ''
  return COLORES[palabra] ?? COLORES[palabra.replace(/s$/, '')] ?? null
}

// Sugerencias para el campo de color (con tildes, como se escriben).
export const COLORES_SUGERIDOS = [
  'rojo', 'vino', 'rosado', 'fucsia', 'morado', 'lila', 'azul', 'celeste', 'turquesa', 'verde',
  'amarillo', 'naranja', 'café', 'marrón', 'beige', 'crema', 'negro', 'blanco', 'gris', 'dorado', 'plateado',
]
