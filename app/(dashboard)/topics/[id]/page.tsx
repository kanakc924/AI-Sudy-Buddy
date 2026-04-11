'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { Brain, FileText, Sparkles, ChevronLeft, Loader2, AlertTriangle, Play, Save, BarChart3, Image as ImageIcon, MessageSquare, Plus, Trash2, Target, Upload, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { updateNotes, generateFlashcards, generateQuiz, generateSummary, generateFromImage, getFlashcards, getQuizzes, updateFlashcard, deleteFlashcard, updateQuiz, deleteQuiz, deleteSourceMaterial } from '@/services/api'
import { PdfUpload } from '@/components/pdf-upload'
import { ImageUpload } from '@/components/image-upload'
import { DiagramExplainer } from '@/components/diagram-explainer'
import { FlashcardPreview } from '@/components/topics/FlashcardPreview'
import { QuizPreview } from '@/components/topics/QuizPreview'
import { FlashcardModal } from '@/components/topics/FlashcardModal'
import { QuizQuestionModal } from '@/components/topics/QuizQuestionModal'
import { ActivityHeatmap } from '@/components/topics/ActivityHeatmap'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ReactMarkdown from 'react-markdown'
import { Flashcard, QuizQuestion } from '@/types'

import { EmptyState } from '@/components/ui/empty-state'

