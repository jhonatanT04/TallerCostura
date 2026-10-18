import type { ButtonHTMLAttributes } from 'react'
import type { Icon } from '@phosphor-icons/react'
import './ui.css'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: Icon
  // Texto accesible: los botones solo-ícono siempre necesitan nombre.
  label: string
}

export function IconButton({ icon: IconComponent, label, type = 'button', className, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={['icon-btn', className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
    >
      <IconComponent size={20} aria-hidden="true" />
    </button>
  )
}
