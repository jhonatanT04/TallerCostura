import { useState, type FormEvent } from 'react'
import { AddressBookIcon } from '@phosphor-icons/react'
import { crearCliente } from '../api'
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'

interface FormNewClienteProps {
  onClose: () => void
  onCreate: () => void
}

export function FormNewCliente({ onClose, onCreate }: FormNewClienteProps) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await crearCliente({ nombre, telefono: telefono.trim() === '' ? null : telefono })
      setNombre('')
      setTelefono('')
      onClose()
      onCreate()
    } catch {
      setCreateError('No se pudo crear el cliente.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <ModalLayout
      icon={AddressBookIcon}
      title="Crear cliente"
      onSubmit={handleCreate}
      footer={
        <>
          <Button onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={creating}>
            Crear cliente
          </Button>
        </>
      }
    >
      <label>
        Nombre
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus required />
      </label>
      <label>
        Teléfono (opcional)
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
      </label>
      {createError && <p className="error">{createError}</p>}
    </ModalLayout>
  )
}
