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
