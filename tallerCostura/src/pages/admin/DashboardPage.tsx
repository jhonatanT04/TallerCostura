import { useEffect, useMemo, useState } from 'react'
import { getEmpleados, getOrdenes, getPagos, getTodosLosRegistros } from '../../api'
import type { Empleado, OrdenDTO, OrdenPagoDTO, RegistroDTO } from '../../api/types'
import { BarChart } from '../../components/charts/BarChart'
import { LineChart } from '../../components/charts/LineChart'

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function last30DayKeys(): string[] {
  const today = new Date()
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(dateKey(d))
  }
  return days
}

export function DashboardPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [registros, setRegistros] = useState<RegistroDTO[]>([])
  const [ordenes, setOrdenes] = useState<OrdenDTO[]>([])
  const [pagos, setPagos] = useState<OrdenPagoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getEmpleados(), getTodosLosRegistros(), getOrdenes(), getPagos()])
      .then(([empleadosData, registrosData, ordenesData, pagosData]) => {
        setEmpleados(empleadosData)
        setRegistros(registrosData)
        setOrdenes(ordenesData)
        setPagos(pagosData)
      })
      .catch(() => setError('No se pudo cargar la información del panel.'))
      .finally(() => setLoading(false))
  }, [])

  const blusasPorDia = useMemo(() => {
    const days = last30DayKeys()
    const totals = new Map<string, number>(days.map((day) => [day, 0]))
    for (const registro of registros) {
      const key = registro.fechaRegistro.slice(0, 10)
      if (totals.has(key)) {
        totals.set(key, (totals.get(key) ?? 0) + registro.cantidad)
      }
    }
    return days.map((day) => ({ label: day.slice(5).split('-').reverse().join('/'), value: totals.get(day) ?? 0 }))
  }, [registros])

  const empleadosPorEstado = useMemo(
    () => [
      {
        label: 'Activos',
        value: empleados.filter((e) => e.activo).length,
        color: 'var(--chart-series-1)',
      },
      {
        label: 'Pendientes',
        value: empleados.filter((e) => !e.activo).length,
        color: 'var(--chart-series-2)',
      },
    ],
    [empleados],
  )

  const topClientes = useMemo(() => {
    const totals = new Map<number, { nombre: string; total: number }>()
    for (const orden of ordenes) {
      const prev = totals.get(orden.cliente.id)
      totals.set(orden.cliente.id, {
        nombre: orden.cliente.nombre,
        total: (prev?.total ?? 0) + orden.total,
      })
    }
    const sorted = [...totals.values()].sort((a, b) => b.total - a.total)
    const items = sorted.slice(0, 5).map((c) => ({ label: c.nombre, value: c.total }))
    const restoTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0)
    if (restoTotal > 0) items.push({ label: 'Otros', value: restoTotal })
    return items
  }, [ordenes])

  const pagosPorSemana = useMemo(() => {
    const totals = new Map<string, number>()
    for (const pago of pagos) {
      totals.set(pago.semanaInicio, (totals.get(pago.semanaInicio) ?? 0) + pago.montoTotal)
    }
    return [...totals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([label, value]) => ({ label, value }))
  }, [pagos])

  if (loading) {
    return (
      <div className="page dashboard-page">
        <h1>Panel de administración</h1>
        <p>Cargando…</p>
      </div>
    )
  }

  return (
    <div className="page dashboard-page">
      <h1>Panel de administración</h1>
      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <section className="panel chart-card chart-card-wide">
          <h3>Blusas producidas (últimos 30 días)</h3>
          <LineChart data={blusasPorDia} />
        </section>

        <section className="panel chart-card">
          <h3>Empleados</h3>
          <BarChart data={empleadosPorEstado} />
        </section>

        <section className="panel chart-card">
          <h3>Top clientes por total facturado</h3>
          <BarChart data={topClientes} formatValue={formatMoney} emptyMessage="Todavía no hay órdenes." />
        </section>

        <section className="panel chart-card chart-card-wide">
          <h3>Pagos por semana</h3>
          <BarChart data={pagosPorSemana} formatValue={formatMoney} emptyMessage="Todavía no hay pagos calculados." />
        </section>
      </div>
    </div>
  )
}
