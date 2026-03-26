'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSkeleton } from './LoadingSkeleton'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <LoadingSkeleton className="h-[60vh] w-full max-w-4xl" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
