import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClientes, type Cliente } from '../../api'
import { FormNewCliente } from '../../components/FormNewCliente'
import { Modal } from '../../components/Modal'
import { PlusIcon } from '@phosphor-icons/react'
import { Persona } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { RowCard } from '../../components/ui/RowCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { SkeletonRows } from '../../components/ui/Skeleton'

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const loadClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setClientes(await getClientes())
    } catch {
      setError('No se pudo cargar la lista de clientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  return (
    <div className="page">
      <PageHeader
        title="Clientes"
        description="Lista de clientes"
        actions={
          <Button variant="primary" icon={PlusIcon} onClick={() => setShowCreateForm(true)}>
            Crear cliente
          </Button>
        }
      />

      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <FormNewCliente onClose={() => setShowCreateForm(false)} onCreate={loadClientes} />
        </Modal>
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <SkeletonRows label="Cargando clientes" />
      ) : (
        <>
          <div className="table-wrap only-desktop">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th className="actions">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <Persona nombre={cliente.nombre} />
                    </td>
                    <td>{cliente.telefono ?? '-'}</td>
                    <td className="actions">
                      <Link className="btn btn-tertiary btn-sm" to={`/admin/ordenes?clienteId=${cliente.id}`}>
                        Ver órdenes
                      </Link>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-table">
                      No hay clientes todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <ul className="row-cards only-mobile">
            {clientes.map((cliente) => (
              <RowCard
                key={cliente.id}
                title={<Persona nombre={cliente.nombre} detalle={cliente.telefono ?? undefined} />}
                aside={
                  <Link className="btn btn-tertiary btn-sm" to={`/admin/ordenes?clienteId=${cliente.id}`}>
                    Ver órdenes
                  </Link>
                }
              />
            ))}
            {clientes.length === 0 && <li className="row-cards-empty">No hay clientes todavía.</li>}
          </ul>
        </>
      )}
    </div>
  )
}
