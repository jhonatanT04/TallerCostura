import { useEffect, useState } from 'react'
import { crearRegistro, mensajeDeError } from '../api'
import type { NuevoRegistro } from '../api/types'

// Envío y manejo de errores compartido por los formularios de registro de blusas.
export function useGuardarRegistro(onRegistrado: () => void) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Cuenta los guardados: cada uno reinicia los 3 s del mensaje "Registro guardado".
  const [guardados, setGuardados] = useState(0)
  const [exito, setExito] = useState(false)

  useEffect(() => {
    if (guardados === 0) return
    const timer = setTimeout(() => setExito(false), 3000)
    return () => clearTimeout(timer)
  }, [guardados])

  async function guardar(data: NuevoRegistro): Promise<boolean> {
    setError(null)
    setExito(false)
    setSubmitting(true)
    try {
      await crearRegistro({ ...data, color: data.color.trim() })
      onRegistrado()
      setExito(true)
      setGuardados((n) => n + 1)
      return true
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el registro. Intenta de nuevo.'))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, error, setError, exito, guardar }
}
