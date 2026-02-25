import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../lib/auth'

interface Admin {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'admin'
  isVerified: boolean
}

interface AuthContextType {
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const adminData = localStorage.getItem('admin_data')
    if (token && adminData) {
      try {
        setAdmin(JSON.parse(adminData))
      } catch {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_data')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password })

    if (String(data.user.role).toLowerCase() !== 'admin') {
      throw new Error('Access denied. Admin accounts only.')
    }

    localStorage.setItem('admin_token', data.accessToken)
    localStorage.setItem('admin_data', JSON.stringify(data.user))
    setAdmin(data.user)
  }

  const logout = () => {
    authService.logout()
    setAdmin(null)
  }

  const isAuthenticated = useMemo(() => {
    const token = localStorage.getItem('admin_token')
    return Boolean(token && admin)
  }, [admin])

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
