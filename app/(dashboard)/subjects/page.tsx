'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Pencil, Trash2, ArrowRight, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSubject, updateSubject, deleteSubject } from '@/services/api'
import { useSubjects } from '@/context/SubjectContext'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { EmptyState } from '@/components/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

const SUBJECT_COLORS = [
  '#4CAF50', '#F7DF1E', '#E91E63', '#00BCD4', 
  '#FF5722', '#7C5CFC', '#9C27B0', '#D4A853'
]

export default function SubjectsPage() {
  const router = useRouter()
  const { subjects, loading, refreshSubjects } = useSubjects()

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openCreate = () => {
    setEditingSubject(null)
    setName('')
    setDescription('')
    setIsModalOpen(true)
  }

  const openEdit = (subject: any) => {
    setEditingSubject(subject)
    setName(subject.title || '')
    setDescription(subject.description || '')
    setIsModalOpen(true)
  }

  const confirmDelete = (id: string) => {
    setDeletingSubjectId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      if (editingSubject) {
        await updateSubject(editingSubject._id, { title: name, description })
        toast.success('Subject updated')
      } else {
        await createSubject({ title: name, description })
        toast.success('Subject created')
      }
      setIsModalOpen(false)
      await refreshSubjects()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subject')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSubjectId) return
    setIsSubmitting(true)
    try {
      await deleteSubject(deletingSubjectId)
      toast.success('Subject deleted')
      setIsDeleteDialogOpen(false)
      await refreshSubjects()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setIsSubmitting(false)
      setDeletingSubjectId(null)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">My Subjects</h1>
          <p className="text-muted-foreground mt-1">Organize your learning material</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-full sm:w-auto h-12 px-6">
          <Plus className="w-5 h-5 mr-2" /> New Subject
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <LoadingSkeleton key={i} variant="subjectCard" />)}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState variant="subjects" onAction={openCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {subjects.map((subject, index) => {
              const color = subject.color || SUBJECT_COLORS[index % SUBJECT_COLORS.length]
              // Topic count would ideally come from the API, using 0 fallback
              const topicCount = subject.topicCount || 0 

              return (
                <motion.div
                  key={subject._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-6 cursor-pointer flex flex-col h-full hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(124,92,252,0.2)] hover:-translate-y-1 transition-all duration-200"
                  onClick={() => router.push(`/subjects/${subject._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl transition-transform hover:scale-110" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      <BookOpen className="w-6 h-6" style={{ color }} />
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card" onClick={() => openEdit(subject)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => confirmDelete(subject._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-serif text-xl text-foreground mb-1 line-clamp-1">{subject.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                    {subject.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center justify-between text-xs font-medium pt-4 border-t border-border/50">
                    <span className="bg-card px-2 py-1 rounded-md border border-border text-[#A0A6B8]">{topicCount} {topicCount <= 1 ? 'topic' : 'topics'}</span>
                    <span className="flex items-center gap-1 text-primary group-hover:underline">Study <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border rounded-2xl w-[95vw] max-h-[90vh] shadow-2xl opacity-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editingSubject ? 'Edit Subject' : 'New Subject'}</DialogTitle>

          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-4">
              <label className="text-sm font-medium ml-1">Subject Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Computer Science 101" 
                className="bg-card border-border h-12 px-4 rounded-xl focus:ring-primary/50"
                autoFocus
                required
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-medium ml-1">Description (Optional)</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="What is this subject about?" 
                className="w-full min-h-[100px] bg-card border border-border rounded-xl p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <DialogFooter className="pt-2 sm:justify-start">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto h-12 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingSubject ? 'Save Changes' : 'Create Subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-2xl opacity-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Are you absolutely sure?</AlertDialogTitle>

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
