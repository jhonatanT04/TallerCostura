import { muestraDeColor } from '../../lib/colores'
import './ui.css'

export function ColorChip({ color }: { color: string }) {
  const muestra = muestraDeColor(color)
  return (
    <span className="color-chip">
      {muestra && <span className="color-chip-dot" style={{ backgroundColor: muestra }} aria-hidden="true" />}
      {color}
    </span>
  )
}
