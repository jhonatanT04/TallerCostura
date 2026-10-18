import { useCallback, useEffect, useState, type FormEvent } from 'react'
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
import { formatRangoSemana, parseISODate } from '../../lib/fechas'

function formatMoney(n: number): string {
  return n.toFixed(2)
}

function formatFecha(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—'
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
      <h2>Pagos</h2>

      <section className="panel">
        <h3>Calcular pago semanal</h3>
        {loadingEmpleados ? (
          <p>Cargando empleados...</p>
        ) : (
          <form className="inline-form calcular-pago-form" onSubmit={handleCalcular}>
            <div className="calcular-pago-campos">
              <label>
                Empleado:
                <select
                  value={calcularEmpleadoId}
                  onChange={(e) => setCalcularEmpleadoId(e.target.value)}
                  required
                >
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
              {sinTarifa && (
                <p className="aviso-previsualizacion">
                  {empleadoSeleccionado.nombreCompleto} tiene la tarifa por blusa en $0.00. Si confeccionó blusas esta
                  semana no se podrá calcular el pago; asígnale una tarifa en Empleados → Editar tarifa.
                </p>
              )}
              <p className={`semana-elegida${semanaInicio ? '' : ' vacia'}`}>
                {semanaInicio
                  ? formatRangoSemana(parseISODate(semanaInicio))
                  : 'Elige un día para seleccionar su semana'}
              </p>
              {calcularError && <p className="error">{calcularError}</p>}
              {mensaje && <p className="info">{mensaje}</p>}
              <button type="submit" className="primary" disabled={calculando}>
                {calculando ? 'Calculando…' : 'Ver resumen'}
              </button>
            </div>
            <div className="campo-semana">
              <span>Semana de pago:</span>
              <SelectorSemana value={semanaInicio} onChange={setSemanaInicio} />
            </div>
          </form>
        )}
      </section>

      <section className="panel">
        <h3>Historial de pagos</h3>

        {loadingEmpleados ? null : (
          <ul className="select-registros">
            <li
              onClick={() => setSelectedEmpleadoId(null)}
              className={`opcion-select${selectedEmpleadoId === null ? ' selected' : ''}`}
            >
              Todos los empleados
            </li>
            {empleados.map((empleado) => (
              <li
                key={empleado.id}
                onClick={() => setSelectedEmpleadoId(empleado.id)}
                className={`opcion-select${selectedEmpleadoId === empleado.id ? ' selected' : ''}`}
              >
                {empleado.nombreCompleto}
              </li>
            ))}
          </ul>
        )}

        <br />

        {pagosError && <p className="error">{pagosError}</p>}

        <div className="table-wrap">
          {loadingPagos ? (
            <p>Cargando pagos...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Semana</th>
                  <th>Blusas</th>
                  <th>Mullos puestos</th>
                  <th>Ataches puestos</th>
                  <th>Monto blusas</th>
                  <th>Monto mullos</th>
                  <th>Monto ataches</th>
                  <th>Total</th>
                  <th>Fecha de pago</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.empleado.nombreCompleto}</td>
                    <td>
                      {pago.semanaInicio} — {pago.semanaFin}
                    </td>
                    <td>{pago.totalBlusas}</td>
                    <td>{pago.totalConMullos}</td>
                    <td>{pago.totalConAtaches}</td>
                    <td>${formatMoney(pago.montoBlusas)}</td>
                    <td>${formatMoney(pago.montoMullos)}</td>
                    <td>${formatMoney(pago.montoAtaches)}</td>
                    <td>${formatMoney(pago.montoTotal)}</td>
                    <td>{formatFecha(pago.fechaPago)}</td>
                    <td>
                      <button type="button" onClick={() => setPagoResumen(pago)}>
                        Ver resumen
                      </button>
                    </td>
                  </tr>
                ))}

                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={11} className="empty-table">
                      No hay pagos calculados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {pagoResumen && (
        <Modal onClose={cerrarResumen}>
          <div className="resumen-modal">
            <div className="panel-header">
              <h3>Resumen de la semana</h3>
              <button type="button" onClick={cerrarResumen} disabled={guardando}>
                Cerrar
              </button>
            </div>
            {esPrevisualizacion && (
              <p className="aviso-previsualizacion">Este pago todavía no está guardado.</p>
            )}
            <ResumenSemanaPago
              key={`${pagoResumen.empleado.id}-${pagoResumen.semanaInicio}`}
              pago={pagoResumen}
            />
            {esPrevisualizacion && (
              <>
                {confirmarError && <p className="error">{confirmarError}</p>}
                <div className="confirm-actions">
                  <button type="button" onClick={cerrarResumen} disabled={guardando}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={handleConfirmar}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando…' : 'Confirmar pago'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
