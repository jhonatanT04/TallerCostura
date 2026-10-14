import { useState } from 'react'
import { ApiError, crearRegistro } from '../api'
import type { NuevoRegistro } from '../api/types'

// Envío y manejo de errores compartido por los formularios de registro de blusas.
export function useGuardarRegistro(onRegistrado: () => void) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(data: NuevoRegistro): Promise<boolean> {
    setError(null)
    setSubmitting(true)
    try {
      await crearRegistro({ ...data, color: data.color.trim() })
      onRegistrado()
      return true
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400 && err.message
          ? err.message
          : 'No se pudo guardar el registro. Intenta de nuevo.',
      )
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, error, setError, guardar }
}
