import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { TOKEN_KEY } from '../lib/http'
import type { LoginRequest, RegisterRequest, User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (req: LoginRequest) => Promise<User>
  register: (req: RegisterRequest) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On boot, if we hold a token, resolve the session.
  useEffect(() => {
    let alive = true
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then((u) => alive && setUser(u))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (req: LoginRequest) => {
    const { token, user: u } = await api.login(req)
    localStorage.setItem(TOKEN_KEY, token)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (req: RegisterRequest) => {
    const { token, user: u } = await api.register(req)
    localStorage.setItem(TOKEN_KEY, token)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
