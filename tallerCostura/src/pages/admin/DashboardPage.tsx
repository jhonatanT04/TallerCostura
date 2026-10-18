import { useEffect, useState } from 'react'
import { getEmpleados, getOrdenes, getPagos, getRegistrosDate } from '../../api'
import type { Empleado, OrdenDTO, OrdenPagoDTO, RegistroDTO } from '../../api/types'
import { BarChart } from '../../components/charts/BarChart'
import { LineChart } from '../../components/charts/LineChart'
import { Persona } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { Metric } from '../../components/ui/Metric'
import { PageHeader } from '../../components/ui/PageHeader'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Skeleton, SkeletonRows } from '../../components/ui/Skeleton'
import { addDays, formatDiaMes, toISODate } from '../../lib/fechas'
import { formatMoney, formatNumero } from '../../lib/formato'

type Periodo = '7d' | '30d' | '90d'

const PERIODOS: { value: Periodo; label: string; dias: number }[] = [
  { value: '7d', label: '7 días', dias: 7 },
  { value: '30d', label: '30 días', dias: 30 },
  { value: '90d', label: '3 meses', dias: 90 },
]

interface RegistrosPeriodo {
  periodo: Periodo
  dias: Date[]
  actual: RegistroDTO[]
  anterior: RegistroDTO[]
}

function rangoDe(periodo: Periodo) {
  const dias = PERIODOS.find((p) => p.value === periodo)?.dias ?? 30
  const hoy = new Date()
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const inicio = addDays(hoyLocal, -(dias - 1))
  const anteriorFin = addDays(inicio, -1)
  const anteriorInicio = addDays(anteriorFin, -(dias - 1))
  return {
    dias: Array.from({ length: dias }, (_, i) => addDays(inicio, i)),
    actual: [toISODate(inicio), toISODate(hoyLocal)] as const,
    anterior: [toISODate(anteriorInicio), toISODate(anteriorFin)] as const,
  }
}

function sumar(registros: RegistroDTO[], campo: 'cantidadConfeccion' | 'cantidadMullos' | 'cantidadAtaches') {
  return registros.reduce((total, r) => total + r[campo], 0)
}

