'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen } from 'lucide-react'
import { createSubject, updateSubject, deleteSubject } from '@/services/api'
import { useSubjects } from '@/context/SubjectContext'
import { toast } from 'sonner'
import { SUBJECT_COLORS } from '@/lib/constants'

import { 
  SubjectCard, 
  PageHeader, 
  EmptyState, 
  DeleteConfirmDialog, 
  FormDialog, 
  ResourceFormFields,
  PrimaryButton,
  GridSkeleton
} from '@/components/common'

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full space-y-8">
      <PageHeader 
        title="My Subjects" 
        subtitle="Organize your learning material"
      >
        <PrimaryButton onClick={openCreate} icon={Plus}>
          New Subject
        </PrimaryButton>
      </PageHeader>

      {loading ? (
        <GridSkeleton />
      ) : subjects.length === 0 ? (
        <EmptyState 
          variant="subjects"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {subjects.map((subject, index) => (
              <SubjectCard
                key={subject._id || index}
                subject={subject}
                onClick={() => router.push(`/subjects/${subject._id}`)}
                onEdit={(e) => { e.stopPropagation(); openEdit(subject); }}
                onDelete={(e) => { e.stopPropagation(); confirmDelete(subject._id); }}
                delay={index * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <FormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingSubject ? 'Edit Subject' : 'New Subject'}
        onSubmit={handleSubmit}
        loading={isSubmitting}
        submitLabel={editingSubject ? 'Save Changes' : 'Create Subject'}
      >
        <ResourceFormFields 
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        loading={isSubmitting}
        title="Delete Subject?"
        description="This will permanently delete this subject and all its topics, maps, and study materials."
      />
    </div>
  )
}

