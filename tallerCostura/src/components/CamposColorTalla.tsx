import { useId } from 'react'
import { COLORES_SUGERIDOS, muestraDeColor } from '../lib/colores'
import { TALLAS_NUMERICO } from '../lib/talla'

export interface CamposColorTallaProps {
  color: string
  talla: string
  onColorChange: (color: string) => void
  onTallaChange: (talla: string) => void
}

export function CamposColorTalla({ color, talla, onColorChange, onTallaChange }: CamposColorTallaProps) {
  const listaId = useId()
  const muestra = muestraDeColor(color)

  return (
    <>
      <label className="campo-color">
        Color
        <span className={`campo-color-input${muestra ? ' con-muestra' : ''}`}>
          {muestra && <span className="color-chip-dot" style={{ backgroundColor: muestra }} aria-hidden="true" />}
          <input
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
            list={listaId}
            autoComplete="off"
            required
          />
        </span>
        <datalist id={listaId}>
          {COLORES_SUGERIDOS.map((nombre) => (
            <option key={nombre} value={nombre} />
          ))}
        </datalist>
      </label>
      <label>
        Talla
        <select value={talla} onChange={(event) => onTallaChange(event.target.value)} required>
          <option value="" disabled>
            Selecciona una talla
          </option>
          {TALLAS_NUMERICO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