export function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('30d')

  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [ordenes, setOrdenes] = useState<OrdenDTO[]>([])
  const [pagos, setPagos] = useState<OrdenPagoDTO[]>([])
  const [loadingGeneral, setLoadingGeneral] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [registros, setRegistros] = useState<RegistrosPeriodo | null>(null)
  const [registrosError, setRegistrosError] = useState<Periodo | null>(null)

  useEffect(() => {
    Promise.all([getEmpleados(), getOrdenes(), getPagos()])
      .then(([empleadosData, ordenesData, pagosData]) => {
        setEmpleados(empleadosData)
        setOrdenes(ordenesData)
        setPagos(pagosData)
      })
      .catch(() => setError('No se pudo cargar la información del panel.'))
      .finally(() => setLoadingGeneral(false))
  }, [])

  useEffect(() => {
    let cancelado = false
    const rango = rangoDe(periodo)
    Promise.all([getRegistrosDate(...rango.actual), getRegistrosDate(...rango.anterior)])
      .then(([actual, anterior]) => {
        if (!cancelado) setRegistros({ periodo, dias: rango.dias, actual, anterior })
      })
      .catch(() => {
        if (!cancelado) setRegistrosError(periodo)
      })
    return () => {
      cancelado = true
    }
  }, [periodo])

  // Los datos guardados solo valen si son del periodo elegido; si no, todavía está cargando.
  const datos = registros?.periodo === periodo ? registros : null
  const fallo = registrosError === periodo && !datos

  const blusasPorDia = (() => {
    if (!datos) return []
    const totales = new Map(datos.dias.map((dia) => [toISODate(dia), 0]))
    for (const registro of datos.actual) {
      // fechaRegistro es un instante UTC; se agrupa por el día local.
      const key = toISODate(new Date(registro.fechaRegistro))
      if (totales.has(key)) totales.set(key, (totales.get(key) ?? 0) + registro.cantidadConfeccion)
    }
    return datos.dias.map((dia) => ({ label: formatDiaMes(dia), value: totales.get(toISODate(dia)) ?? 0 }))
  })()

  const topEmpleadas = (() => {
    if (!datos) return []
    const totales = new Map<number, { nombre: string; blusas: number }>()
    for (const r of datos.actual) {
      const prev = totales.get(r.empleado.id)
      totales.set(r.empleado.id, {
        nombre: r.empleado.nombreCompleto,
        blusas: (prev?.blusas ?? 0) + r.cantidadConfeccion,
      })
    }
    return [...totales.entries()]
      .map(([id, t]) => ({ id, ...t }))
      .filter((t) => t.blusas > 0)
      .sort((a, b) => b.blusas - a.blusas)
      .slice(0, 5)
  })()

  const topClientes = (() => {
    const totals = new Map<number, { nombre: string; total: number }>()
    for (const orden of ordenes) {
      const prev = totals.get(orden.cliente.id)
      totals.set(orden.cliente.id, { nombre: orden.cliente.nombre, total: (prev?.total ?? 0) + orden.total })
    }
    const sorted = [...totals.values()].sort((a, b) => b.total - a.total)
    const items = sorted.slice(0, 5).map((c) => ({ label: c.nombre, value: c.total }))
    const restoTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0)
    if (restoTotal > 0) items.push({ label: 'Otros', value: restoTotal })
    return items
  })()

  const pagosPorSemana = (() => {
    const totals = new Map<string, number>()
    for (const pago of pagos) {
      totals.set(pago.semanaInicio, (totals.get(pago.semanaInicio) ?? 0) + pago.montoTotal)
    }
    return [...totals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([semana, value]) => ({ label: `Sem. ${formatDiaMes(semana)}`, value }))
  })()

  const empleadasActivas = empleados.filter((e) => e.activo).length
  const sinRegistros = datos !== null && datos.actual.length === 0

  return (
    <div className="page dashboard-page">
      <PageHeader title="Inicio" description="Resumen de producción, empleados, clientes y pagos." />

      <div className="dashboard-toolbar">
        <SegmentedControl label="Periodo" options={PERIODOS} value={periodo} onChange={setPeriodo} />
      </div>

      {error && <p className="error">{error}</p>}

      <section className="dash-main" aria-label="Producción del periodo">
        <div className="dash-primary">
          {datos ? (
            <Metric
              size="lg"
              label="Blusas confeccionadas"
              value={sumar(datos.actual, 'cantidadConfeccion')}
              previous={sumar(datos.anterior, 'cantidadConfeccion')}
            />
          ) : (
            <Skeleton width="220px" height="72px" />
          )}

          <div className="dash-chart">
            {fallo ? (
              <p className="error">No se pudieron cargar los registros del periodo.</p>
            ) : !datos ? (
              <Skeleton height="240px" />
            ) : sinRegistros ? (
              <p className="dash-empty">Todavía no hay registros en este periodo.</p>
            ) : (
              <LineChart data={blusasPorDia} label="Blusas confeccionadas por día" />
            )}
          </div>
        </div>

        <div className="dash-side">
          {datos ? (
            <>
              <Metric
                label="Mullos puestos"
                value={sumar(datos.actual, 'cantidadMullos')}
                previous={sumar(datos.anterior, 'cantidadMullos')}
              />
              <Metric
                label="Ataches puestos"
                value={sumar(datos.actual, 'cantidadAtaches')}
                previous={sumar(datos.anterior, 'cantidadAtaches')}
              />
            </>
          ) : (
            <>
              <Skeleton width="160px" height="68px" />
              <Skeleton width="160px" height="68px" />
            </>
          )}
          {loadingGeneral ? (
            <Skeleton width="160px" height="68px" />
          ) : (
            <Metric label="Empleadas activas" value={empleadasActivas} />
          )}
        </div>
      </section>

      <div className="dash-bottom">
        <div className="dash-bottom-main">
          <Card title="Pagos por semana">
            {loadingGeneral ? (
              <SkeletonRows rows={4} label="Cargando pagos" />
            ) : (
              <BarChart data={pagosPorSemana} formatValue={formatMoney} emptyMessage="Todavía no hay pagos calculados." />
            )}
          </Card>
          <Card title="Top clientes por total facturado">
            {loadingGeneral ? (
              <SkeletonRows rows={4} label="Cargando clientes" />
            ) : (
              <BarChart data={topClientes} formatValue={formatMoney} emptyMessage="Todavía no hay órdenes." />
            )}
          </Card>
        </div>

        <Card title="Top empleadas del periodo" className="dash-top-empleadas">
          {!datos ? (
            <SkeletonRows rows={5} label="Cargando empleadas" />
          ) : topEmpleadas.length === 0 ? (
            <p className="empty">Todavía no hay registros en este periodo.</p>
          ) : (
            <ol className="top-list">
              {topEmpleadas.map((empleada) => (
                <li key={empleada.id}>
                  <Persona nombre={empleada.nombre} size="md" />
                  <span className="top-list-value">
                    {formatNumero(empleada.blusas)} {empleada.blusas === 1 ? 'blusa' : 'blusas'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  )
}
