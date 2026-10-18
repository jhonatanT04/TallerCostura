import { useState, type FormEvent } from 'react'
import { CheckCircleIcon, KeyIcon } from '@phosphor-icons/react'
import { cambiarPasswordEmpleado } from '../api'
import type { Empleado } from '../api/types'
import { PasswordInput } from './PasswordInput'
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'

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

  if (saved) {
    return (
      <ModalLayout
        icon={CheckCircleIcon}
        title="Contraseña actualizada"
        description={`${empleado.nombreCompleto} ya puede iniciar sesión con la nueva contraseña.`}
        footer={
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        }
      />
    )
  }

  return (
    <ModalLayout
      icon={KeyIcon}
      title="Cambiar contraseña"
      description={empleado.nombreCompleto}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </>
      }
    >
      <label>
        Nueva contraseña
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} autoFocus required />
      </label>
      <label>
        Confirmar contraseña
        <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
      </label>
      {error && <p className="error">{error}</p>}
    </ModalLayout>
  )
}
