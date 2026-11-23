import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ProveedorSocial } from '../api'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { BotonesSociales } from '../components/BotonesSociales'
import { PasswordInput } from '../components/PasswordInput'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  const { login, loginSocial } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const registered = Boolean((location.state as { registered?: boolean } | null)?.registered)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendiente, setPendiente] = useState<string | null>(null)

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

  async function handleSocial(proveedor: ProveedorSocial, token: string) {
    setError(null)
    setPendiente(null)
    setLoading(true)
    try {
      const resultado = await loginSocial(proveedor, token)
      if (resultado.estado === 'AUTENTICADO') {
        navigate('/', { replace: true })
      } else {
        setPendiente(resultado.mensaje ?? 'Tu cuenta está pendiente de aprobación por la administradora.')
      }
    } catch (err) {
      // Los mensajes del backend aquí ya son para mostrar ("No se pudo verificar tu cuenta de Google").
      setError(
        err instanceof ApiError && err.serverMessage ? err.serverMessage : 'No se pudo iniciar sesión. Intenta de nuevo.',
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
      {pendiente && (
        <p className="auth-aviso" role="status">
          {pendiente}
        </p>
      )}
      {registered && !pendiente && (
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
      <BotonesSociales onToken={handleSocial} deshabilitado={loading} conSeparador onError={setError} />
    </AuthLayout>
  )
}
