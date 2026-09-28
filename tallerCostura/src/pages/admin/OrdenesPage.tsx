import { Fragment, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getClientes, getOrdenes, getOrdenesDeCliente, type Cliente, type OrdenDTO } from '../../api'
import { FormNewOrden } from '../../components/FormNewOrden'
import { Modal } from '../../components/Modal'

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString()
}

function formatMoney(n: number): string {
  return n.toFixed(2)
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
    <div className="page empleados-page">
      <div className="empleados-header">
        <div>
          <h2>Órdenes</h2>
          <p>Órdenes de clientes agrupadas por color</p>
        </div>

        <button className="primary" onClick={() => setShowCreateForm(true)}>
          Crear orden
        </button>
      </div>

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

      {!loadingClientes && (
        <ul className="select-registros">
          <li
            onClick={() => selectCliente(null)}
            className={`opcion-select${selectedClienteId === null ? ' selected' : ''}`}
          >
            Todos los clientes
          </li>
          {clientes.map((cliente) => (
            <li
              key={cliente.id}
              onClick={() => selectCliente(cliente.id)}
              className={`opcion-select${selectedClienteId === cliente.id ? ' selected' : ''}`}
            >
              {cliente.nombre}
            </li>
          ))}
        </ul>
      )}

      <br />

      {ordenesError && <p className="error">{ordenesError}</p>}

      <div className="table-wrap">
        {loadingOrdenes ? (
          <p>Cargando órdenes...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total blusas</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <Fragment key={orden.id}>
                  <tr onClick={() => toggleExpand(orden.id)} className="orden-row">
                    <td>{orden.cliente.nombre}</td>
                    <td>{formatFecha(orden.fechaCreacion)}</td>
                    <td>{orden.totalBlusas}</td>
                    <td>${formatMoney(orden.total)}</td>
                    <td>{expandedId === orden.id ? '▲' : '▼'}</td>
                  </tr>
                  {expandedId === orden.id && (
                    <tr className="orden-detail">
                      <td colSpan={5}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Color</th>
                              <th>Cantidad</th>
                              <th>Precio unitario</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orden.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.color}</td>
                                <td>{item.cantidad}</td>
                                <td>${formatMoney(item.precioUnitario)}</td>
                                <td>${formatMoney(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {ordenes.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-table">
                    No hay órdenes para mostrar.
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
