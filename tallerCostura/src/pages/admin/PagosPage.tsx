import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react'
import {
  calcularPago,
  getEmpleados,
  getPagos,
  getPagosDeEmpleado,
  mensajeDeError,
  previsualizarPago,
  type Empleado,
  type OrdenPagoDTO,
} from '../../api'
import { Modal } from '../../components/Modal'
import { ResumenSemanaPago } from '../../components/ResumenSemanaPago'
import { SelectorSemana } from '../../components/SelectorSemana'
import { Persona } from '../../components/ui/Avatar'
import { EstadoPagoBadge } from '../../components/EstadoPagoBadge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { IconButton } from '../../components/ui/IconButton'
import { PageHeader } from '../../components/ui/PageHeader'
import { Popover } from '../../components/ui/Popover'
import { RowCard } from '../../components/ui/RowCard'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { addDays, formatRangoFechas, parseISODate } from '../../lib/fechas'
import { formatMoney } from '../../lib/formato'

function rangoSemana(lunes: string): string {
  return formatRangoFechas(lunes, addDays(parseISODate(lunes), 6))
}


export function PagosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loadingEmpleados, setLoadingEmpleados] = useState(true)
  const [calcularEmpleadoId, setCalcularEmpleadoId] = useState('')
  const [semanaInicio, setSemanaInicio] = useState('')
  const [calculando, setCalculando] = useState(false)
  const [calcularError, setCalcularError] = useState<string | null>(null)
  const [pagoResumen, setPagoResumen] = useState<OrdenPagoDTO | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmarError, setConfirmarError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(null)
  const [pagos, setPagos] = useState<OrdenPagoDTO[]>([])
  const [loadingPagos, setLoadingPagos] = useState(true)
  const [pagosError, setPagosError] = useState<string | null>(null)

  useEffect(() => {
    getEmpleados()
      .then((data) => setEmpleados(data.filter((e) => e.activo)))
      .finally(() => setLoadingEmpleados(false))
  }, [])

  const loadPagos = useCallback(async (empleadoId: number | null) => {
    setLoadingPagos(true)
    setPagosError(null)
    try {
      setPagos(empleadoId ? await getPagosDeEmpleado(empleadoId) : await getPagos())
    } catch {
      setPagosError('No se pudo cargar el historial de pagos.')
    } finally {
      setLoadingPagos(false)
    }
  }, [])

  useEffect(() => {
    loadPagos(selectedEmpleadoId)
  }, [selectedEmpleadoId, loadPagos])

  const empleadoSeleccionado = empleados.find((e) => String(e.id) === calcularEmpleadoId)
  const sinTarifa = empleadoSeleccionado !== undefined && empleadoSeleccionado.pagoPorBlusa <= 0

  async function handleCalcular(event: FormEvent) {
    event.preventDefault()
    setCalcularError(null)
    setMensaje(null)

    if (!calcularEmpleadoId || !semanaInicio) {
      setCalcularError('Selecciona un empleado y la semana de pago.')
      return
    }

    setCalculando(true)
    try {
      setConfirmarError(null)
      setPagoResumen(await previsualizarPago(Number(calcularEmpleadoId), semanaInicio))
    } catch (err) {
      setCalcularError(mensajeDeError(err, 'No se pudo calcular el resumen.'))
    } finally {
      setCalculando(false)
    }
  }

  async function handleConfirmar() {
    if (!pagoResumen) return
    if (pagoResumen.totalBlusas > 0 && pagoResumen.empleado.pagoPorBlusa <= 0) {
      setConfirmarError('Este empleado tiene el pago por blusa en $0.00. Asígnale una tarifa antes de registrar el pago.')
      return
    }
    setConfirmarError(null)
    setGuardando(true)
    try {
      await calcularPago({ empleadoId: pagoResumen.empleado.id, semanaInicio: pagoResumen.semanaInicio })
      setPagoResumen(null)
      setSemanaInicio('')
      setMensaje('Pago registrado.')
      await loadPagos(selectedEmpleadoId)
    } catch (err) {
      setConfirmarError(mensajeDeError(err, 'No se pudo guardar el pago.'))
    } finally {
      setGuardando(false)
    }
  }

  function cerrarResumen() {
    if (guardando) return
    setPagoResumen(null)
    setConfirmarError(null)
  }

  const esPrevisualizacion = pagoResumen?.id === null

  return (
    <div className="page pagos-page">
      <PageHeader title="Pagos" description="Calcula y revisa los pagos semanales de los empleados." />

      <Card title="Calcular pago semanal">
        {loadingEmpleados ? (
          <SkeletonRows rows={1} label="Cargando empleados" />
        ) : (
          <form className="calcular-pago" onSubmit={handleCalcular}>
            <div className="toolbar">
              <label>
                Empleado
                <select value={calcularEmpleadoId} onChange={(e) => setCalcularEmpleadoId(e.target.value)} required>
                  <option value="" disabled>
                    Selecciona un empleado
                  </option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombreCompleto}
                    </option>
                  ))}
                </select>
              </label>

              <div className="popover-anchor" ref={selectorRef}>
                <Button
                  icon={CalendarBlankIcon}
                  className="selector-semana-boton"
                  aria-haspopup="dialog"
                  aria-expanded={selectorAbierto}
                  onClick={() => setSelectorAbierto((abierto) => !abierto)}
                >
                  {semanaInicio ? rangoSemana(semanaInicio) : 'Elegir semana'}
                </Button>
                {selectorAbierto && (
                  <Popover label="Elegir semana de pago" anchorRef={selectorRef} onClose={() => setSelectorAbierto(false)}>
                    <SelectorSemana
                      value={semanaInicio}
                      onChange={(lunes) => {
                        setSemanaInicio(lunes)
                        setSelectorAbierto(false)
                      }}
                    />
                  </Popover>
                )}
              </div>

              <Button type="submit" variant="primary" loading={calculando}>
                {calculando ? 'Calculando…' : 'Ver resumen'}
              </Button>
            </div>

            {sinTarifa && (
              <p className="aviso-previsualizacion">
                {empleadoSeleccionado.nombreCompleto} tiene la tarifa por blusa en $0.00. Si confeccionó blusas esta
                semana no se podrá calcular el pago; asígnale una tarifa en Empleados → Editar tarifa.
              </p>
            )}
            {calcularError && <p className="error">{calcularError}</p>}
            {mensaje && <p className="info">{mensaje}</p>}
          </form>
        )}
      </Card>

      <Card
        title="Historial de pagos"
        className="pagos-historial"
        actions={
          !loadingEmpleados && (
            <label className="inline-select">
              Empleado
              <select
                value={selectedEmpleadoId ?? ''}
                onChange={(e) => setSelectedEmpleadoId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Todos</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombreCompleto}
                  </option>
                ))}
              </select>
            </label>
          )
        }
      >
        {pagosError && <p className="error">{pagosError}</p>}

        {loadingPagos ? (
          <SkeletonRows label="Cargando pagos" />
        ) : (
          <>
            <div className="table-wrap only-desktop">
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Semana</th>
                    <th className="num">Blusas</th>
                    <th className="num">Mullos</th>
                    <th className="num">Ataches</th>
                    <th className="num">Total</th>
                    <th>Estado</th>
                    <th className="actions">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td>
                        <Persona nombre={pago.empleado.nombreCompleto} />
                      </td>
                      <td>{rangoSemana(pago.semanaInicio)}</td>
                      <td className="num">{pago.totalBlusas}</td>
                      <td className="num">{pago.totalConMullos}</td>
                      <td className="num">{pago.totalConAtaches}</td>
                      <td className="num strong">{formatMoney(pago.montoTotal)}</td>
                      <td>
                        <EstadoPagoBadge pago={pago} />
                      </td>
                      <td className="actions">
                        <Button variant="tertiary" size="sm" onClick={() => setPagoResumen(pago)}>
                          Ver resumen
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {pagos.length === 0 && (
                    <tr>
                      <td colSpan={8} className="empty-table">
                        No hay pagos calculados todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <ul className="row-cards only-mobile">
              {pagos.map((pago) => (
                <RowCard
                  key={pago.id}
                  title={<Persona nombre={pago.empleado.nombreCompleto} />}
                  aside={formatMoney(pago.montoTotal)}
                  meta={rangoSemana(pago.semanaInicio)}
                  footer={<EstadoPagoBadge pago={pago} />}
                >
                  <Button variant="secondary" size="sm" onClick={() => setPagoResumen(pago)}>
                    Ver resumen
                  </Button>
                </RowCard>
              ))}
              {pagos.length === 0 && <li className="row-cards-empty">No hay pagos calculados todavía.</li>}
            </ul>
          </>
        )}
      </Card>

      {pagoResumen && (
        <Modal onClose={cerrarResumen} label="Resumen de la semana" size="lg">
          <div className="resumen-modal">
            <div className="resumen-modal-header">
              <h3>Resumen de la semana</h3>
              <IconButton icon={XIcon} label="Cerrar" onClick={cerrarResumen} disabled={guardando} />
            </div>
            {esPrevisualizacion && <p className="aviso-previsualizacion">Este pago todavía no está guardado.</p>}
            <ResumenSemanaPago key={`${pagoResumen.empleado.id}-${pagoResumen.semanaInicio}`} pago={pagoResumen} />
            {esPrevisualizacion && (
              <>
                {confirmarError && <p className="error">{confirmarError}</p>}
                <div className="modal-footer">
                  <Button onClick={cerrarResumen} disabled={guardando}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={handleConfirmar} loading={guardando}>
                    {guardando ? 'Guardando…' : 'Confirmar pago'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
