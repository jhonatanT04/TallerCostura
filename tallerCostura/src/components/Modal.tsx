import { useEffect, type ReactNode } from 'react'
import './ui/ui.css'

interface ModalProps {
  onClose: () => void
  children: ReactNode
  label?: string
  size?: 'md' | 'lg'
}

export function Modal({ onClose, children, label, size = 'md' }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
