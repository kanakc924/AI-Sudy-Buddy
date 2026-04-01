'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ArrowLeft, RefreshCw, BookOpen, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getFlashcards, logSession, updateFlashcard } from '@/services/api'
import { Flashcard } from '@/components/flashcard'
import { ScoreCircle } from '@/components/score-circle'
import { toast } from 'sonner'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function FlashcardSessionPage() {
  const router = useRouter()
  const params = useParams()
  const topicId = params.id as string

  const [cards, setCards] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Results
  const [completed, setCompleted] = useState(false)
  const [missedCards, setMissedCards] = useState<any[]>([])
  const [correctCount, setCorrectCount] = useState(0)

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Timer for duration
  const [startTime] = useState<number>(Date.now())

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const res = await getFlashcards(topicId)
        if (res.data && res.data.length > 0) {
          // Flatten cards if returned as an object structure or array of decks
          const flatCards = Array.isArray(res.data) 
            ? res.data.flatMap((d: any) => Array.isArray(d.flashcards) ? d.flashcards : [d])
            : []
            
          // If the API returns the format we expect directly
          const actualCards = flatCards.length > 0 ? flatCards : (res.data.flashcards || res.data)
          
          if (Array.isArray(actualCards) && actualCards.length > 0) {
            const variants: ('mint' | 'purple' | 'pink' | 'blue')[] = ['mint', 'purple', 'pink', 'blue']
            const cardsWithVariants = actualCards.map((card: any, i: number) => ({
              ...card,
              colorVariant: variants[i % variants.length]
            }))
            setCards(cardsWithVariants)
          } else {
            toast.error('No valid flashcards found')
          }
        }
      } catch (err) {
        toast.error('Failed to load flashcards')
      } finally {
        setLoading(false)
      }
    }
    fetchDeck()
  }, [topicId])

  const handleNext = useCallback(async (correct: boolean) => {
    if (!isFlipped) return // Prevent grading before flipping
    
    if (correct) {
      setCorrectCount(prev => prev + 1)
    } else {
      setMissedCards(prev => [...prev, cards[currentIndex]])
    }

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false)
      // Small timeout to let CSS un-flip before changing text
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150)
    } else {
      setCompleted(true)
      const knownCount = correct ? correctCount + 1 : correctCount; // Calculate knownCount based on the last card's correctness
      const finalScore = Math.round((knownCount / cards.length) * 100)
      const durationSeconds = Math.round((Date.now() - startTime) / 1000)
      
      try {
        await logSession({ 
          type: 'flashcard', 
          score: finalScore, 
          totalQuestions: cards.length, 
          correctAnswers: knownCount, 
          topicId,
          duration: durationSeconds
        })
      } catch (e) {
        console.error("Failed to log session", e)
      }
    }
  }, [currentIndex, cards, isFlipped, correctCount, topicId])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed || loading || cards.length === 0) return
      
      if (e.code === 'Space') {
        e.preventDefault()
        setIsFlipped(prev => !prev)
      } else if (e.code === 'KeyG' && isFlipped) {
        handleNext(true)
      } else if (e.code === 'KeyM' && isFlipped) {
        handleNext(false)
      } else if (e.code === 'ArrowRight' && isFlipped) {
        handleNext(true)
      } else if (e.code === 'ArrowLeft' && isFlipped) {
        handleNext(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [completed, loading, cards.length, isFlipped, handleNext, isEditModalOpen])

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const currentCard = cards[currentIndex]
    setEditQuestion(currentCard.question)
    setEditAnswer(currentCard.answer)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editQuestion.trim() || !editAnswer.trim()) return

    setIsSavingEdit(true)
    try {
      const currentCard = cards[currentIndex]
      await updateFlashcard(currentCard._id, { question: editQuestion, answer: editAnswer })
      
      const updatedCards = [...cards]
      updatedCards[currentIndex] = { ...currentCard, question: editQuestion, answer: editAnswer }
      setCards(updatedCards)
      
      toast.success('Flashcard updated')
      setIsEditModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update flashcard')
    } finally {
      setIsSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-serif text-xl text-muted-foreground animate-pulse">Shuffling deck...</p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto">
        <div className="bg-primary/5 p-6 rounded-full mb-4">
          <BookOpen className="w-12 h-12 text-primary/30" />
        </div>
        <h3 className="font-serif text-2xl text-foreground mb-2">No Flashcards Available</h3>
        <p className="text-muted-foreground mb-8">This topic does not have any flashcards generated yet.</p>
        <Link href={`/topics/${topicId}`}>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12">
            Back to Topic
          </Button>
        </Link>
      </div>
    )
  }

  if (completed) {
    const score = Math.round((correctCount / cards.length) * 100)
    
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16 animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-card rounded-2xl p-8 mb-8 text-center border-border">
          <h2 className="font-serif text-3xl md:text-5xl mb-8">Session Complete!</h2>
          
          <ScoreCircle score={score} size={160} strokeWidth={12} />
          
          <p className="text-xl text-muted-foreground mt-8 font-medium">
            You got <span className="text-foreground">{correctCount}</span> out of <span className="text-foreground">{cards.length}</span> correct.
          </p>
        </div>

        {missedCards.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="font-serif text-2xl mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-gold" /> Cards to Review
            </h3>
            {missedCards.map((card, idx) => (
              <div key={idx} className="glass-card rounded-xl border border-destructive/20 p-5 space-y-3">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Question</div>
                <div className="text-foreground text-lg leading-relaxed">{card.question}</div>
                <div className="w-full h-px bg-border/50 my-2" />
                <div className="text-sm font-semibold text-primary uppercase tracking-widest">Answer</div>
                <div className="text-foreground font-serif leading-relaxed text-lg">{card.answer}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1 h-14 rounded-xl text-lg font-medium border-border hover:bg-card" 
            variant="outline"
            onClick={() => router.push(`/topics/${topicId}`)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Topic
          </Button>
          <Button 
            className="flex-1 h-14 rounded-xl text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            onClick={() => {
              setCurrentIndex(0)
              setIsFlipped(false)
              setCompleted(false)
              setMissedCards([])
              setCorrectCount(0)
            }}
          >
            <RefreshCw className="w-5 h-5 mr-2" /> Study Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:py-12 flex flex-col h-[calc(100vh-140px)] md:h-auto">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <Link href={`/topics/${topicId}`}>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-card border border-border/50 shadow-sm">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
        </Link>
        <span className="font-serif text-lg text-muted-foreground">
          Card {currentIndex + 1} of {cards.length}
        </span>
      </div>

      <div className="mb-8 shrink-0">
        <Progress value={((currentIndex + 1) / cards.length) * 100} className="h-2 [&>div]:bg-primary rounded-full bg-card shadow-inner" />
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8 md:gap-12 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full flex justify-center"
          >
            <Flashcard 
              card={cards[currentIndex]} 
              isFlipped={isFlipped} 
              onFlip={() => setIsFlipped(!isFlipped)} 
              onEdit={handleEditClick}
              colorVariant={cards[currentIndex].colorVariant}
            />
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0 mt-4 md:mt-0">
          <Button
            onClick={() => handleNext(false)}
            disabled={!isFlipped}
            variant="outline"
            className={`flex-1 min-h-[60px] md:min-h-[72px] rounded-xl text-lg font-medium border-2 transition-all overflow-hidden relative group ${
              isFlipped 
                ? 'border-destructive bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive/80' 
                : 'border-border/50 bg-card/30 text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
          >
            <X className={`w-6 h-6 mr-2 transition-transform ${isFlipped ? 'group-hover:scale-125 group-hover:-rotate-12' : ''}`} /> 
            Missed it
            {isFlipped && <span className="absolute bottom-1 text-[10px] text-destructive/50 hidden md:block uppercase tracking-widest font-bold">Press M or ←</span>}
          </Button>
          
          <Button
            onClick={() => handleNext(true)}
            disabled={!isFlipped}
            variant="outline"
            className={`flex-1 min-h-[60px] md:min-h-[72px] rounded-xl text-lg font-medium border-2 transition-all overflow-hidden relative group ${
              isFlipped 
                ? 'border-[#4CAF50] bg-[#4CAF50]/5 text-[#4CAF50] hover:bg-[#4CAF50]/10 hover:border-[#4CAF50]/80 shadow-[0_0_20px_rgba(76,175,80,0.1)]' 
                : 'border-border/50 bg-card/30 text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
          >
            <Check className={`w-6 h-6 mr-2 transition-transform ${isFlipped ? 'group-hover:scale-125 group-hover:rotate-12 group-hover:-translate-y-1' : ''}`} /> 
            Got it
            {isFlipped && <span className="absolute bottom-1 text-[10px] text-[#4CAF50]/50 hidden md:block uppercase tracking-widest font-bold">Press G or →</span>}
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-border rounded-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Question</label>
              <Textarea 
                value={editQuestion} 
                onChange={e => setEditQuestion(e.target.value)} 
                className="bg-card border-border min-h-[100px] resize-none focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Answer</label>
              <Textarea 
                value={editAnswer} 
                onChange={e => setEditAnswer(e.target.value)} 
                className="bg-card border-border min-h-[100px] resize-none focus:ring-primary/50"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 sm:justify-start flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto h-12 rounded-xl">Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit || !editQuestion.trim() || !editAnswer.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl">
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
