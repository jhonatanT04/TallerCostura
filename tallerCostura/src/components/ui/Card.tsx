import type { HTMLAttributes, ReactNode } from 'react'
import './ui.css'

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  actions?: ReactNode
  elevated?: boolean
}

export function Card({ title, actions, elevated = false, className, children, ...rest }: CardProps) {
  const classes = ['card-ui', elevated ? 'card-ui-elevated' : '', className].filter(Boolean).join(' ')
  return (
    <section {...rest} className={classes}>
      {(title || actions) && (
        <div className="card-ui-header">
          {title && <h3>{title}</h3>}
          {actions && <div className="card-ui-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
