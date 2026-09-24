import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { register } from '../api'

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
    <main className="auth-page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Taller de Costura</h1>

        <p className="subtitle">
          Crea una cuenta para continuar
        </p>

        <label>
          Nombre completo
          <input
            type="text"
            value={nombreCompleto}
            onChange={(event) => setNombreCompleto(event.target.value)}
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

        <label>
          Confirmar contraseña
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="primary"
          disabled={loading}
        >
          {loading ? 'Registrando…' : 'Registrarse'}
        </button>

        <button
          type="button"
          className="secondary"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Ya tengo una cuenta
        </button>
      </form>
    </main>
  )
}

