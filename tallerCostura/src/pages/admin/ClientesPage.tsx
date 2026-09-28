import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClientes, type Cliente } from '../../api'
import { FormNewCliente } from '../../components/FormNewCliente'
import { Modal } from '../../components/Modal'

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
    <div className="page empleados-page">
      <div className="empleados-header">
        <div>
          <h2>Clientes</h2>
          <p>Lista de clientes</p>
        </div>

        <button className="primary" onClick={() => setShowCreateForm(true)}>
          Crear cliente
        </button>
      </div>

      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <FormNewCliente onClose={() => setShowCreateForm(false)} onCreate={loadClientes} />
        </Modal>
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando clientes...</p>
      ) : (
        <ul className="empleados-list">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="empleado-item">
              <span className="empleado-name">
                {cliente.nombre}
                {cliente.telefono && <span className="muted">{cliente.telefono}</span>}
              </span>

              <Link to={`/admin/ordenes?clienteId=${cliente.id}`}>Ver órdenes</Link>
            </li>
          ))}

          {clientes.length === 0 && <p className="empty">No hay clientes todavía.</p>}
        </ul>
      )}
    </div>
  )
}