export default function TopicDetailPage() {
  const { user, updateAiUsage } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const topicId = params.id as string
  const defaultTab = searchParams.get('tab') || 'notes'

  const [topic, setTopic] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'>('idle')
  const [quizCount, setQuizCount] = useState(10)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Generation state
  const [activeGen, setActiveGen] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [aiUsage, setAiUsage] = useState({ count: 0, max: 200 })
  const [isMounted, setIsMounted] = useState(false)
  
  // Content state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  
  // Edit state
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null)
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)

  // Image extraction viewing
  const [extractedText, setExtractedText] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Regeneration Confirmation
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
    // Fetch topic
    const fetchData = async () => {
      setIsMounted(true)
      try {
        const topicRes = await fetch(`/api/topics/${topicId}`)
        if (!topicRes.ok) throw new Error('Failed to fetch')
        const topicJson = await topicRes.json()
        setTopic(topicJson.data)
        setNotes(topicJson.data.notes || '')

        // Fetch Flashcards
        const fcRes = await getFlashcards(topicId)
        if (fcRes.success) {
          setFlashcards(fcRes.data || [])
        }

        // Fetch Quizzes
        const qRes = await getQuizzes(topicId)
        if (qRes.success && qRes.data?.length > 0) {
          const latestQuiz = qRes.data[qRes.data.length - 1]
          setQuizId(latestQuiz._id)
          setQuizzes(latestQuiz.questions || [])
        }

        // Fetch Sessions
        const sRes = await fetch(`/api/sessions?topicId=${topicId}`)
        if (sRes.ok) {
          const sJson = await sRes.json()
          setSessions(sJson.data || [])
        }

        // Fetch AI Usage
        const statsRes = await fetch('/api/sessions/stats')
        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          if (statsJson.data?.aiUsage) {
            setAiUsage(statsJson.data.aiUsage)
          }
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
      
      // Update global AI usage in sidebar instantly via headers
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
        toast.warning('AI is busy right now. All free models are at capacity. Try again in 1–2 minutes.', { icon: '⚠️', duration: 8000 })
        setTimeout(() => setRateLimited(false), 120000) // 2 min cooldown
      } else if (code === 'NO_CONTENT') {
        toast.error('No notes found. Please add notes or upload a file before generating.', { icon: '📝' })
      } else if (code === 'UNAUTHORIZED') {
        toast.error('Session expired. Please log in again.', { icon: '🔒' })
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
        headers: {
          'Content-Type': 'application/json',
        },
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

    // Validate file size (10MB)
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
      
      // Update global AI usage in sidebar instantly
      if (res?._usage) {
        updateAiUsage(res._usage.limit - res._usage.remaining)
      }
      
      toast.success(`${type === 'flashcard' ? 'Flashcards' : 'Quiz'} generated from image!`, { icon: '🖼️' })
      router.push(`/topics/${topicId}/${type === 'flashcard' ? 'flashcards' : 'quiz'}`)
    } catch (err: any) {
      const code = err?.code || ''
      const message = err?.error || err?.message || 'Something went wrong'

      if (code === 'AI_RATE_LIMITED' || err?.status === 429) {
        setRateLimited(true)
        toast.warning('AI is busy right now. All free models are at capacity. Try again in 1–2 minutes.', { icon: '⚠️', duration: 8000 })
        setTimeout(() => setRateLimited(false), 120000) // 2 min cooldown
      } else {
        toast.error(message, { icon: '❌' })
      }
    } finally {
      setActiveGen(null)
      e.target.value = '' // reset input
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

  // Logic for Study Activity & History
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Get sessions from current week
  const getWeeklySessions = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    startOfWeek.setHours(0, 0, 0, 0);
    return sessions.filter(s => new Date(s.completedAt) >= startOfWeek);
  }

  const weeklySessions = getWeeklySessions();
  const weeklyProgress = Math.min(Math.round((weeklySessions.length / 7) * 100), 100);

  // Group sessions by day for the bar chart
  const studyTimeData = days.map(day => {
    const count = sessions.filter(s => {
      const d = new Date(s.completedAt);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      return dayName === day;
    }).length;
    
    // Average score for that day
    const daySessions = sessions.filter(s => {
      const d = new Date(s.completedAt);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      return dayName === day;
    });
    const avgScore = daySessions.length > 0 
      ? Math.round(daySessions.reduce((acc, s) => acc + s.score, 0) / daySessions.length)
      : 0;

    return { day, count, score: avgScore };
  });


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push(topic?.subjectId?._id ? `/subjects/${topic.subjectId._id}` : (topic?.subjectId ? `/subjects/${topic.subjectId}` : '/dashboard'))} className="rounded-xl border-border bg-card">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              Subject: <span className="text-primary italic">{topic?.subjectId?.title || 'JavaScript Fundamentals'}</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Topic: {topic?.title || 'Loading...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">


        </div>
      </div>



      <div className="pt-8 space-y-8">
        <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-card rounded-xl border border-border/50 p-1 mb-6 shadow-sm">
          <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Notes</TabsTrigger>
          <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Upload</TabsTrigger>
          <TabsTrigger value="generate" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="relative outline-none">
          <div className="relative">
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Start typing your notes here..."
              className="w-full min-h-[400px] lg:min-h-[500px] bg-card border border-border rounded-xl p-6 md:p-8 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm leading-relaxed text-base"
            />
            <div className="absolute top-4 right-4 flex items-center gap-3 no-print">
              {saveStatus === 'saving' && <span className="text-xs text-muted-foreground flex items-center animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>}
              {saveStatus === 'saved' && <span className="text-xs text-[#4CAF50] flex items-center">Saved ✓</span>}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={saveAsSourceMaterial}
                disabled={isSaving}
                className="rounded-lg h-8 px-3 text-xs bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
              >
                {isSaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Save as Source Material
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Document Upload */}
            <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center gap-4 border-border group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 h-full">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-200">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl mb-1 group-hover:text-primary transition-colors duration-200">Document Upload</h2>
                <p className="text-xs text-muted-foreground px-2">Click or drag PDF / TXT to upload and extract text.</p>
              </div>
              <div className="w-full mt-auto">
                <PdfUpload topicId={topicId} onExtracted={(text, updatedTopic) => 
                  appendExtractedText(text, 'Extracted Text from PDF', updatedTopic)
                } />
              </div>
            </div>

            {/* Image Extraction */}
            <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center gap-4 border-border group cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-200 h-full">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-200">
                <ImageIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl mb-1 group-hover:text-blue-500 transition-colors duration-200">Image Extraction</h2>
                <p className="text-xs text-muted-foreground px-2">Upload textbook photos to instantly convert to text.</p>
              </div>
              <div className="w-full mt-auto">
                <ImageUpload topicId={topicId} onExtracted={(text, updatedTopic) => 
                  appendExtractedText(text, 'Extracted Text from Image', updatedTopic)
                } />
              </div>
            </div>

            {/* Diagram Explainer */}
            <div className="glass-card rounded-xl p-6 flex flex-col items-center text-center gap-4 border-border group cursor-pointer hover:border-[#4CAF50]/50 hover:bg-[#4CAF50]/5 transition-all duration-200 h-full">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#4CAF50]/10 border border-[#4CAF50]/20 group-hover:scale-110 group-hover:bg-[#4CAF50]/20 transition-all duration-200">
                <Upload className="w-6 h-6 text-[#4CAF50]" />
              </div>
              <div>
                <h2 className="font-serif text-xl mb-1 group-hover:text-[#4CAF50] transition-colors duration-200">Explain a Diagram</h2>
                <p className="text-xs text-muted-foreground px-2">Upload a flowchart or chart — AI generates a step-by-step walkthrough.</p>
              </div>
              <div className="w-full mt-auto">
                <DiagramExplainer topicId={topicId} onExtracted={(text, updatedTopic) => 
                  appendExtractedText(text, 'Diagram Explanation', updatedTopic)
                } />
              </div>
            </div>
          </div>
          
          {extractedText && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 border-primary/30 mt-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl text-primary flex items-center gap-2"><Sparkles className="w-5 h-5" /> Extracted Text</h3>
                <Button size="sm" onClick={saveExtractedAsNotes} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save to Notes
                </Button>
              </div>
              <textarea
                value={extractedText}
                onChange={e => setExtractedText(e.target.value)}
                className="w-full min-h-[400px] bg-muted/20 border border-border/50 rounded-xl p-6 text-base leading-[1.6] text-foreground resize-y focus:outline-none focus:border-primary/50 transition-all font-sans"
                placeholder="Extracted text will appear here..."
              />
            </motion.div>
          )}

          {topic?.sourceImages && topic.sourceImages.length > 0 && (
            <div className="pt-8 border-t border-border/50 mt-8 space-y-4">
              <h3 className="font-serif text-xl border-b border-border pb-2 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" /> Uploaded Source Images
              </h3>
              <p className="text-sm text-muted-foreground">Original pages and diagrams uploaded to this topic.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {topic.sourceImages.map((img: any, i: number) => (
                  <a key={img.publicId} href={img.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-3/4 rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-colors group">
                    <img src={img.url} alt={`Upload ${i + 1}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/90 to-transparent p-3 pt-6 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold tracking-widest uppercase">{new Date(img.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              { id: 'flashcards', title: 'Flashcards', icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', desc: 'Create study set for spaced repetition' },
              { id: 'quiz', title: 'Quiz', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Test your understanding with questions' },
              { id: 'summary', title: 'Summary', icon: FileText, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/20', desc: 'Get a clean markdown summary' }
            ].map(card => (
              <div key={card.id} className={cn(
                "glass-card rounded-xl p-6 flex flex-col gap-4 border-border transition-all duration-300 cursor-pointer",
                "hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(124,92,252,0.2)] hover:-translate-y-1",
                rateLimited ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-200",
                  card.bg, card.border
                )}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-foreground mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </div>
                
                {card.id === 'quiz' && (
                  <div className="flex items-center gap-2 mb-2 no-print">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Standard Set:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500 bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] font-bold">10 Questions</span>
                  </div>
                )}
                
                <div className="mt-auto pt-4 flex gap-2">
                  <Button 
                    className="flex-1 rounded-xl font-medium" 
                    variant="default"
                    disabled={activeGen !== null || rateLimited}
                    onClick={() => {
                      const hasExisting = 
                        (card.id === 'flashcards' && topic?.flashcardsCount > 0) || 
                        (card.id === 'quiz' && topic?.quizCount > 0) ||
                        (card.id === 'summary' && topic?.summary);
                      
                      if (hasExisting) {
                        setRegenType(card.id as any);
                        setIsRegenConfirmOpen(true);
                      } else {
                        handleGenerate(card.id as any, false);
                      }
                    }}
                  >
                    {activeGen === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                      ((card.id === 'flashcards' && topic?.flashcardsCount > 0) || 
                       (card.id === 'quiz' && topic?.quizCount > 0) || 
                       (card.id === 'summary' && topic?.summary)) ? 'Regenerate' : 'Generate'}
                  </Button>
                  <Link 
                    href={`/topics/${topicId}/${card.id === 'summary' ? 'summary' : card.id === 'flashcards' ? 'flashcards' : 'quiz'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button 
                      variant="outline" 
                      className="rounded-xl px-2 border-border hover:bg-card h-full"
                      title={`View existing ${card.title}`}
                    >
                      <Play className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {rateLimited && (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <span className="text-xl shrink-0">⏳</span>
              <div>
                <p className="text-sm font-medium text-amber-400">
                  All AI models are currently busy
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  We tried all available free models. This happens during peak hours.
                  Generate buttons will re-enable automatically in 2 minutes.
                </p>
              </div>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-border/50">
            <h3 className="font-serif text-2xl mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Direct Image Magic</h3>
            <p className="text-muted-foreground mb-6">Skip typing! Upload a photo of a textbook page or diagram and instantly get a fully formulated Quiz or Flashcard deck.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-6 border-border flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                <Brain className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-medium text-lg mb-1">Flashcards from Image</h4>
                <p className="text-sm text-muted-foreground mb-4">Extract concepts & definitions</p>
                <Button 
                  onClick={() => !activeGen && document.getElementById('direct-image-flashcard')?.click()}
                  disabled={activeGen !== null || rateLimited}
                  className="w-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {activeGen === 'image-flashcard' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select Image'}
                </Button>
                <input id="direct-image-flashcard" type="file" accept="image/*" className="hidden" onChange={(e) => handleDirectImageGenerate(e, 'flashcard')} />
              </div>
              
              <div className="glass-card rounded-xl p-6 border-border flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                <Brain className="w-8 h-8 text-blue-500 mb-3" />
                <h4 className="font-medium text-lg mb-1">Quiz from Image</h4>
                <p className="text-sm text-muted-foreground mb-4">Create comprehensive MCQs</p>
                <Button 
                  onClick={() => !activeGen && document.getElementById('direct-image-quiz')?.click()}
                  disabled={activeGen !== null || rateLimited}
                  className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                >
                  {activeGen === 'image-quiz' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select Image'}
                </Button>
                <input id="direct-image-quiz" type="file" accept="image/*" className="hidden" onChange={(e) => handleDirectImageGenerate(e, 'quiz')} />
              </div>
            </div>
          </div>

          {/* Moved Preview Section in Generate Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16 pt-16 border-t border-border/50">
            {flashcards.length > 0 && (
              <FlashcardPreview 
                flashcards={flashcards} 
                topicId={topicId} 
                onAddClick={() => {}} 
                onEditClick={(card) => { setSelectedFlashcard(card); setIsFlashcardModalOpen(true); }}
                onDeleteClick={handleDeleteFlashcard}
              />
            )}
            {quizzes.length > 0 && (
              <QuizPreview 
                questions={quizzes} 
                topicId={topicId} 
                onAddClick={() => {}} 
                onEditClick={(q) => { setSelectedQuestion(q); setIsQuizModalOpen(true); }}
                onDeleteClick={handleDeleteQuizQuestion}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      </div>



      <div className="mt-12">
        <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="pb-6 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Study Library & Source Materials
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-card">
            {topic?.sourceMaterials && topic.sourceMaterials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...topic.sourceMaterials]
                  .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                  .map((mat: any, idx: number) => {
                    const isPdf = mat.type === 'pdf' || mat.fileExtension === 'pdf';
                    const isDiagram = mat.type === 'diagram';
                    const isNote = mat.type === 'note' || mat.type === 'text';

                    return (
                      <motion.div 
                        key={idx}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedMaterial(mat)}
                        className="group relative flex flex-col p-6 bg-muted/10 border border-border/50 rounded-2xl cursor-pointer transition-all hover:border-primary/50 hover:shadow-primary/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl ${
                            isPdf ? 'bg-red-500/10 text-red-400' : 
                            isDiagram ? 'bg-emerald-500/10 text-emerald-400' : 
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {isPdf ? <FileText className="w-6 h-6" /> : 
                             isDiagram ? <ImageIcon className="w-6 h-6" /> : 
                             <MessageSquare className="w-6 h-6" />}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-full">
                              {mat.fileExtension || mat.type}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMaterialToDelete(mat);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group/trash"
                              title="Delete material"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                            </button>
                          </div>
                        </div>
                        
                        <h4 className="font-medium text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {mat.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Saved: {new Date(mat.uploadedAt).toLocaleDateString()}
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-border/10 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Click to View</span>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState 
                icon={FileText}
                title="Your library is empty"
                description="Upload sources like PDFs or images to build your study library. This helps the AI generate more accurate content."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Viewer Modal */}
      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-border bg-card shadow-2xl">
          <DialogHeader className="p-8 border-b border-border/50 bg-muted/20 flex-row items-center justify-between shrink-0 space-y-0">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                selectedMaterial?.type === 'pdf' || selectedMaterial?.fileExtension === 'pdf' ? 'bg-red-500/10 text-red-400' : 
                selectedMaterial?.type === 'diagram' ? 'bg-emerald-500/10 text-emerald-400' : 
                'bg-blue-500/10 text-blue-400'
              }`}>
                {selectedMaterial?.type === 'pdf' || selectedMaterial?.fileExtension === 'pdf' ? <FileText className="w-6 h-6" /> : 
                 selectedMaterial?.type === 'diagram' ? <ImageIcon className="w-6 h-6" /> : 
                 <MessageSquare className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl text-foreground">
                  {selectedMaterial?.title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide uppercase">
                  {selectedMaterial?.fileExtension || selectedMaterial?.type} • Added on {selectedMaterial && new Date(selectedMaterial.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            {selectedMaterial?.type === 'diagram' && selectedMaterial?.url && (
              <div className="mb-12">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-4">Original Image Reference</p>
                <div className="relative rounded-2xl overflow-hidden border border-border/50 group max-w-2xl mx-auto">
                  <img src={selectedMaterial.url} alt="Source Diagram" className="w-full h-auto object-contain bg-muted/5 group-hover:scale-[1.02] transition-transform duration-500" />
                  <a href={selectedMaterial.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" className="rounded-full shadow-lg">View Full Resolution</Button>
                  </a>
                </div>
                <hr className="mt-12 border-border/30" />
              </div>
            )}

            <div className="prose dark:prose-invert prose-slate max-w-none 
              prose-headings:font-serif prose-headings:font-bold prose-headings:text-foreground
              prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:text-lg
              prose-strong:text-primary prose-strong:font-bold
              prose-code:bg-muted prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
              prose-ul:my-6 prose-li:my-2 prose-li:text-foreground/90
            ">
              <ReactMarkdown>
                {selectedMaterial?.content || selectedMaterial?.extractedText || "No content found for this material."}
              </ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20 mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="text-center space-y-2">
              <DialogTitle className="font-serif text-2xl text-foreground">Delete Material?</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed px-4">
                Are you sure you want to delete <span className="text-foreground font-medium">'{materialToDelete?.title}'</span>? 
                This action will also remove any associated AI-generated insights and cannot be undone.
              </DialogDescription>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 rounded-xl border-border bg-transparent text-muted-foreground"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteMaterial}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regeneration Confirmation */}
      <AlertDialog open={isRegenConfirmOpen} onOpenChange={setIsRegenConfirmOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl">Overwriting Existing Content?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You already have {regenType} for this topic. Regenerating will permanently overwrite them with new AI-generated versions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-muted-foreground rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (regenType) handleGenerate(regenType, true);
                setIsRegenConfirmOpen(false);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
            >
              Confirm Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <hr className="border-t border-border/30 my-8" />

      <div className="grid lg:grid-cols-2 gap-8 pb-12 items-stretch">
        {/* Study Activity Section */}
        <div className="flex flex-col h-full">
          <ActivityHeatmap 
            sessions={sessions} 
            subtitle="Study consistency for this topic" 
          />
        </div>

        {/* Score History Section */}
        <div className="flex flex-col h-full">
          <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2.5 border-b border-border/50 bg-muted/20">
              <CardTitle className="font-serif text-xl font-bold flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                Score History
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 py-5 flex-1 flex flex-col">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">
                Quiz scores over time
              </p>
              {sessions.length > 0 && isMounted ? (
                <div className="h-[240px] w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studyTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis 
                        dataKey="day" 
                        stroke="var(--color-muted-foreground)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'var(--color-muted-foreground)', fontWeight: 600 }}
                      />
                      <YAxis 
                        stroke="var(--color-muted-foreground)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tick={{ fill: 'var(--color-muted-foreground)', fontWeight: 600 }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                        contentStyle={{ 
                          backgroundColor: 'var(--color-card)', 
                          borderColor: 'var(--color-border)', 
                          borderRadius: '12px', 
                          border: '1px solid var(--color-border)' 
                        }}
                        itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                        formatter={(value: any) => [`${value}%`, 'Average Score']}
                      />
                      <Bar 
                        dataKey="score" 
                        radius={[6, 6, 0, 0]} 
                        barSize={32}
                        fill="var(--color-primary)"
                      >
                        {studyTimeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.score > 0 ? 'var(--color-primary)' : 'var(--color-border)'} 
                            fillOpacity={entry.score > 0 ? 1 : 0.3}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : sessions.length > 0 && !isMounted ? (
                <div className="h-[240px] w-full bg-muted/20 animate-pulse rounded-2xl mt-auto" />
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                  <p className="text-sm font-medium">No quiz data yet.</p>
                  <p className="text-xs mt-1">Complete a quiz to see your score history.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FlashcardModal 
        open={isFlashcardModalOpen} 
        onOpenChange={setIsFlashcardModalOpen} 
        flashcard={selectedFlashcard} 
        onSave={handleSaveFlashcard} 
      />
      <QuizQuestionModal 
        open={isQuizModalOpen} 
        onOpenChange={setIsQuizModalOpen} 
        question={selectedQuestion} 
        onSave={handleSaveQuizQuestion} 
      />
    </div>
  )
}
