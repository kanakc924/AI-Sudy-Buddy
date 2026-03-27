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
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('study_buddy_token')
    if (stored && stored !== 'undefined' && stored !== 'null') {
      setToken(stored)
      checkAuthWithToken(stored)
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuthWithToken = async (t: string) => {
    try {
      const res = await getMe()
      setUser(res.user || res.data || res)
    } catch {
      localStorage.removeItem('study_buddy_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    const stored = localStorage.getItem('study_buddy_token')
    if (stored) await checkAuthWithToken(stored)
  }

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('study_buddy_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('study_buddy_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Alias for backward compatibility with old imports
export const useAuthContext = useAuth