import { useState, type FormEvent } from 'react'
import { actualizarPagoEmpleado } from '../api'
import type { Empleado } from '../api/types'

interface FormEditarPagoProps {
  empleado: Empleado
  onClose: () => void
  onUpdate: () => void
}

export function FormEditarPago({ empleado, onClose, onUpdate }: FormEditarPagoProps) {
  const [pagoPorBlusa, setPagoPorBlusa] = useState(String(empleado.pagoPorBlusa))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await actualizarPagoEmpleado(empleado.id, Number(pagoPorBlusa) || 0)
      onUpdate()
      onClose()
    } catch {
      setError('No se pudo actualizar la tarifa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="form-new-trabajador">
      <h3>Tarifa de {empleado.nombreCompleto}</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <section>
          <label>
            Pago por blusa:
            <input
              type="number"
              min="0"
              step="0.01"
              value={pagoPorBlusa}
              onChange={(e) => setPagoPorBlusa(e.target.value)}
              autoFocus
              required
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </section>
      </form>
      <button type="button" onClick={onClose}>
        Cancelar
      </button>
    </div>
  )
}
