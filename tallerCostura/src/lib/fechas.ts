// Fechas "de calendario" (sin hora) en la zona local del navegador. Nunca usar toISOString():
// convierte a UTC y en Ecuador (UTC-5) corre el día.

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function lunesDe(date: Date): Date {
  // getDay(): 0 = domingo … 6 = sábado; la semana empieza el lunes.
  return addDays(date, -((date.getDay() + 6) % 7))
}

export function formatDiaCorto(date: Date): string {
  return date.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, '')
}

export function formatRangoSemana(lunes: Date): string {
  const domingo = addDays(lunes, 6)
  return `Semana del ${formatDiaCorto(lunes)} al ${formatDiaCorto(domingo)} ${domingo.getFullYear()}`
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']

function aFecha(value: Date | string): Date {
  // 'YYYY-MM-DD' es una fecha de calendario (local); cualquier otra cadena es un instante ISO.
  if (typeof value === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISODate(value) : new Date(value)
  return value
}

// "18 oct 2026". Se arma a mano para no depender de cómo cada navegador abrevia en es-EC.
export function formatFecha(value: Date | string): string {
  const date = aFecha(value)
  return `${date.getDate()} ${MESES_CORTOS[date.getMonth()]} ${date.getFullYear()}`
}

// "18 oct"
export function formatDiaMes(value: Date | string): string {
  const date = aFecha(value)
  return `${date.getDate()} ${MESES_CORTOS[date.getMonth()]}`
}

// "18 oct 2026, 09:56"
export function formatFechaHora(value: Date | string): string {
  const date = aFecha(value)
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${formatFecha(date)}, ${hh}:${mm}`
}

// "12 oct 2026 - 18 oct 2026"
export function formatRangoFechas(inicio: Date | string, fin: Date | string): string {
  return `${formatFecha(inicio)} - ${formatFecha(fin)}`
}
