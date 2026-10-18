import type { ReactNode } from 'react'
import './ui.css'

export type BadgeColor = 'gray' | 'brand' | 'success' | 'warning' | 'error'

interface BadgeProps {
  color?: BadgeColor
  children: ReactNode
}

export function Badge({ color = 'gray', children }: BadgeProps) {
  return <span className={`badge badge-${color}`}>{children}</span>
}
