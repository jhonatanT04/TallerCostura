import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import './ui.css'

interface PopoverProps {
  onClose: () => void
  // Contenedor del botón que abre el popover: los clics dentro no lo cierran y el foco vuelve a él.
  anchorRef: RefObject<HTMLElement | null>
  label: string
  children: ReactNode
}

// Anclado debajo del botón en desktop; en móvil (< 768px) se muestra como bottom sheet con overlay.
export function Popover({ onClose, anchorRef, label, children }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const anchor = anchorRef.current
    panelRef.current?.focus()
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !anchor?.contains(target)) onCloseRef.current()
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      anchor?.querySelector('button')?.focus()
    }
  }, [anchorRef])

  return (
    <>
      <div className="popover-overlay" aria-hidden="true" />
      <div className="popover" role="dialog" aria-label={label} tabIndex={-1} ref={panelRef}>
        {children}
      </div>
    </>
  )
}
