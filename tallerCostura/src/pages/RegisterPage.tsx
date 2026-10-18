import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { register } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordInput } from '../components/PasswordInput'
import { Button } from '../components/ui/Button'

export function RegisterPage() {
  const navigate = useNavigate()

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await register(nombreCompleto, username, password)

      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'El usuario ya existe'
          : 'No se pudo crear la cuenta. Intenta de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description="La administradora debe aprobarla antes de que puedas ingresar."
      footer={
        <>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Nombre completo
          <input
            type="text"
            value={nombreCompleto}
            onChange={(event) => setNombreCompleto(event.target.value)}
            autoComplete="name"
            autoFocus
            required
          />
        </label>
        <label>
          Usuario
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Contraseña
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirmar contraseña
          <PasswordInput
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <Button type="submit" variant="primary" loading={loading} className="auth-submit">
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
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
