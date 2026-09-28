import { useEffect, useState } from 'react'
import { getMisPagos, type OrdenPagoDTO } from '../api'

function formatMoney(n: number): string {
  return n.toFixed(2)
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function MisPagosPage() {
  const [pagos, setPagos] = useState<OrdenPagoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMisPagos()
      .then(setPagos)
      .catch(() => setError('No se pudo cargar tu historial de pagos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <h2>Mis pagos</h2>

      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        {loading ? (
          <p>Cargando…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
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
                  <td colSpan={9} className="empty-table">
                    Todavía no tienes pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
