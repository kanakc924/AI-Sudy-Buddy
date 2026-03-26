'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { loginUser } from '@/services/api'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { token, user } = await loginUser({ email, password })
      login(token, user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.error?.message || err?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">

      {/* LEFT PANEL — branding with gradient */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col"
        style={{
          background: 'linear-gradient(160deg, #1a0533 0%, #2d1b69 50%, #4c1d95 100%)'
        }}
      >
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7C5CFC, transparent 70%)' }} />
          <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #A78BFA, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #ffffff, transparent 70%)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 p-8 flex items-center gap-2">
          <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-white text-xl font-medium">Study Buddy</span>
        </div>

        {/* Floating flashcard */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-10">
          <div className="w-full max-w-xs bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Sample Flashcard</p>
            <p className="text-white font-serif text-lg leading-relaxed">
              What is the powerhouse of the cell?
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 text-purple-300 text-xs flex items-center gap-1">
              <span>✦</span> Tap to reveal answer
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div className="relative z-10 p-8">
          <h2 className="font-serif text-3xl text-white leading-tight mb-2">
            Study smarter,<br />
            <span className="text-purple-300 italic">not harder</span>
          </h2>
          <p className="text-white/50 text-sm">
            AI-powered flashcards, quizzes and summaries.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-primary/20 rounded-lg p-2">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl text-foreground">Study Buddy</span>
          </div>

          <h1 className="font-serif text-3xl text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-6 text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-card border-border rounded-xl px-4 h-12 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-card border-border rounded-xl px-4 h-12 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-medium w-full mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">
                or continue with
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in you agree to our{' '}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  )
}