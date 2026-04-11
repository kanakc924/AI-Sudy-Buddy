'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  updateNotes, 
  generateFlashcards, 
  generateQuiz, 
  generateSummary, 
  generateFromImage, 
  getFlashcards, 
  getQuizzes, 
  updateFlashcard, 
  deleteFlashcard, 
  updateQuiz, 
  deleteQuiz, 
  deleteSourceMaterial 
} from '@/services/api'
import { Flashcard, QuizQuestion } from '@/types'

export function useTopicDetail(topicId: string, updateAiUsage: (usage: number) => void) {
  const router = useRouter()
  const [topic, setTopic] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [quizCount, setQuizCount] = useState(10)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [activeGen, setActiveGen] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [aiUsage, setAiUsage] = useState({ count: 0, max: 200 })
  const [isMounted, setIsMounted] = useState(false)
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null)
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)

  const [extractedText, setExtractedText] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isRegenConfirmOpen, setIsRegenConfirmOpen] = useState(false)
  const [regenType, setRegenType] = useState<'flashcards' | 'quiz' | 'summary' | null>(null)

  const appendExtractedText = (text: string, header: string, updatedTopic?: any) => {
    setExtractedText(prev => {
      const separator = prev ? '\n\n' : ''
      return `${prev}${separator}### ${header}\n\n${text}`
    })
    if (updatedTopic) setTopic(updatedTopic)
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsMounted(true)
      try {
        const topicRes = await fetch(`/api/topics/${topicId}`)
        if (!topicRes.ok) throw new Error('Failed to fetch')
        const topicJson = await topicRes.json()
        setTopic(topicJson.data)
        setNotes(topicJson.data.notes || '')

        const fcRes = await getFlashcards(topicId)
        if (fcRes.success) setFlashcards(fcRes.data || [])

        const qRes = await getQuizzes(topicId)
        if (qRes.success && qRes.data?.length > 0) {
          const latestQuiz = qRes.data[qRes.data.length - 1]
          setQuizId(latestQuiz._id)
          setQuizzes(latestQuiz.questions || [])
        }

        const sRes = await fetch(`/api/sessions?topicId=${topicId}`)
        if (sRes.ok) {
          const sJson = await sRes.json()
          setSessions(sJson.data || [])
        }

        const statsRes = await fetch('/api/sessions/stats')
        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          if (statsJson.data?.aiUsage) setAiUsage(statsJson.data.aiUsage)
        }
      } catch (err) {
        toast.error('Failed to load topic details')
      } finally {
        setIsLoadingSessions(false)
      }
    }
    fetchData()
  }, [topicId])

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNotes(val)
    setSaveStatus('saving')
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNotes(topicId, val)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (err) {
        toast.error('Failed to save notes')
        setSaveStatus('idle')
      }
    }, 2000)
  }

  const handleGenerate = async (type: 'flashcards' | 'quiz' | 'summary', replace: boolean = false) => {
    if (rateLimited) {
      toast.warning('Please wait before generating again.', { icon: '⏳' })
      return
    }
    
    setActiveGen(type)
    try {
      let res
      if (type === 'flashcards') res = await generateFlashcards(topicId, replace)
      else if (type === 'quiz') res = await generateQuiz(topicId, quizCount, replace)
      else if (type === 'summary') res = await generateSummary(topicId)
      
      if (res?._usage) {
        updateAiUsage(res._usage.limit - res._usage.remaining)
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`, { icon: '✅' })
      router.push(`/topics/${topicId}/${type === 'summary' ? 'summary' : type === 'flashcards' ? 'flashcards' : 'quiz'}`)
    } catch (err: any) {
      const code = err?.code || ''
      const message = err?.error || err?.message || 'Something went wrong'

      if (code === 'AI_RATE_LIMITED' || err?.status === 429) {
        setRateLimited(true)
        toast.warning('AI is busy right now. Try again in 1–2 minutes.', { icon: '⚠️', duration: 8000 })
        setTimeout(() => setRateLimited(false), 120000)
      } else if (code === 'NO_CONTENT') {
        toast.error('No notes found. Please add notes or upload a file.', { icon: '📝' })
      } else if (code === 'UNAUTHORIZED') {
        toast.error('Session expired.', { icon: '🔒' })
        router.push('/login')
      } else {
        toast.error(message, { icon: '❌' })
      }
    } finally {
      setActiveGen(null)
    }
  }

  const saveExtractedAsNotes = async () => {
    const combined = notes ? `${notes}\n\n${extractedText}` : extractedText
    setNotes(combined)
    setExtractedText('')
    setIsSaving(true)
    try {
      await updateNotes(topicId, combined)
      toast.success('Added to notes!')
    } catch (e) {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const saveAsSourceMaterial = async () => {
    if (!notes.trim()) {
      toast.error('Note is empty')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/topics/${topicId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notes }),
      })
      if (!res.ok) throw new Error('Failed to save material')
      const json = await res.json()
      setTopic(json.data)
      toast.success('Note formalized as source material!')
    } catch (err) {
      toast.error('Failed to formalize note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDirectImageGenerate = async (e: React.ChangeEvent<HTMLInputElement>, type: 'flashcard' | 'quiz') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size exceeds 10MB limit')
      return
    }
    if (rateLimited) {
      toast.warning('Rate limit active. Please wait.')
      return
    }

    setActiveGen(`image-${type}`)
    try {
      const res = await generateFromImage(topicId, type, file)
      if (res?._usage) updateAiUsage(res._usage.limit - res._usage.remaining)
      toast.success(`${type === 'flashcard' ? 'Flashcards' : 'Quiz'} generated from image!`, { icon: '🖼️' })
      router.push(`/topics/${topicId}/${type === 'flashcard' ? 'flashcards' : 'quiz'}`)
    } catch (err: any) {
      const code = err?.code || ''
      const message = err?.error || err?.message || 'Something went wrong'
      if (code === 'AI_RATE_LIMITED' || err?.status === 429) {
        setRateLimited(true)
        toast.warning('AI is busy right now.', { icon: '⚠️', duration: 8000 })
        setTimeout(() => setRateLimited(false), 120000)
      } else {
        toast.error(message, { icon: '❌' })
      }
    } finally {
      setActiveGen(null)
      e.target.value = ''
    }
  }

  const handleSaveFlashcard = async (data: { question: string; answer: string }) => {
    if (!selectedFlashcard) return
    try {
      await updateFlashcard(selectedFlashcard.id, data)
      setFlashcards(prev => prev.map(f => f.id === selectedFlashcard.id ? { ...f, ...data } : f))
      toast.success('Flashcard updated')
    } catch (err) {
      toast.error('Failed to update flashcard')
    }
  }

  const handleDeleteFlashcard = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return
    try {
      await deleteFlashcard(id.toString())
      setFlashcards(prev => prev.filter(f => f.id !== id))
      toast.success('Flashcard deleted')
    } catch (err) {
      toast.error('Failed to delete flashcard')
    }
  }

  const handleSaveQuizQuestion = async (data: { question: string; options: string[]; correctAnswer: string }) => {
    if (!quizId || !selectedQuestion) return
    try {
      const updatedQuestions = quizzes.map(q => q.id === selectedQuestion.id ? { ...q, ...data } : q)
      await updateQuiz(quizId, { questions: updatedQuestions })
      setQuizzes(updatedQuestions)
      toast.success('Question updated')
    } catch (err) {
      toast.error('Failed to update question')
    }
  }

  const handleDeleteQuizQuestion = async (id: string | number) => {
    if (!quizId || !confirm('Are you sure you want to delete this question?')) return
    try {
      const updatedQuestions = quizzes.filter(q => q.id !== id)
      await updateQuiz(quizId, { questions: updatedQuestions })
      setQuizzes(updatedQuestions)
      toast.success('Question deleted')
    } catch (err) {
      toast.error('Failed to delete question')
    }
  }

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return
    setIsDeleting(true)
    try {
      const res = await deleteSourceMaterial(topicId, materialToDelete._id)
      if (res.success) {
        setTopic(res.data)
        toast.success('File deleted successfully.')
        setIsDeleteDialogOpen(false)
        setMaterialToDelete(null)
      }
    } catch (err) {
      toast.error('Failed to delete material')
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    topic, setTopic,
    notes, handleNotesChange,
    isSaving, saveAsSourceMaterial,
    saveStatus,
    activeGen, setActiveGen,
    rateLimited,
    flashcards, setFlashcards,
    quizzes, setQuizzes,
    sessions,
    isLoadingSessions,
    selectedFlashcard, setSelectedFlashcard,
    isFlashcardModalOpen, setIsFlashcardModalOpen,
    selectedQuestion, setSelectedQuestion,
    isQuizModalOpen, setIsQuizModalOpen,
    extractedText, setExtractedText, 
    appendExtractedText,
    saveExtractedAsNotes,
    selectedMaterial, setSelectedMaterial,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    materialToDelete, setMaterialToDelete,
    isDeleting,
    handleDeleteMaterial,
    isRegenConfirmOpen, setIsRegenConfirmOpen,
    regenType, setRegenType,
    handleGenerate,
    handleDirectImageGenerate,
    handleSaveFlashcard,
    handleDeleteFlashcard,
    handleSaveQuizQuestion,
    handleDeleteQuizQuestion,
    isMounted
  }
}
