const API_URL = 'http://localhost:8080/api'

const AUTH_STORAGE_KEY = 'auth'

export class ApiError extends Error {
  status: number
  // Mensaje que mandó el backend en el body; null si solo hay statusText.
  serverMessage: string | null

  constructor(status: number, message: string, serverMessage: string | null = null) {
    super(message)
    this.status = status
    this.serverMessage = serverMessage
  }
}

// Mensaje legible para mostrar: el del backend en errores de validación/conflicto, si no el genérico.
export function mensajeDeError(err: unknown, generico: string): string {
  return err instanceof ApiError && [400, 404, 409].includes(err.status) && err.serverMessage
    ? err.serverMessage
    : generico
}

function getToken(): string | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return (JSON.parse(raw) as { token?: string }).token ?? null
  } catch {
    return null
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    if (path !== '/auth/login') {
      window.location.assign('/login')
    }
    throw new ApiError(res.status, res.statusText)
  }
  if (!res.ok) {
    let serverMessage: string | null = null
    const text = await res.text().catch(() => '')
    if (text) {
      try {
        serverMessage = JSON.parse(text)?.message ?? null
      } catch {
        serverMessage = text
      }
    }
    throw new ApiError(res.status, serverMessage ?? res.statusText, serverMessage)
  }

  // 201 puede traer el recurso creado (p. ej. /pagos/calcular); solo un body vacío es undefined.
  if (res.status === 204) {
    return undefined as T
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
