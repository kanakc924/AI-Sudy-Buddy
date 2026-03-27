'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { registerUser } from '@/services/api'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const { token, user } = await registerUser({ name, email, password })
      login(token, user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.error?.message || err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background noise-bg flex items-center justify-center px-8">
      <div className="w-full max-w-2xl glass-card rounded-2xl p-12 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 rounded-xl p-3 mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl text-foreground">Study Buddy</h1>
          <p className="text-muted-foreground mt-2">Create an account</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-6 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground ml-1">Name</label>
            <Input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-card border-border rounded-xl px-4 py-6 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="Alice Wonderland"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground ml-1">Email</label>
            <Input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-card border-border rounded-xl px-4 py-6 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="alice@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground ml-1">Password</label>
            <Input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-card border-border rounded-xl px-4 py-6 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-6 font-medium mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline transition-all">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}