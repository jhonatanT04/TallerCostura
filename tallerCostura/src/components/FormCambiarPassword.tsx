import { useState, type FormEvent } from 'react'
import { cambiarPasswordEmpleado } from '../api'
import type { Empleado } from '../api/types'
import { PasswordInput } from './PasswordInput'

interface FormCambiarPasswordProps {
  empleado: Empleado
  onClose: () => void
}

export function FormCambiarPassword({ empleado, onClose }: FormCambiarPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    try {
      await cambiarPasswordEmpleado(empleado.id, password)
      setSaved(true)
    } catch {
      setError('No se pudo cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="form-new-trabajador">
      <h3>Cambiar contraseña de {empleado.nombreCompleto}</h3>
      {error && <p className="error">{error}</p>}

      {saved ? (
        <section>
          <p className="info">Contraseña actualizada.</p>
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
        </section>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <section>
              <label>
                Nueva contraseña:
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  autoFocus
                  required
                />
              </label>
              <label>
                Confirmar contraseña:
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </section>
          </form>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </>
      )}
    </div>
  )
}
