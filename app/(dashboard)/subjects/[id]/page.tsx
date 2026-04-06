'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Plus, Loader2, BookOpen, Trash2, ArrowRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTopics, createTopic, getSubjects, deleteTopic, updateTopic } from '@/services/api'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { EmptyState } from '@/components/empty-state'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Bell, Calendar, BarChart3, Play, Award } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/AuthContext'

export default function TopicsPage() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params.id as string

  const [topics, setTopics] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [subjectTitle, setSubjectTitle] = useState('Loading...')
  const [loading, setLoading] = useState(true)

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Subject Name
      const subs = await getSubjects()
      const subject = subs.data.find((s: any) => s._id === subjectId)
      if (subject) setSubjectTitle(subject.title)
      else setSubjectTitle('Unknown Subject')

      // 2. Fetch Topics
      const res = await getTopics(subjectId)
      setTopics(res.data)

      // 3. Fetch Sessions for this subject
      const token = localStorage.getItem('study_buddy_token')
      const sRes = await fetch(`/api/sessions?subjectId=${subjectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (sRes.ok) {
        const sJson = await sRes.json()
        setSessions(sJson.data || [])
      }
    } catch (err) {
      toast.error('Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (subjectId) fetchData()
  }, [subjectId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await createTopic(subjectId, { title: name })
      toast.success('Topic created')
      setName('')
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create topic')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setIsSubmitting(true)
    try {
      await deleteTopic(deletingId)
      toast.success('Topic deleted')
      setIsDeleteDialogOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setIsSubmitting(false)
      setDeletingId(null)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim() || !editingId) return

    setIsSubmitting(true)
    try {
      await updateTopic(editingId, { title: editName })
      toast.success('Topic updated')
      setEditName('')
      setEditingId(null)
      setIsEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update topic')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl border-border bg-card">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              Subject: <span className="text-primary italic">{subjectTitle}</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Track your progress and access all associated topics.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-4 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-4 h-4 mr-2" /> New Topic
          </Button>
        </div>
      </div>

      {/* Subject Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
        {(() => {
          const totalMastery = sessions.length > 0 
            ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length) 
            : 0;
          
          let lastActivity = 'None';
          if (sessions.length > 0) {
            const latestDate = new Date(sessions[0].completedAt);
            const diffInMs = Date.now() - latestDate.getTime();
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            if (diffInDays === 0) lastActivity = 'Today';
            else if (diffInDays === 1) lastActivity = 'Yesterday';
            else lastActivity = `${diffInDays}d ago`;
          }

          return [
            { label: 'Total Topics', value: topics.length, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Mastery', value: `${totalMastery}%`, icon: Award, color: 'text-mint', bg: 'bg-mint/10' },
            { label: 'Last Activity', value: lastActivity, icon: Calendar, color: 'text-pink', bg: 'bg-pink/10' },
          ].map((stat, i) => (
            <div 
              key={i} 
              className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-2 w-full min-h-[140px] border border-border/50 hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(124,92,252,0.15)] hover:-translate-y-1 transition-all duration-200 shadow-sm bg-card"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-1`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {stat.label}
              </p>
              <p className="text-3xl font-serif font-bold text-foreground">
                {stat.value}
              </p>
            </div>
          ));
        })()}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <LoadingSkeleton key={i} variant="topicCard" />)}
        </div>
      ) : topics.length === 0 ? (
        <div className="mt-8">
          <EmptyState variant="topics" onAction={() => setIsModalOpen(true)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {topics.map((topic, index) => {
              const topicSessions = sessions.filter(s => s.topicId?._id === topic._id || s.topicId === topic._id);
              const mastery = topicSessions.length > 0 
                ? Math.round(topicSessions.reduce((acc, s) => acc + s.score, 0) / topicSessions.length)
                : 0;
              
              const isMastered = mastery > 80
              const status = mastery === 0 ? 'Not Started' : (isMastered ? 'Mastered' : 'In Progress')
              
              return (
                <motion.div
                  key={topic._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/topics/${topic._id}`)}
                  className="group relative"
                >
                  <Card className="bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_32px_rgba(124,92,252,0.2)] hover:-translate-y-1 hover:border-primary/50 cursor-pointer h-full border-border/60 transition-all duration-200">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-serif text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {topic.title}
                          </h3>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            mastery === 0 ? 'bg-muted text-muted-foreground' : (isMastered ? 'bg-mint/10 text-mint' : 'bg-primary/10 text-primary')
                          }`}>
                            {status}
                          </div>
                        </div>
                        <div className="flex gap-1 items-center shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => { e.stopPropagation(); setEditName(topic.title); setEditingId(topic._id); setIsEditModalOpen(true); }}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(topic._id); setIsDeleteDialogOpen(true); }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {topic.notes ? topic.notes.substring(0, 80) + '...' : 'Dive into details or extract key factors from your materials.'}
                      </p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Mastery</span>
                          <span>{mastery}%</span>
                        </div>
                        <Progress value={mastery} className="h-1.5 rounded-full bg-muted [&>div]:bg-primary" />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3">
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                          <ArrowRight className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-border rounded-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">New Topic</DialogTitle>
            <DialogDescription>
              Create a new topic to organize specific notes and study tools.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-4">
              <label className="text-sm font-medium ml-1">Topic Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Structure of Mitochondria" 
                className="bg-card border-border h-12 px-4 rounded-xl focus:ring-primary/50"
                autoFocus
                required
              />
            </div>
            <DialogFooter className="pt-4 sm:justify-start">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto h-12 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Topic
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-popover border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this topic and all its flashcards, quizzes, and notes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="ghost" className="rounded-xl" disabled={isSubmitting}>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                onClick={(e) => { e.preventDefault(); handleDelete(); }} 
                className="rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete Topic
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Topic Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Rename Topic</DialogTitle>
            <DialogDescription>
              Give your topic a new name.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Introduction to Cells"
              disabled={isSubmitting}
              className="mt-4 bg-muted border-border rounded-xl focus-visible:ring-primary/20"
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={!editName.trim() || isSubmitting} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
