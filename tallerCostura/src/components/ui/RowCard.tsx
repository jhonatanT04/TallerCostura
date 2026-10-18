import type { ReactNode } from 'react'
import './ui.css'

interface RowCardProps {
  title: ReactNode
  aside?: ReactNode
  meta?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

// Fila de tabla en formato tarjeta para móvil: título y dato clave arriba, detalles abajo.
export function RowCard({ title, aside, meta, footer, children }: RowCardProps) {
  return (
    <li className="row-card">
      <div className="row-card-top">
        <div className="row-card-title">{title}</div>
        {aside && <div className="row-card-aside">{aside}</div>}
      </div>
      {(meta || footer) && (
        <div className="row-card-bottom">
          {meta && <div className="row-card-meta">{meta}</div>}
          {footer && <div className="row-card-footer">{footer}</div>}
        </div>
      )}
      {children}
    </li>
  )
}
