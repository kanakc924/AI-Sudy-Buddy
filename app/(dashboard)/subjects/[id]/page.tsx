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
import { ChevronRight } from 'lucide-react'

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-6 mb-10">
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Link href="/subjects" className="hover:text-foreground transition-colors">Subjects</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium truncate">{subjectTitle}</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground truncate">{subjectTitle}</h1>
            <p className="text-muted-foreground mt-1">Select a topic to start studying</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-full sm:w-auto h-12 px-6 shrink-0 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" /> New Topic
          </Button>
        </div>
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
            {topics.map((topic, index) => (
              <motion.div
                key={topic._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/topics/${topic._id}`)}
                className="glass-card glow-hover rounded-xl p-6 cursor-pointer flex flex-col group h-full border-border/60 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <h3 className="font-serif text-xl text-foreground font-medium leading-tight line-clamp-2">{topic.title}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(topic._id); setIsDeleteDialogOpen(true); }}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                    {topic.notes ? topic.notes.substring(0, 100) + '...' : 'No notes written yet. Start gathering study materials.'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium bg-card border border-border px-2 py-1 rounded-md text-muted-foreground">
                        <Sparkles className="w-3 h-3 text-primary" /> {topic.flashcardsCount || Array.isArray(topic.flashcards) && topic.flashcards.length || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium bg-card border border-border px-2 py-1 rounded-md text-muted-foreground">
                        <Brain className="w-3 h-3 text-gold" /> {topic.quizzesCount || Array.isArray(topic.quizzes) && topic.quizzes.length || 0}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:underline">
                      Study <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
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
