import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Admin {
  id: string
  email: string
  name: string
  role: 'ADMIN'
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
    if (token) {
      try {
        const adminData = localStorage.getItem('admin_data')
        if (adminData) {
          setAdmin(JSON.parse(adminData))
        }
      } catch (error) {
        console.error('Failed to parse admin data', error)
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_data')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Invalid credentials')
    }

    const data = await response.json()

    if (data.user.role !== 'ADMIN') {
      throw new Error('Access denied. Admin accounts only.')
    }

    localStorage.setItem('admin_token', data.accessToken)
    localStorage.setItem('admin_data', JSON.stringify(data.user))
    setAdmin(data.user)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
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
