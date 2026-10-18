import type { FormEvent, ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'
import './ui.css'

interface ModalLayoutProps {
  title: ReactNode
  description?: ReactNode
  icon?: Icon
  tone?: 'brand' | 'error'
  footer?: ReactNode
  // Si se pasa, el cuerpo y el footer quedan dentro de un <form> (el footer puede tener el submit).
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  children?: ReactNode
}

// Estructura común de los modales: encabezado con ícono, cuerpo y footer de acciones.
export function ModalLayout({ title, description, icon: IconComponent, tone = 'brand', footer, onSubmit, children }: ModalLayoutProps) {
  const body = (
    <>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </>
  )

  return (
    <div className="modal-layout">
      <header className="modal-header">
        {IconComponent && (
          <span className={`modal-icon modal-icon-${tone}`} aria-hidden="true">
            <IconComponent size={24} />
          </span>
        )}
        <h3>{title}</h3>
        {description && <p className="modal-description">{description}</p>}
      </header>
      {onSubmit ? (
        <form onSubmit={onSubmit} noValidate={false}>
          {body}
        </form>
      ) : (
        body
      )}
    </div>
  )
}
