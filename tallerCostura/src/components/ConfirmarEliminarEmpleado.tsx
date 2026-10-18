import { useState } from 'react'
import { TrashIcon } from '@phosphor-icons/react'
import { eliminarEmpleado } from '../api'
import type { Empleado } from '../api/types'
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'

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
    <ModalLayout
      icon={TrashIcon}
      tone="error"
      title={`¿Eliminar a ${empleado.nombreCompleto}?`}
      description="Ya no podrá iniciar sesión y desaparecerá de la lista de empleados. Sus registros de blusas y pagos se conservan. Esta acción no se puede deshacer."
      footer={
        <>
          <Button onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </>
      }
    >
      {error && <p className="error">{error}</p>}
    </ModalLayout>
  )
}
