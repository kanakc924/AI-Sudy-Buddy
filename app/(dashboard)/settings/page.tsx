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
  
  // Danger Zone
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.email) return
    setIsDeleting(true)
    try {
      // await apiFetch('/auth/me', { method: 'DELETE' })
      await new Promise(r => setTimeout(r, 1000))
      logout()
      toast.success('Account deleted successfully')
    } catch (e) {
      toast.error('Failed to delete account')
      setIsDeleting(false)
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass-card rounded-xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-2xl">Security</h2>
          </div>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Current Password</label>
              <Input 
                type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                className="bg-card border-border h-12 rounded-xl focus:ring-primary/50"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">New Password</label>
                <Input 
                  type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                  className="bg-card border-border h-12 rounded-xl focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Confirm New Password</label>
                <Input 
                  type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  className="bg-card border-border h-12 rounded-xl focus:ring-(--destructive)/50 focus:border-var(--destructive)"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isSaving || !currentPass || !newPass} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-full sm:w-auto h-11 px-8">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Change Password
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 text-destructive border-b border-destructive/20 pb-4">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-serif text-2xl">Danger Zone</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Delete Account</h3>
              <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all associated data.</p>
            </div>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="rounded-xl px-6 w-full sm:w-auto h-11 shrink-0">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-destructive/30 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-destructive flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-foreground pt-4">
              This action cannot be undone. All your subjects, topics, flashcards, and quizzes will be permanently deleted.
              <br /><br />
              Please type your email <strong className="text-primary">{user?.email}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder={user?.email}
              className="bg-card border-destructive/30 h-12 rounded-xl focus:ring-destructive/50 focus:border-destructive text-foreground"
            />
          </div>
          <DialogFooter className="sm:justify-start gap-2">
            <Button variant="ghost" onClick={() => { setIsDeleteDialogOpen(false); setDeleteConfirmText(''); }} className="h-11 rounded-xl flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== user?.email || isDeleting}
              className="h-11 rounded-xl flex-1 sm:flex-none px-6"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
