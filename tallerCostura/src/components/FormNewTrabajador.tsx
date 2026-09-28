import { useState, type FormEvent } from "react"
import { crearEmpleado } from "../api"
export function FormNewTrabajador({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
    const [newUsername, setNewUsername] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newNombre, setNewNombre] = useState('')
    const [newPagoPorBlusa, setNewPagoPorBlusa] = useState('0')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setCreateError(null)
        setCreating(true)
        try {
            await crearEmpleado({
                username: newUsername,
                password: newPassword,
                nombreCompleto: newNombre,
                pagoPorBlusa: Number(newPagoPorBlusa) || 0,
            })
            setNewUsername('')
            setNewPassword('')
            setNewNombre('')
            setNewPagoPorBlusa('0')
            onClose()
            onCreate()
        } catch {
            setCreateError('No se pudo crear el empleado.')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="form-new-trabajador">
            <h3>Crear nuevo empleado</h3>
            {createError && <p className="error">{createError}</p>}
            {creating && <p className="error">Creando empleado...</p>}

            {!creating && !createError && (<section>
                <form onSubmit={handleCreate}>
                    <section>
                        <label>
                            Nombre completo:
                            <input
                                type="text"
                                value={newNombre}
                                onChange={(e) => setNewNombre(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Nombre de usuario:
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Contraseña:
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Pago por blusa:
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newPagoPorBlusa}
                                onChange={(e) => setNewPagoPorBlusa(e.target.value)}
                            />
                        </label>
                        <button type="submit" disabled={creating}> Crear </button>
                    </section>

                </form>
                <button onClick={onClose}>Cancelar</button>
            </section>
            )}



        </div>
    )
}