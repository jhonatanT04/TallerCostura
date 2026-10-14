import { TALLAS_NUMERICO } from '../lib/talla'

export interface CamposColorTallaProps {
  color: string
  talla: string
  onColorChange: (color: string) => void
  onTallaChange: (talla: string) => void
}

export function CamposColorTalla({ color, talla, onColorChange, onTallaChange }: CamposColorTallaProps) {
  return (
    <>
      <label>
        Color
        <input value={color} onChange={(event) => onColorChange(event.target.value)} required />
      </label>
      <label>
        Talla
        <select value={talla} onChange={(event) => onTallaChange(event.target.value)} required>
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
    </>
  )
}
