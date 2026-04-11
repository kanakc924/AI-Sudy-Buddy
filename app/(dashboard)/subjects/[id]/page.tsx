'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Brain, Plus, BookOpen, Calendar, Award } from 'lucide-react'
import { getTopics, createTopic, getSubjects, deleteTopic, updateTopic } from '@/services/api'
import { toast } from 'sonner'

import { 
  TopicCard, 
  PageHeader, 
  EmptyState, 
  DeleteConfirmDialog, 
  FormDialog, 
  ResourceFormFields,
  PrimaryButton,
  StatCard,
  GridSkeleton
} from '@/components/common'

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Topic Data
  const [name, setName] = useState('')
  const [editName, setEditName] = useState('')
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const subs = await getSubjects()
      const subject = subs.data.find((s: any) => s._id === subjectId)
      if (subject) setSubjectTitle(subject.title)
      else setSubjectTitle('Unknown Subject')

      const res = await getTopics(subjectId)
      setTopics(res.data)

      const sRes = await fetch(`/api/sessions?subjectId=${subjectId}`)
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
    if (!activeTopicId) return
    setIsSubmitting(true)
    try {
      await deleteTopic(activeTopicId)
      toast.success('Topic deleted')
      setIsDeleteDialogOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete')
    } finally {
      setIsSubmitting(false)
      setActiveTopicId(null)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim() || !activeTopicId) return

    setIsSubmitting(true)
    try {
      await updateTopic(activeTopicId, { title: editName })
      toast.success('Topic updated')
      setEditName('')
      setActiveTopicId(null)
      setIsEditModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update topic')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = useMemo(() => {
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
      { label: 'Mastery', value: `${totalMastery}%`, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { label: 'Last Activity', value: lastActivity, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ]
  }, [topics.length, sessions])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title={subjectTitle}
        subtitle="Track your progress and access all associated topics"
        backHref="/dashboard"
        backLabel="Subjects"
      >
        <PrimaryButton onClick={() => setIsModalOpen(true)} icon={Plus}>
          New Topic
        </PrimaryButton>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <StatCard 
            key={i}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            delay={i * 0.05}
          />
        ))}
      </div>

      {loading ? (
        <GridSkeleton />
      ) : topics.length === 0 ? (
        <EmptyState 
          variant="topics"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {topics.map((topic, index) => {
              const topicSessions = sessions.filter(s => s.topicId?._id === topic._id || s.topicId === topic._id);
              const mastery = topicSessions.length > 0 
                ? Math.round(topicSessions.reduce((acc, s) => acc + s.score, 0) / topicSessions.length)
                : 0;
              
              return (
                <TopicCard
                  key={topic._id || index}
                  topic={topic}
                  mastery={mastery}
                  onClick={() => router.push(`/topics/${topic._id}`)}
                  onEdit={(e) => {
                    e.stopPropagation();
                    setEditName(topic.title);
                    setActiveTopicId(topic._id);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    setActiveTopicId(topic._id);
                    setIsDeleteDialogOpen(true);
                  }}
                  delay={index * 0.05}
                />
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <FormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="New Topic"
        description="Create a new topic to organize specific notes and study tools."
        onSubmit={handleCreate}
        loading={isSubmitting}
        submitLabel="Create Topic"
      >
        <ResourceFormFields 
          name={name}
          setName={setName}
          showDescription={false}
          namePlaceholder="e.g. Structure of Mitochondria"
        />
      </FormDialog>

      {/* Rename Modal */}
      <FormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Rename Topic"
        description="Give your topic a new name."
        onSubmit={handleEdit}
        loading={isSubmitting}
        submitLabel="Save Changes"
      >
        <ResourceFormFields 
          name={editName}
          setName={setEditName}
          showDescription={false}
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        loading={isSubmitting}
        title="Delete Topic?"
        description="This will permanently delete this topic and all its flashcards, quizzes, and notes. This cannot be undone."
      />
    </div>
  )
}
