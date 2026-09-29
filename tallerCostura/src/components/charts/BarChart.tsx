interface BarDatum {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarDatum[]
  formatValue?: (value: number) => string
  emptyMessage?: string
}

export function BarChart({
  data,
  formatValue = (value) => String(value),
  emptyMessage = 'Sin datos todavía.',
}: BarChartProps) {
  if (data.length === 0) {
    return <p className="empty">{emptyMessage}</p>
  }

  const max = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label" title={item.label}>
            {item.label}
          </span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${item.value > 0 ? Math.max((item.value / max) * 100, 2) : 0}%`,
                backgroundColor: item.color ?? 'var(--chart-series-1)',
              }}
            />
          </div>
          <span className="bar-value">{formatValue(item.value)}</span>
        </div>
      ))}
    </div>
  )
}
