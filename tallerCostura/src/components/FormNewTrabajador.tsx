import { useState, type FormEvent } from "react"
import { UserPlusIcon } from '@phosphor-icons/react'
import { crearEmpleado } from "../api"
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'

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
        <ModalLayout
            icon={UserPlusIcon}
            title="Crear empleado"
            description="La cuenta queda activa de inmediato."
            onSubmit={handleCreate}
            footer={
                <>
                    <Button onClick={onClose} disabled={creating}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" loading={creating}>
                        Crear empleado
                    </Button>
                </>
            }
        >
            <label>
                Nombre completo
                <input type="text" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} autoFocus required />
            </label>
            <label>
                Nombre de usuario
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
            </label>
            <label>
                Contraseña
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </label>
            <label>
                Pago por blusa
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPagoPorBlusa}
                    onChange={(e) => setNewPagoPorBlusa(e.target.value)}
                />
            </label>
            {createError && <p className="error">{createError}</p>}
        </ModalLayout>
    )
}
