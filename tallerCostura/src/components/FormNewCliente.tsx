import { useState, type FormEvent } from 'react'
import { crearCliente } from '../api'

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
    <div className="form-new-trabajador">
      <h3>Crear nuevo cliente</h3>
      {createError && <p className="error">{createError}</p>}
      {creating && <p className="error">Creando cliente...</p>}

      {!creating && !createError && (
        <section>
          <form onSubmit={handleCreate}>
            <section>
              <label>
                Nombre:
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoFocus
                  required
                />
              </label>
              <label>
                Teléfono:
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </label>
              <button type="submit" disabled={creating}>
                {' '}
                Crear{' '}
              </button>
            </section>
          </form>
          <button onClick={onClose}>Cancelar</button>
        </section>
      )}
    </div>
  )
}
