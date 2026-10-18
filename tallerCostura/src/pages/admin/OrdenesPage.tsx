import { Fragment, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getClientes, getOrdenes, getOrdenesDeCliente, type Cliente, type OrdenDTO } from '../../api'
import { FormNewOrden } from '../../components/FormNewOrden'
import { Modal } from '../../components/Modal'
import { CaretDownIcon, PlusIcon } from '@phosphor-icons/react'
import { Persona } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { RowCard } from '../../components/ui/RowCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { formatFecha } from '../../lib/fechas'
import { formatMoney } from '../../lib/formato'

function DetalleOrden({ orden }: { orden: OrdenDTO }) {
  return (
    <table className="table table-compact orden-detalle-tabla">
      <thead>
        <tr>
          <th>Color</th>
          <th className="num">Cantidad</th>
          <th className="num">Precio unitario</th>
          <th className="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {orden.items.map((item) => (
          <tr key={item.id}>
            <td>{item.color}</td>
            <td className="num">{item.cantidad}</td>
            <td className="num">{formatMoney(item.precioUnitario)}</td>
            <td className="num">{formatMoney(item.subtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function OrdenesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const clienteIdParam = searchParams.get('clienteId')
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(
    clienteIdParam ? Number(clienteIdParam) : null,
  )

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)

  const [ordenes, setOrdenes] = useState<OrdenDTO[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(true)
  const [ordenesError, setOrdenesError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .finally(() => setLoadingClientes(false))
  }, [])

  const loadOrdenes = useCallback(async (clienteId: number | null) => {
    setLoadingOrdenes(true)
    setOrdenesError(null)
    try {
      setOrdenes(clienteId ? await getOrdenesDeCliente(clienteId) : await getOrdenes())
    } catch {
      setOrdenesError('No se pudo cargar la lista de órdenes.')
    } finally {
      setLoadingOrdenes(false)
    }
  }, [])

  useEffect(() => {
    loadOrdenes(selectedClienteId)
  }, [selectedClienteId, loadOrdenes])

  function selectCliente(clienteId: number | null) {
    setSelectedClienteId(clienteId)
    setSearchParams(clienteId ? { clienteId: String(clienteId) } : {})
  }

  function toggleExpand(id: number) {
    setExpandedId((current) => (current === id ? null : id))
  }

  return (
    <div className="page">
      <PageHeader
        title="Órdenes"
        description="Órdenes de clientes agrupadas por color"
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={() => setShowCreateForm(true)}>
            Crear orden
          </Button>
        }
      />

      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <FormNewOrden
            clientes={clientes}
            defaultClienteId={selectedClienteId}
            onClose={() => setShowCreateForm(false)}
            onCreate={() => loadOrdenes(selectedClienteId)}
          />
        </Modal>
      )}

      <div className="toolbar ordenes-filtros">
        <label>
          Cliente
          <select
            value={selectedClienteId ?? ''}
            disabled={loadingClientes}
            onChange={(e) => selectCliente(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todos los clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ordenesError && <p className="error">{ordenesError}</p>}

      {loadingOrdenes ? (
        <SkeletonRows label="Cargando órdenes" />
      ) : (
        <>
          <div className="table-wrap only-desktop">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th className="num">Total blusas</th>
                  <th className="num">Total</th>
                  <th className="actions">
                    <span className="sr-only">Detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((orden) => {
                  const abierta = expandedId === orden.id
                  return (
                    <Fragment key={orden.id}>
                      <tr className="orden-row" onClick={() => toggleExpand(orden.id)}>
                        <td>
                          <Persona nombre={orden.cliente.nombre} />
                        </td>
                        <td>{formatFecha(orden.fechaCreacion)}</td>
                        <td className="num">{orden.totalBlusas}</td>
                        <td className="num strong">{formatMoney(orden.total)}</td>
                        <td className="actions">
                          <button
                            type="button"
                            className={`icon-btn orden-toggle${abierta ? ' abierta' : ''}`}
                            aria-expanded={abierta}
                            aria-label={abierta ? 'Ocultar detalle' : 'Ver detalle'}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleExpand(orden.id)
                            }}
                          >
                            <CaretDownIcon size={20} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                      {abierta && (
                        <tr className="orden-detail">
                          <td colSpan={5}>
                            <DetalleOrden orden={orden} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}

                {ordenes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-table">
                      No hay órdenes para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <ul className="row-cards only-mobile">
            {ordenes.map((orden) => {
              const abierta = expandedId === orden.id
              return (
                <RowCard
                  key={orden.id}
                  title={orden.cliente.nombre}
                  aside={formatMoney(orden.total)}
                  meta={`${formatFecha(orden.fechaCreacion)} · ${orden.totalBlusas} blusas`}
                  footer={
                    <button
                      type="button"
                      className={`icon-btn orden-toggle${abierta ? ' abierta' : ''}`}
                      aria-expanded={abierta}
                      aria-label={abierta ? 'Ocultar detalle' : 'Ver detalle'}
                      onClick={() => toggleExpand(orden.id)}
                    >
                      <CaretDownIcon size={20} aria-hidden="true" />
                    </button>
                  }
                >
                  {abierta && (
                    <ul className="orden-items-lista">
                      {orden.items.map((item) => (
                        <li key={item.id}>
                          <span>
                            {item.color} · {item.cantidad} × {formatMoney(item.precioUnitario)}
                          </span>
                          <strong>{formatMoney(item.subtotal)}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </RowCard>
              )
            })}
            {ordenes.length === 0 && <li className="row-cards-empty">No hay órdenes para mostrar.</li>}
          </ul>
        </>
      )}
    </div>
  )
}
