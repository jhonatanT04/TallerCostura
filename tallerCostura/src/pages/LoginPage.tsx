import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordInput } from '../components/PasswordInput'
import { Button } from '../components/ui/Button'

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
            ? 'Usuario o contraseña incorrectos. Si acabas de crear tu cuenta, también puede ser que la administradora aún no la haya activado.'
            : 'Usuario o contraseña incorrectos'
          : 'No se pudo iniciar sesión. Intenta de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      description="Ingresa con tu usuario y contraseña."
      footer={
        <>
          ¿No tienes cuenta? <Link to="/register">Crea una cuenta</Link>
        </>
      }
    >
      {registered && (
        <p className="auth-aviso" role="status">
          Tu cuenta quedó pendiente de aprobación por la administradora. Podrás iniciar sesión cuando la active.
        </p>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Usuario
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>
        <label>
          Contraseña
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <Button type="submit" variant="primary" loading={loading} className="auth-submit">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
