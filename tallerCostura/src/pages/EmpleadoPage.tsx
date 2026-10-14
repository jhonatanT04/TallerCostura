import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, crearRegistro, getMisRegistros } from '../api'
import type { RegistroDTO } from '../api/types'
import { RegistrosTable } from '../components/RegistrosTable'
import { TALLAS_NUMERICO } from '../lib/talla'

type ModoRegistro = 'confeccion' | 'mullosAtaches'

export function EmpleadoPage() {
  const [modo, setModo] = useState<ModoRegistro>('confeccion')
  const [color, setColor] = useState('')
  const [talla, setTalla] = useState('')
  const [cantidadConfeccion, setCantidadConfeccion] = useState(1)
  const [cantidadMullos, setCantidadMullos] = useState(0)
  const [cantidadAtaches, setCantidadAtaches] = useState(0)
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

  function reiniciarCantidades() {
    setCantidadConfeccion(1)
    setCantidadMullos(0)
    setCantidadAtaches(0)
  }

  function cambiarModo(nuevoModo: ModoRegistro) {
    setModo(nuevoModo)
    setFormError(null)
    reiniciarCantidades()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (modo === 'confeccion' && cantidadConfeccion < 1) {
      setFormError('Ingresa al menos 1 blusa confeccionada.')
      return
    }
    if (modo === 'mullosAtaches' && cantidadMullos + cantidadAtaches <= 0) {
      setFormError('Ingresa al menos un mullo o un atache.')
      return
    }
    setSubmitting(true)
    try {
      await crearRegistro(
        modo === 'confeccion'
          ? { color: color.trim(), talla, cantidadConfeccion, cantidadMullos: 0, cantidadAtaches: 0 }
          : { color: color.trim(), talla, cantidadConfeccion: 0, cantidadMullos, cantidadAtaches },
      )
      setColor('')
      setTalla('')
      reiniciarCantidades()
      await loadRegistros()
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 400 && err.message
          ? err.message
          : 'No se pudo guardar el registro. Intenta de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h2>Registrar blusa</h2>
      <form className="registro-form" onSubmit={handleSubmit}>
        <label>
          Tipo de registro
          <select value={modo} onChange={(event) => cambiarModo(event.target.value as ModoRegistro)}>
            <option value="confeccion">Blusas confeccionadas</option>
            <option value="mullosAtaches">Mullos y ataches</option>
          </select>
        </label>
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
            <optgroup label="Numérico">
              {TALLAS_NUMERICO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        {modo === 'confeccion' ? (
          <label>
            Blusas confeccionadas
            <input
              type="number"
              min={1}
              value={cantidadConfeccion}
              onChange={(event) => setCantidadConfeccion(Math.max(0, Number(event.target.value) || 0))}
              required
            />
          </label>
        ) : (
          <>
            <label>
              Mullos puestos
              <input
                type="number"
                min={0}
                value={cantidadMullos}
                onChange={(event) => setCantidadMullos(Math.max(0, Number(event.target.value) || 0))}
              />
            </label>
            <label>
              Ataches puestos
              <input
                type="number"
                min={0}
                value={cantidadAtaches}
                onChange={(event) => setCantidadAtaches(Math.max(0, Number(event.target.value) || 0))}
              />
            </label>
          </>
        )}
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
