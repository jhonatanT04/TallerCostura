import './ui.css'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '16px', className }: SkeletonProps) {
  return (
    <span
      className={['skeleton', className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

interface SkeletonRowsProps {
  rows?: number
  label?: string
}

// Bloque de carga genérico (lista o tabla) con texto accesible para lectores de pantalla.
export function SkeletonRows({ rows = 4, label = 'Cargando' }: SkeletonRowsProps) {
  return (
    <div className="skeleton-rows" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height="44px" />
      ))}
    </div>
  )
}
