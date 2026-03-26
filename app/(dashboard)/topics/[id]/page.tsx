'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, FileText, Sparkles, ChevronRight, Loader2, AlertTriangle, Play, Save } from 'lucide-react'
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
import { Flashcard, QuizQuestion } from '@/types'

export default function TopicDetailPage() {
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
  
  // Edit state
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null)
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)

  // Image extraction viewing
  const [extractedText, setExtractedText] = useState('')

  useEffect(() => {
    // Fetch topic via specific API route (assuming standard GET /api/topics/[id] exists)
    // Or fallback to standard authenticated fetch
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
      } catch (err) {
        toast.error('Failed to load topic details')
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
    }, 700)
  }

  const handleGenerate = async (type: 'flashcards' | 'quiz' | 'summary', replace: boolean = false) => {
    if (rateLimited) {
      toast.warning('Rate limit active. Please wait.', { icon: '⚠️' })
      return
    }
    
    setActiveGen(type)
    try {
      let res;
      if (type === 'flashcards') res = await generateFlashcards(topicId, replace)
      if (type === 'quiz') res = await generateQuiz(topicId, replace)
      if (type === 'summary') res = await generateSummary(topicId)
      
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

  // Flashcard Handlers
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

  // Quiz Handlers
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
      <div className="flex flex-col gap-6 mb-8">
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground w-full overflow-hidden whitespace-nowrap">
          <Link href="/subjects" className="hover:text-foreground transition-colors">Subjects</Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-[100px] sm:max-w-[200px]">{topic?.subjectId?.title || 'Subject'}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-foreground font-medium truncate flex-1">{topic?.title || 'Loading...'}</span>
        </nav>
        
        <h1 className="font-serif text-3xl md:text-4xl text-foreground truncate">{topic?.title || 'Loading...'}</h1>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { id: 'flashcards', title: 'Flashcards', icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', desc: 'Create study set for spaced repetition' },
              { id: 'quiz', title: 'Quiz', icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Test your understanding with questions' },
              { id: 'summary', title: 'Summary', icon: FileText, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', border: 'border-[#4CAF50]/20', desc: 'Get a clean markdown summary' }
            ].map(card => (
              <div key={card.id} className={`glass-card rounded-xl p-6 flex flex-col gap-4 transition-all duration-300 ${rateLimited ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-border hover:-translate-y-1 hover:shadow-lg'}`}>
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
