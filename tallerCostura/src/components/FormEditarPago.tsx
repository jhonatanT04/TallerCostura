import { useState, type FormEvent } from 'react'
import { actualizarPagoEmpleado, mensajeDeError } from '../api'
import type { Empleado } from '../api/types'

const TARIFA_INVALIDA = 'La tarifa por blusa debe ser mayor a 0'

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
    const tarifa = Number(pagoPorBlusa)
    if (!(tarifa > 0)) {
      setError(TARIFA_INVALIDA)
      return
    }
    setSaving(true)
    try {
      await actualizarPagoEmpleado(empleado.id, tarifa)
      onUpdate()
      onClose()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar la tarifa.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="form-new-trabajador">
      <h3>Tarifa de {empleado.nombreCompleto}</h3>
      <p className="tarifa-actual">
        Tarifa actual: <strong>${empleado.pagoPorBlusa.toFixed(2)}</strong> por blusa
      </p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <section>
          <label>
            Nueva tarifa por blusa:
            <input
              type="number"
              min="0.01"
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
