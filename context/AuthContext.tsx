'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '@/services/api'

type User = {
  _id?: string
  id?: string
  name: string
  email: string
  streak?: number
  aiUsageToday?: number
  aiDailyLimit?: number
}

interface AuthContextType {
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  updateAiUsage: (total: number) => void
  loading: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const updateAiUsage = (total: number) => {
    if (user) {
      setUser({ ...user, aiUsageToday: total })
    }
  }

  const checkAuth = async () => {
    setLoading(true)
    try {
      const res = await getMe()
      setUser(res.user || res.data || res)
    } catch (err: any) {
      console.warn('[AUTH] Initial check failed:', err.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = (newToken: string, newUser: User) => {
    // The HTTP-only cookie is now set by the backend API automatically
    setUser(newUser)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout error', e)
    }
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateAiUsage, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Alias for backward compatibility with old imports
export const useAuthContext = useAuth