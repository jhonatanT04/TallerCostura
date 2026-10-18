import { useEffect, useId, useRef, useState, type PointerEvent } from 'react'

interface LinePoint {
  label: string
  value: number
}

interface LineChartProps {
  data: LinePoint[]
  formatValue?: (value: number) => string
  color?: string
  height?: number
  // Etiqueta accesible del gráfico completo.
  label?: string
}

const PAD_LEFT = 40
const PAD_RIGHT = 8
const PAD_TOP = 12
const PAD_BOTTOM = 28

// Paso "redondo" (1, 2 o 5 × 10^n, mínimo 1) para unos 4 intervalos: 0 / 10 / 20 / 30.
function escalaY(max: number): { tope: number; ticks: number[] } {
  const crudo = Math.max(max, 1) / 4
  const magnitud = 10 ** Math.floor(Math.log10(crudo))
  const normal = crudo / magnitud
  const paso = Math.max(1, (normal <= 1 ? 1 : normal <= 2 ? 2 : normal <= 5 ? 5 : 10) * magnitud)
  const tope = Math.max(paso, Math.ceil(Math.max(max, 1) / paso) * paso)
  return { tope, ticks: Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso) }
}

export function LineChart({
  data,
  formatValue = (value) => String(value),
  color = 'var(--chart-series-1)',
  height = 240,
  label,
}: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [width, setWidth] = useState(640)
  const containerRef = useRef<HTMLDivElement>(null)
  const gradientId = `area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  // Se dibuja al ancho real del contenedor para que el texto de los ejes no se escale.
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width)
      if (next > 0) setWidth(next)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (data.length === 0) {
    return <p className="empty">Sin datos todavía.</p>
  }

  const plotWidth = Math.max(width - PAD_LEFT - PAD_RIGHT, 1)
  const plotHeight = height - PAD_TOP - PAD_BOTTOM
  const { tope: maxValue, ticks: yTicks } = escalaY(Math.max(...data.map((d) => d.value)))
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0
  const baseline = PAD_TOP + plotHeight

  const points = data.map((d, i) => ({
    x: PAD_LEFT + stepX * i,
    y: PAD_TOP + plotHeight - (d.value / maxValue) * plotHeight,
    ...d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`

  // Pocas etiquetas en X según el ancho disponible (mínimo inicio y fin).
  const xLabelCount = Math.max(2, Math.min(data.length, Math.floor(plotWidth / 90)))
  const xLabelIndexes = [
    ...new Set(Array.from({ length: xLabelCount }, (_, i) => Math.round((i * (data.length - 1)) / (xLabelCount - 1)))),
  ]

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (stepX === 0) {
      setHoverIndex(0)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const index = Math.round((x - PAD_LEFT) / stepX)
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1))
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="line-chart" ref={containerRef}>
      <svg
        width={width}
        height={height}
        className="line-chart-svg"
        role="img"
        aria-label={label}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.16} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = PAD_TOP + plotHeight - (tick / maxValue) * plotHeight
          return (
            <g key={tick}>
              {tick !== 0 && <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={y} y2={y} className="chart-grid" />}
              <text x={PAD_LEFT - 12} y={y} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">
                {tick}
              </text>
            </g>
          )
        })}

        <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={baseline} y2={baseline} className="chart-baseline" />

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {xLabelIndexes.map((index, i) => {
          const p = points[index]
          const anchor = i === 0 ? 'start' : i === xLabelIndexes.length - 1 ? 'end' : 'middle'
          return (
            <text key={index} x={p.x} y={height - 6} className="chart-axis-label" textAnchor={anchor}>
              {p.label}
            </text>
          )
        })}

        {hovered && (
          <g>
            <line x1={hovered.x} x2={hovered.x} y1={PAD_TOP} y2={baseline} className="chart-crosshair" />
            <circle cx={hovered.x} cy={hovered.y} r={5} fill={color} stroke="var(--chart-surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(Math.max(hovered.x, 60), width - 60),
            top: hovered.y,
          }}
        >
          <strong>{formatValue(hovered.value)}</strong>
          <span>{hovered.label}</span>
        </div>
      )}
    </div>
  )
}
