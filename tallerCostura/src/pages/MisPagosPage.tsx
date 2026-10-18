import { useEffect, useState } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { getMisPagos, getMisRegistros, type OrdenPagoDTO, type RegistroDTO } from '../api'
import { EstadoPagoBadge } from '../components/EstadoPagoBadge'
import { Modal } from '../components/Modal'
import { ResumenSemanaPago } from '../components/ResumenSemanaPago'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { PageHeader } from '../components/ui/PageHeader'
import { RowCard } from '../components/ui/RowCard'
import { SkeletonRows } from '../components/ui/Skeleton'
import { formatRangoFechas, toISODate } from '../lib/fechas'
import { formatCantidades, formatMoney } from '../lib/formato'

// La empleada no puede usar /registros/getForDate (solo ADMIN): se filtran sus propios registros
// por la semana del pago, comparando por día local.
async function misRegistrosDeLaSemana(pago: OrdenPagoDTO): Promise<RegistroDTO[]> {
  const registros = await getMisRegistros()
  return registros.filter((r) => {
    const dia = toISODate(new Date(r.fechaRegistro))
    return dia >= pago.semanaInicio && dia <= pago.semanaFin
  })
}

export function MisPagosPage() {
  const [pagos, setPagos] = useState<OrdenPagoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagoResumen, setPagoResumen] = useState<OrdenPagoDTO | null>(null)

  useEffect(() => {
    getMisPagos()
      .then(setPagos)
      .catch(() => setError('No se pudo cargar tu historial de pagos.'))
      .finally(() => setLoading(false))
  }, [])

  const vacio = 'Todavía no tienes pagos registrados.'

  return (
    <div className="page">
      <PageHeader title="Mis pagos" description="Historial de tus pagos semanales." />

      {error && <p className="error">{error}</p>}

      {loading ? (
        <SkeletonRows label="Cargando pagos" />
      ) : (
        <>
          <div className="table-wrap only-desktop">
            <table className="table table-compact">
              <thead>
                <tr>
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
                    <td>{formatRangoFechas(pago.semanaInicio, pago.semanaFin)}</td>
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
                    <td colSpan={7} className="empty-table">
                      {vacio}
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
                title={formatRangoFechas(pago.semanaInicio, pago.semanaFin)}
                aside={formatMoney(pago.montoTotal)}
                meta={formatCantidades({ confeccion: pago.totalBlusas, mullos: pago.totalConMullos, ataches: pago.totalConAtaches })}
                footer={<EstadoPagoBadge pago={pago} />}
              >
                <Button size="sm" onClick={() => setPagoResumen(pago)}>
                  Ver resumen
                </Button>
              </RowCard>
            ))}
            {pagos.length === 0 && <li className="row-cards-empty">{vacio}</li>}
          </ul>
        </>
      )}

      {pagoResumen && (
        <Modal onClose={() => setPagoResumen(null)} label="Resumen de la semana" size="lg">
          <div className="resumen-modal">
            <div className="resumen-modal-header">
              <h3>Resumen de la semana</h3>
              <IconButton icon={XIcon} label="Cerrar" onClick={() => setPagoResumen(null)} />
            </div>
            <ResumenSemanaPago key={pagoResumen.id} pago={pagoResumen} cargarRegistros={misRegistrosDeLaSemana} />
          </div>
        </Modal>
      )}
    </div>
  )
}
