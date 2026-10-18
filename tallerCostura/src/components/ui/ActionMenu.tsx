import { useEffect, useRef, useState } from 'react'
import { DotsThreeVerticalIcon } from '@phosphor-icons/react'
import { IconButton } from './IconButton'
import './ui.css'

export interface ActionMenuItem {
  label: string
  onSelect: () => void
  danger?: boolean
}

interface ActionMenuProps {
  label: string
  items: ActionMenuItem[]
}

// Menú ⋮. Se posiciona fixed respecto al botón para que no lo recorte el scroll de la tabla.
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  function toggle() {
    if (position) {
      setPosition(null)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  useEffect(() => {
    if (!position) return
    menuRef.current?.querySelector('button')?.focus()
    function close() {
      setPosition(null)
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close()
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close()
        triggerRef.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [position])

  return (
    <div className="action-menu" ref={triggerRef}>
      <IconButton icon={DotsThreeVerticalIcon} label={label} aria-haspopup="menu" aria-expanded={!!position} onClick={toggle} />
      {position && (
        <ul className="action-menu-list" role="menu" ref={menuRef} style={{ top: position.top, right: position.right }}>
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                className={`action-menu-item${item.danger ? ' danger' : ''}`}
                onClick={() => {
                  setPosition(null)
                  item.onSelect()
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
