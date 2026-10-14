import { useState, type FormEvent } from 'react'
import { useGuardarRegistro } from '../lib/useGuardarRegistro'
import { CamposColorTalla, type CamposColorTallaProps } from './CamposColorTalla'

interface FormRegistroMullosAtachesProps extends CamposColorTallaProps {
  onRegistrado: () => void
}

export function FormRegistroMullosAtaches({ onRegistrado, ...campos }: FormRegistroMullosAtachesProps) {
  const [cantidadMullos, setCantidadMullos] = useState(0)
  const [cantidadAtaches, setCantidadAtaches] = useState(0)
  const { submitting, error, setError, guardar } = useGuardarRegistro(onRegistrado)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (cantidadMullos + cantidadAtaches <= 0) {
      setError('Ingresa al menos un mullo o un atache.')
      return
    }
    const ok = await guardar({
      color: campos.color,
      talla: campos.talla,
      cantidadConfeccion: 0,
      cantidadMullos,
      cantidadAtaches,
    })
    if (ok) {
      setCantidadMullos(0)
      setCantidadAtaches(0)
    }
  }

  return (
    <>
      <form className="registro-form" onSubmit={handleSubmit}>
        <CamposColorTalla {...campos} />
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
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Registrar'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </>
  )
}
