'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSubjects } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

interface SubjectContextType {
  subjects: any[]
  loading: boolean
  refreshSubjects: () => Promise<void>
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined)

export function SubjectProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const refreshSubjects = useCallback(async () => {
    if (!user) {
      setSubjects([])
      setLoading(false)
      return
    }

    try {
      const res = await getSubjects()
      setSubjects(res.data || [])
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshSubjects()
  }, [refreshSubjects])

  return (
    <SubjectContext.Provider value={{ subjects, loading, refreshSubjects }}>
      {children}
    </SubjectContext.Provider>
  )
}

export function useSubjects() {
  const context = useContext(SubjectContext)
  if (context === undefined) {
    throw new Error('useSubjects must be used within a SubjectProvider')
  }
  return context
}
