import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

// Columna centrada para login y registro (fuera del shell de la app).
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <div className="auth-column">
        <div className="auth-brand">
          <img src="/favicon.png" alt="" className="auth-logo" />
          <span>Taller de Costura</span>
        </div>
        <header className="auth-header">
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </main>
  )
}
