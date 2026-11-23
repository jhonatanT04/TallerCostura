import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { login as loginRequest, loginSocial as loginSocialRequest } from '../api'
import type { AuthUser, ProveedorSocial, SocialLoginResponse } from '../api/types'

const STORAGE_KEY = 'auth'

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  // Con Google/Facebook: si la cuenta está pendiente de activar, no se inicia sesión.
  loginSocial: (proveedor: ProveedorSocial, token: string) => Promise<SocialLoginResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    setUser(result)
  }, [])

  const loginSocial = useCallback(async (proveedor: ProveedorSocial, token: string) => {
    const result = await loginSocialRequest(proveedor, token)
    if (result.estado === 'AUTENTICADO' && result.sesion) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.sesion))
      setUser(result.sesion)
    }
    return result
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, loginSocial, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
