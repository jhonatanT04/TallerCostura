import { useState, type FormEvent } from 'react'
import { CurrencyDollarIcon } from '@phosphor-icons/react'
import { actualizarPagoEmpleado, mensajeDeError } from '../api'
import type { Empleado } from '../api/types'
import { formatMoney } from '../lib/formato'
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'

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
    <ModalLayout
      icon={CurrencyDollarIcon}
      title="Editar tarifa"
      description={empleado.nombreCompleto}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <p className="tarifa-actual">
        Tarifa actual: <strong>{formatMoney(empleado.pagoPorBlusa)}</strong> por blusa
      </p>
      <label>
        Nueva tarifa por blusa
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={pagoPorBlusa}
          onChange={(e) => setPagoPorBlusa(e.target.value)}
          aria-invalid={error ? true : undefined}
          autoFocus
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
    </ModalLayout>
  )
}
