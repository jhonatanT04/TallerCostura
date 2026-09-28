import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  calcularPago,
  getEmpleados,
  getPagos,
  getPagosDeEmpleado,
  type Empleado,
  type OrdenPagoDTO,
} from '../../api'

function formatMoney(n: number): string {
  return n.toFixed(2)
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function PagosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loadingEmpleados, setLoadingEmpleados] = useState(true)
  const [calcularEmpleadoId, setCalcularEmpleadoId] = useState('')
  const [semanaInicio, setSemanaInicio] = useState('')
  const [calculando, setCalculando] = useState(false)
  const [calcularError, setCalcularError] = useState<string | null>(null)

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

  async function handleCalcular(event: FormEvent) {
    event.preventDefault()
    setCalcularError(null)

    if (!calcularEmpleadoId || !semanaInicio) {
      setCalcularError('Selecciona un empleado y la fecha de inicio de semana.')
      return
    }

    setCalculando(true)
    try {
      await calcularPago({ empleadoId: Number(calcularEmpleadoId), semanaInicio })
      setSemanaInicio('')
      await loadPagos(selectedEmpleadoId)
    } catch (err) {
      setCalcularError(
        err instanceof ApiError && err.status === 409
          ? 'Ya se calculó el pago de esa semana para este empleado.'
          : 'No se pudo calcular el pago.',
      )
    } finally {
      setCalculando(false)
    }
  }

  return (
    <div className="page pagos-page">
      <h2>Pagos</h2>

      <section className="panel">
        <h3>Calcular pago semanal</h3>
        {loadingEmpleados ? (
          <p>Cargando empleados...</p>
        ) : (
          <form className="inline-form" onSubmit={handleCalcular}>
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
            <label>
              Inicio de semana (lunes):
              <input
                type="date"
                value={semanaInicio}
                onChange={(e) => setSemanaInicio(e.target.value)}
                required
              />
            </label>
            {calcularError && <p className="error">{calcularError}</p>}
            <button type="submit" className="primary" disabled={calculando}>
              {calculando ? 'Calculando…' : 'Calcular pago'}
            </button>
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
                  <th>Con mullos</th>
                  <th>Con ataches</th>
                  <th>Monto blusas</th>
                  <th>Monto mullos</th>
                  <th>Monto ataches</th>
                  <th>Total</th>
                  <th>Fecha de pago</th>
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
                  </tr>
                ))}

                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={10} className="empty-table">
                      No hay pagos calculados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
