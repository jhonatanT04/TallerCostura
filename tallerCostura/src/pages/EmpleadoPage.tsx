import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { crearRegistro, getMisRegistros } from '../api'
import type { RegistroDTO } from '../api/types'
import { RegistrosTable } from '../components/RegistrosTable'
import { TALLAS_LETRA, TALLAS_NUMERICO } from '../lib/talla'

export function EmpleadoPage() {
  const [color, setColor] = useState('')
  const [talla, setTalla] = useState('')
  const [tieneMullos, setTieneMullos] = useState(false)
  const [tieneAtaches, setTieneAtaches] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [registros, setRegistros] = useState<RegistroDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadRegistros = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setRegistros(await getMisRegistros())
    } catch {
      setLoadError('No se pudieron cargar tus registros.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRegistros()
  }, [loadRegistros])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await crearRegistro({ color, talla, tieneMullos, tieneAtaches, cantidad })
      setColor('')
      setTalla('')
      setTieneMullos(false)
      setTieneAtaches(false)
      setCantidad(1)
      await loadRegistros()
    } catch {
      setFormError('No se pudo guardar el registro. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h2>Registrar blusa</h2>
      <form className="registro-form" onSubmit={handleSubmit}>
        <label>
          Color
          <input value={color} onChange={(event) => setColor(event.target.value)} required />
        </label>
        <label>
          Talla
          <select value={talla} onChange={(event) => setTalla(event.target.value)} required>
            <option value="" disabled>
              Selecciona una talla
            </option>
            <optgroup label="Letra">
              {TALLAS_LETRA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
            <optgroup label="Numérico">
              {TALLAS_NUMERICO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label>
          Cantidad
          <input
            type="number"
            min={1}
            value={cantidad}
            onChange={(event) => setCantidad(Number(event.target.value))}
            required
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={tieneMullos}
            onChange={(event) => setTieneMullos(event.target.checked)}
          />
          Mullos
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={tieneAtaches}
            onChange={(event) => setTieneAtaches(event.target.checked)}
          />
          Ataches
        </label>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Registrar'}
        </button>
      </form>
      {formError && <p className="error">{formError}</p>}

      <h2>Mis registros</h2>
      {loading ? (
        <p>Cargando…</p>
      ) : loadError ? (
        <p className="error">{loadError}</p>
      ) : (
        <RegistrosTable registros={registros} />
      )}
    </div>
  )
}
