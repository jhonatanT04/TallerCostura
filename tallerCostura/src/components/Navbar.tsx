import { useAuth } from '../auth/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <header className="navbar">
      <span className="brand">Taller de Costura</span>
      <div className="navbar-user">
        <span>
          {user.nombreCompleto}{' '}
          <span className="muted">({user.role === 'ADMIN' ? 'Jefa' : 'Empleado'})</span>
        </span>
        <button type="button" onClick={logout}>
          Salir
        </button>
      </div>
    </header>
  )
}
