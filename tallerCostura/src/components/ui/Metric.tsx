import { MinusIcon, TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react'
import { formatNumero } from '../../lib/formato'
import './ui.css'

interface MetricProps {
  label: string
  value: number
  // Valor del periodo anterior; sin él (o si es 0) no se muestra tendencia.
  previous?: number
  size?: 'lg' | 'md'
}

export function Metric({ label, value, previous, size = 'md' }: MetricProps) {
  const pct = previous !== undefined && previous > 0 ? Math.round(((value - previous) / previous) * 100) : null

  return (
    <div className={`metric metric-${size}`}>
      <span className="metric-label">{label}</span>
      <div className="metric-row">
        <span className="metric-value">{formatNumero(value)}</span>
        {pct !== null && <Trend pct={pct} />}
      </div>
    </div>
  )
}

function Trend({ pct }: { pct: number }) {
  if (pct === 0) {
    return (
      <span className="metric-trend flat">
        <MinusIcon size={20} aria-hidden="true" />
        0%
        <span className="sr-only">igual que el periodo anterior</span>
      </span>
    )
  }
  const up = pct > 0
  const Icono = up ? TrendUpIcon : TrendDownIcon
  return (
    <span className={`metric-trend ${up ? 'up' : 'down'}`}>
      <Icono size={20} aria-hidden="true" />
      {Math.abs(pct)}%
      <span className="sr-only">{up ? 'más' : 'menos'} que el periodo anterior</span>
    </span>
  )
}
