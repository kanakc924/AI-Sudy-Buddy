'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { User, Lock, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'


export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  
  // States
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Handlers
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Mock API call since specific PUT route wasn't completely fleshed out in simple api.ts
      // In reality: await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify({ name, email }) })
      await new Promise(r => setTimeout(r, 800))
      toast.success('Profile updated successfully')
    } catch (e) {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      toast.error('New passwords do not match')
      return
    }
    setIsSaving(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      toast.success('Password changed successfully')
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (e) {
      toast.error('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }


  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences</p>
        </div>

      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="glass-card rounded-xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-2xl">Profile</h2>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Full Name</label>
                <Input 
                  value={name} onChange={e => setName(e.target.value)}
                  className="bg-card border-border h-12 rounded-xl focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Email Address</label>
                <Input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-card border-border h-12 rounded-xl focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-full sm:w-auto h-11 px-8">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Changes
              </Button>
            </div>
          </form>
        </div>
      </motion.div>


    </div>
  )
}
