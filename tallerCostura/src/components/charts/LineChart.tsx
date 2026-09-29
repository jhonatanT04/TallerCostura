import { useRef, useState, type PointerEvent } from 'react'

interface LinePoint {
  label: string
  value: number
}

interface LineChartProps {
  data: LinePoint[]
  formatValue?: (value: number) => string
  color?: string
}

const WIDTH = 640
const HEIGHT = 220
const PAD_LEFT = 36
const PAD_RIGHT = 12
const PAD_TOP = 16
const PAD_BOTTOM = 28
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM

export function LineChart({
  data,
  formatValue = (value) => String(value),
  color = 'var(--chart-series-1)',
}: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (data.length === 0) {
    return <p className="empty">Sin datos todavía.</p>
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const stepX = data.length > 1 ? PLOT_WIDTH / (data.length - 1) : 0

  const points = data.map((d, i) => ({
    x: PAD_LEFT + stepX * i,
    y: PAD_TOP + PLOT_HEIGHT - (d.value / maxValue) * PLOT_HEIGHT,
    ...d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const baseline = PAD_TOP + PLOT_HEIGHT
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`

  const yTicks = [0, 0.5, 1].map((t) => Math.round(maxValue * t))

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg || stepX === 0) return
    const rect = svg.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH
    const index = Math.round((x - PAD_LEFT) / stepX)
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1))
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="line-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="line-chart-svg"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {yTicks.map((tick) => {
          const y = PAD_TOP + PLOT_HEIGHT - (tick / maxValue) * PLOT_HEIGHT
          return (
            <g key={tick}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} className="chart-grid" />
              <text x={PAD_LEFT - 8} y={y} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">
                {tick}
              </text>
            </g>
          )
        })}

        <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={baseline} y2={baseline} className="chart-baseline" />

        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points
          .filter((_, i) => i === 0 || i === points.length - 1)
          .map((p, i) => (
            <text
              key={p.label}
              x={p.x}
              y={HEIGHT - 8}
              className="chart-axis-label"
              textAnchor={i === 0 ? 'start' : 'end'}
            >
              {p.label}
            </text>
          ))}

        {hovered && (
          <g>
            <line x1={hovered.x} x2={hovered.x} y1={PAD_TOP} y2={baseline} className="chart-crosshair" />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={color} stroke="var(--chart-surface)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
        >
          <strong>{formatValue(hovered.value)}</strong>
          <span>{hovered.label}</span>
        </div>
      )}
    </div>
  )
}
