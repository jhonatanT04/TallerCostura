import { useState } from 'react'
import { eliminarEmpleado } from '../api'
import type { Empleado } from '../api/types'

interface ConfirmarEliminarEmpleadoProps {
  empleado: Empleado
  onClose: () => void
  onDelete: () => void
}

export function ConfirmarEliminarEmpleado({ empleado, onClose, onDelete }: ConfirmarEliminarEmpleadoProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      await eliminarEmpleado(empleado.id)
      onDelete()
      onClose()
    } catch {
      setError('No se pudo eliminar al empleado.')
      setDeleting(false)
    }
  }

  return (
    <div className="form-new-trabajador">
      <h3>¿Eliminar a {empleado.nombreCompleto}?</h3>
      <p>
        Ya no podrá iniciar sesión y desaparecerá de la lista de empleados. Sus registros de blusas
        y pagos se conservan. <strong>Esta acción no se puede deshacer.</strong>
      </p>
      {error && <p className="error">{error}</p>}
      <div className="confirm-actions">
        <button type="button" onClick={onClose} disabled={deleting}>
          Cancelar
        </button>
        <button type="button" className="danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}
