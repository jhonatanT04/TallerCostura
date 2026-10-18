import { iniciales } from '../../lib/formato'
import './ui.css'

interface AvatarProps {
  nombre: string
  size?: 'sm' | 'md'
}

export function Avatar({ nombre, size = 'md' }: AvatarProps) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  )
}

interface PersonaProps {
  nombre: string
  detalle?: string
  size?: 'sm' | 'md'
}

// Avatar + nombre (+ dato secundario debajo), para celdas de tabla y listas.
export function Persona({ nombre, detalle, size = 'sm' }: PersonaProps) {
  return (
    <span className="persona">
      <Avatar nombre={nombre} size={size} />
      <span className="persona-text">
        <span className="persona-nombre">{nombre}</span>
        {detalle && <span className="persona-detalle">{detalle}</span>}
      </span>
    </span>
  )
}
