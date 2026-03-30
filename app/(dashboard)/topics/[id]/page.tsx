'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { Brain, FileText, Sparkles, ChevronLeft, Bell, Loader2, AlertTriangle, Play, Save, BarChart3, Image as ImageIcon, MessageSquare, Plus, Trash2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateNotes, generateFlashcards, generateQuiz, generateSummary, generateFromImage, getFlashcards, getQuizzes, updateFlashcard, deleteFlashcard, updateQuiz, deleteQuiz } from '@/services/api'
import { PdfUpload } from '@/components/pdf-upload'
import { ImageUpload } from '@/components/image-upload'
import { DiagramExplainer } from '@/components/diagram-explainer'
import { FlashcardPreview } from '@/components/topics/FlashcardPreview'
import { QuizPreview } from '@/components/topics/QuizPreview'
import { FlashcardModal } from '@/components/topics/FlashcardModal'
import { QuizQuestionModal } from '@/components/topics/QuizQuestionModal'
import { ActivityHeatmap } from '@/components/topics/ActivityHeatmap'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Flashcard, QuizQuestion } from '@/types'

export default function TopicDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const topicId = params.id as string

  const [topic, setTopic] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Generation state
  const [activeGen, setActiveGen] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  
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

  useEffect(() => {
    // Fetch topic
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('study_buddy_token')
        const topicRes = await fetch(`/api/topics/${topicId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
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
        const sRes = await fetch(`/api/sessions?topicId=${topicId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (sRes.ok) {
          const sJson = await sRes.json()
          setSessions(sJson.data || [])
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
      toast.warning('Rate limit active. Please wait.', { icon: '⚠️' })
      return
    }
    
    setActiveGen(type)
    try {
      if (type === 'flashcards') await generateFlashcards(topicId, replace)
      if (type === 'quiz') await generateQuiz(topicId, replace)
      if (type === 'summary') await generateSummary(topicId)
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated!`, { icon: '✅' })
      router.push(`/topics/${topicId}/${type === 'summary' ? 'summary' : type === 'flashcards' ? 'flashcards' : 'quiz'}`)
    } catch (err: any) {
      if (err.status === 429 || err?.message?.includes('429')) {
        setRateLimited(true)
        toast.warning('Rate limit reached. Try again in 60s', { icon: '⚠️', duration: 60000 })
        setTimeout(() => setRateLimited(false), 60000)
      } else {
        toast.error(`Generation failed: ${err.message || 'Unknown error'}`, { icon: '❌' })
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

  const handleDirectImageGenerate = async (e: React.ChangeEvent<HTMLInputElement>, type: 'flashcard' | 'quiz') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (rateLimited) {
      toast.warning('Rate limit active. Please wait.')
      return
    }

    setActiveGen(`image-${type}`)
    try {
      await generateFromImage(topicId, type, file)
      toast.success(`${type === 'flashcard' ? 'Flashcards' : 'Quiz'} generated from image!`, { icon: '🖼️' })
      router.push(`/topics/${topicId}/${type === 'flashcard' ? 'flashcards' : 'quiz'}`)
    } catch (err: any) {
      if (err.status === 429 || err?.message?.includes('429')) {
        setRateLimited(true)
        toast.warning('Rate limit reached. Try again in 60s', { duration: 60000 })
        setTimeout(() => setRateLimited(false), 60000)
      } else {
        toast.error(`Failed: ${err.message || 'Unknown error'}`)
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
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl border-border bg-card">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              Subject: <span className="text-primary italic">{topic?.subjectId?.title || 'JavaScript Fundamentals'}</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Topic: {topic?.title || 'Loading...'}</p>
          </div>
        </div>
        <Button variant="outline" size="icon" className="rounded-xl border-border bg-card relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* AI Generation Hub Area handled in tabs below */}
        </div>
      </div>

      <div className="pt-8 space-y-8">
        <Tabs defaultValue="notes" className="w-full">
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
            <div className="absolute top-4 right-4 flex items-center">
              {saveStatus === 'saving' && <span className="text-xs text-muted-foreground flex items-center animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>}
              {saveStatus === 'saved' && <span className="text-xs text-[#4CAF50] flex items-center">Saved ✓</span>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="outline-none space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="font-serif text-xl border-b border-border pb-2">Document Upload</h2>
              <PdfUpload topicId={topicId} onExtracted={(text) => setExtractedText(text)} />
            </div>
            <div className="space-y-4">
              <h2 className="font-serif text-xl border-b border-border pb-2">Image Extraction (AI)</h2>
              <ImageUpload topicId={topicId} onExtracted={(text) => setExtractedText(text)} />
            </div>
          </div>

          <div className="pt-6 border-t border-border/50">
            <div className="space-y-4 max-w-2xl">
              <h2 className="font-serif text-xl border-b border-border pb-2">
                Explain a Diagram
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload a flowchart, diagram, or chart — AI generates a full step-by-step walkthrough.
              </p>
              <DiagramExplainer topicId={topicId} />
            </div>
          </div>
          
          {extractedText && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 border-primary/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl text-primary flex items-center gap-2"><Sparkles className="w-5 h-5" /> Extracted Text</h3>
                <Button size="sm" onClick={saveExtractedAsNotes} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save to Notes
                </Button>
              </div>
              <textarea
                value={extractedText}
                onChange={e => setExtractedText(e.target.value)}
                className="w-full min-h-[300px] bg-background/50 border border-border rounded-lg p-4 text-sm text-foreground resize-y focus:outline-none focus:border-primary"
              />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              { id: 'flashcards', title: 'Flashcards', icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', desc: 'Create study set for spaced repetition' },
              { id: 'quiz', title: 'Quiz', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Test your understanding with questions' },
              { id: 'summary', title: 'Summary', icon: FileText, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/20', desc: 'Get a clean markdown summary' }
            ].map(card => (
              <div key={card.id} className={`glass-card rounded-xl p-6 flex flex-col gap-4 border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${rateLimited ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.border} border`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-foreground mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </div>
                
                <div className="mt-auto pt-4 flex gap-2">
                  <Button 
                    className="flex-1 rounded-xl font-medium" 
                    variant={card.id === 'flashcards' ? 'default' : 'secondary'}
                    disabled={activeGen !== null || rateLimited}
                    onClick={() => {
                      const hasExisting = 
                        (card.id === 'flashcards' && topic?.flashcardsCount > 0) || 
                        (card.id === 'quiz' && topic?.quizCount > 0) ||
                        (card.id === 'summary' && topic?.summary);
                      handleGenerate(card.id as any, hasExisting);
                    }}
                  >
                    {activeGen === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                      ((card.id === 'flashcards' && topic?.flashcardsCount > 0) || 
                       (card.id === 'quiz' && topic?.quizCount > 0) || 
                       (card.id === 'summary' && topic?.summary)) ? 'Regenerate' : 'Generate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl px-2 border-border hover:bg-card"
                    title={`View existing ${card.title}`}
                    onClick={() => router.push(`/topics/${topicId}/${card.id === 'summary' ? 'summary' : card.id === 'flashcards' ? 'flashcards' : 'quiz'}`)}
                  >
                    <Play className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {rateLimited && (
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-500">Rate Limit Reached</h4>
                <p className="text-sm text-amber-500/80 mt-1">Our AI providers are currently limiting requests. Please wait a minute before generating new content. You can still study existing materials.</p>
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
        </TabsContent>
      </Tabs>

      </div>

      {/* AI Generation Hub Section */}
      <Card className="border-border bg-linear-to-br from-[#8F8DF2]/5 to-transparent rounded-3xl shadow-sm my-8">
        <CardContent className="p-8 space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold">AI Generation Hub</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Enhance your study material instantly with our advanced AI tools.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <span className="text-xl font-bold">15 / 20</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Daily Requests</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <Button 
              onClick={() => handleGenerate('flashcards')}
              disabled={activeGen !== null}
              className="h-auto py-6 flex-col gap-3 rounded-2xl border-border bg-card hover:bg-muted text-foreground font-bold"
            >
              <div className="p-3 bg-primary/10 rounded-xl">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs">Create <br /> Flashcards</span>
            </Button>
            
            <Button 
              onClick={() => handleGenerate('summary')}
              disabled={activeGen !== null}
              className="h-auto py-6 flex-col gap-3 rounded-2xl border-border bg-card hover:bg-muted text-foreground font-bold"
            >
              <div className="p-3 bg-mint/10 rounded-xl">
                <FileText className="w-6 h-6 text-mint" />
              </div>
              <span className="text-xs">Generate <br /> Summary</span>
            </Button>

            <Button 
              onClick={() => document.getElementById('hub-image-input-bottom')?.click()}
              disabled={activeGen !== null}
              className="h-auto py-6 flex-col gap-3 rounded-2xl border-border bg-card hover:bg-muted text-foreground font-bold"
            >
              <div className="p-3 bg-blue/10 rounded-xl">
                <ImageIcon className="w-6 h-6 text-blue" />
              </div>
              <span className="text-xs">Extract <br /> from Image</span>
            </Button>
            <input id="hub-image-input-bottom" type="file" accept="image/*" className="hidden" onChange={(e) => handleDirectImageGenerate(e, 'flashcard')} />
          </div>

          <Progress value={(15/20)*100} className="h-2 rounded-full bg-muted [&>div]:bg-primary" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pb-12">
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

      <hr className="border-t border-border/30 my-8" />

      <div className="grid lg:grid-cols-2 gap-8 pb-12">
        {/* Study Activity Section */}
        <ActivityHeatmap 
          sessions={sessions} 
          subtitle="Your study consistency for this topic" 
        />

        {/* Score & Session History Section */}
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Quiz scores and sessions over time
          </p>
          <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="font-serif text-lg font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-mint" />
                Score & Session History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              {sessions.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studyTimeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis 
                        dataKey="day" 
                        stroke="var(--muted-foreground)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontWeight: 600 }}
                      />
                      <YAxis 
                        stroke="var(--muted-foreground)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontWeight: 600 }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[6, 6, 0, 0]} 
                        barSize={24}
                      >
                        {studyTimeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.count > 0 ? 'var(--primary)' : 'var(--muted)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p className="text-sm font-medium">No sessions yet for this topic.</p>
                  <p className="text-xs mt-1">Complete a flashcard or quiz session to see your history here.</p>
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
