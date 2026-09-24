import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? registered
            ? 'Usuario o contraseña incorrectos. Si acabas de crear tu cuenta, también puede ser que la jefa aún no la haya activado.'
            : 'Usuario o contraseña incorrectos'
          : 'No se pudo iniciar sesión. Intenta de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Taller de Costura</h1>
        <p className="subtitle">Inicia sesión para continuar</p>
        {registered && (
          <p className="info">
            Cuenta creada. Espera a que la jefa la active antes de poder iniciar sesión.
          </p>
        )}
        <label>
          Usuario
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => navigate('/register')}
        >
          Crear una cuenta
        </button>
      </form>
    </main>
  )
}
