import { useState, type FormEvent } from 'react'
import { useGuardarRegistro } from '../lib/useGuardarRegistro'
import { CamposColorTalla, type CamposColorTallaProps } from './CamposColorTalla'
import { RegistroMensajes } from './RegistroMensajes'
import { Button } from './ui/Button'

interface FormRegistroConfeccionProps extends CamposColorTallaProps {
  onRegistrado: () => void
}

export function FormRegistroConfeccion({ onRegistrado, ...campos }: FormRegistroConfeccionProps) {
  const [cantidadConfeccion, setCantidadConfeccion] = useState(1)
  const { submitting, error, setError, exito, guardar } = useGuardarRegistro(onRegistrado)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (cantidadConfeccion < 1) {
      setError('Ingresa al menos 1 blusa confeccionada.')
      return
    }
    const ok = await guardar({
      color: campos.color,
      talla: campos.talla,
      cantidadConfeccion,
      cantidadMullos: 0,
      cantidadAtaches: 0,
    })
    if (ok) setCantidadConfeccion(1)
  }

  return (
    <>
      <form className="registro-form" onSubmit={handleSubmit}>
        <CamposColorTalla {...campos} />
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
        <Button type="submit" variant="primary" loading={submitting} className="registro-submit">
          {submitting ? 'Guardando…' : 'Registrar'}
        </Button>
      </form>
      <RegistroMensajes error={error} exito={exito} />
    </>
  )
}
