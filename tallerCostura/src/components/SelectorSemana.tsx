import { useState } from 'react'
import { addDays, lunesDe, parseISODate, toISODate } from '../lib/fechas'

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface SelectorSemanaProps {
  value: string
  onChange: (lunes: string) => void
}

export function SelectorSemana({ value, onChange }: SelectorSemanaProps) {
  const inicial = value ? parseISODate(value) : new Date()
  const [mes, setMes] = useState(() => new Date(inicial.getFullYear(), inicial.getMonth(), 1))

  const hoy = toISODate(new Date())
  const semanas: Date[][] = []
  for (let lunes = lunesDe(mes); lunes.getMonth() === mes.getMonth() || lunes < mes; lunes = addDays(lunes, 7)) {
    semanas.push(DIAS.map((_, i) => addDays(lunes, i)))
  }

  const mesAnio = mes.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
  const titulo = mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1)

  return (
    <div className="selector-semana">
      <div className="selector-semana-header">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <span className="selector-semana-titulo">{titulo}</span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>

      <div className="selector-semana-dias" aria-hidden="true">
        {DIAS.map((dia, i) => (
          <span key={i}>{dia}</span>
        ))}
      </div>

      {semanas.map((dias) => {
        const lunes = toISODate(dias[0])
        return (
          <div key={lunes} className={`selector-semana-fila${lunes === value ? ' selected' : ''}`}>
            {dias.map((dia) => {
              const iso = toISODate(dia)
              const clases = [
                'selector-semana-dia',
                dia.getMonth() !== mes.getMonth() ? 'fuera-de-mes' : '',
                iso === hoy ? 'hoy' : '',
              ]
              return (
                <button
                  key={iso}
                  type="button"
                  className={clases.filter(Boolean).join(' ')}
                  aria-pressed={lunes === value}
                  onClick={() => onChange(lunes)}
                >
                  {dia.getDate()}
                </button>
              )
            })}
          </div>
        )
      })}

    </div>
  )
}
