import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CircleNotchIcon, type Icon } from '@phosphor-icons/react'
import './ui.css'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: Icon
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: IconComponent,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, className].filter(Boolean).join(' ')
  const iconSize = size === 'sm' ? 18 : 20

  return (
    <button {...rest} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading ? (
        <CircleNotchIcon size={iconSize} className="btn-spinner" aria-hidden="true" />
      ) : (
        IconComponent && <IconComponent size={iconSize} aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
