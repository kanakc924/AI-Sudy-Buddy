'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Plus, Loader2, BookOpen, Trash2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTopics, createTopic, getSubjects, deleteTopic } from '@/services/api'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { EmptyState } from '@/components/empty-state'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Bell, Calendar, BarChart3, Clock, Play, Award } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/AuthContext'

export default function TopicsPage() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params.id as string

  const [topics, setTopics] = useState<any[]>([])
  const [subjectTitle, setSubjectTitle] = useState('Loading...')
  const [loading, setLoading] = useState(true)

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
          <Button variant="outline" size="icon" className="rounded-xl border-border bg-card relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full" />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-4 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-4 h-4 mr-2" /> New Topic
          </Button>
        </div>
      </div>

      {/* Subject Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Topics', value: topics.length, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Mastery', value: '68%', icon: Award, color: 'text-mint', bg: 'bg-mint/10' },
          { label: 'Study Time', value: '12h', icon: Clock, color: 'text-blue', bg: 'bg-blue/10' },
          { label: 'Last Activity', value: '2d ago', icon: Calendar, color: 'text-pink', bg: 'bg-pink/10' },
        ].map((stat, i) => (
          <Card key={i} className="border-border bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-lg font-bold">{stat.value}</h3>
            </div>
          </Card>
        ))}
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
              const progress = Math.floor(Math.random() * 60) + 30 // Mock progress
              const isMastered = progress > 80
              
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
                  <Card className="bg-card rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full border-border/60">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-serif text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {topic.title}
                          </h3>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isMastered ? 'bg-mint/10 text-mint' : 'bg-primary/10 text-primary'}`}>
                            {isMastered ? 'Mastered' : 'In Progress'}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(topic._id); setIsDeleteDialogOpen(true); }}
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {topic.notes ? topic.notes.substring(0, 80) + '...' : 'Dive into details or extract key factors from your materials.'}
                      </p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Mastery</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 rounded-full bg-muted [&>div]:bg-primary" />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Sparkles className="w-4 h-4 text-primary" />
                            {topic.flashcardsCount || (topic.flashcards?.length || 0)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Brain className="w-4 h-4 text-mint" />
                            {topic.quizzesCount || (topic.quizzes?.length || 0)}
                          </div>
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
            <div className="space-y-2">
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
            <AlertDialogCancel className="border-border hover:bg-card h-10 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-10 rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
