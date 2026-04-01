'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Brain, CheckCircle2, XCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getQuizzes, logSession, updateQuiz } from '@/services/api'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Edit2 } from 'lucide-react'
import { ScoreCircle } from '@/components/score-circle'
import { toast } from 'sonner'
import Link from 'next/link'

export default function QuizSessionPage() {
  const router = useRouter()
  const params = useParams()
  const topicId = params.id as string

  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Results
  const [completed, setCompleted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [userAnswers, setUserAnswers] = useState<any[]>([])

  // Edit State
  const [quizId, setQuizId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState('')
  const [editExplanation, setEditExplanation] = useState('')
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', ''])
  const [editCorrectIndex, setEditCorrectIndex] = useState(0)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Timer for duration
  const [startTime] = useState<number>(Date.now())

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await getQuizzes(topicId)
        if (res.data && res.data.length > 0) {
          // Grab the most recent quiz
          const latestQuiz = res.data[res.data.length - 1]
          if (latestQuiz.questions && latestQuiz.questions.length > 0) {
            setQuizId(latestQuiz._id)
            setQuestions(latestQuiz.questions)
          } else {
            toast.error('Quiz data is invalid')
          }
        }
      } catch (err) {
        toast.error('Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }, [topicId])

  const handleSelect = (index: number) => {
    if (userAnswers[currentIndex] !== undefined) return // Already answered
    
    const isCorrect = index === questions[currentIndex].correctIndex
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
    }
    
    setUserAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[currentIndex] = {
        question: questions[currentIndex],
        selected: index,
        isCorrect
      }
      return newAnswers
    })
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setCompleted(true)
      const finalScore = Math.round((correctCount / questions.length) * 100)
      const durationSeconds = Math.round((Date.now() - startTime) / 1000)
      
      try {
        await logSession({ 
          type: 'quiz', 
          score: finalScore, 
          totalQuestions: questions.length, 
          correctAnswers: correctCount, 
          topicId,
          duration: durationSeconds
        })
      } catch (e) {
        console.error("Failed to log session", e)
      }
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleEditClick = () => {
    const currentQData = questions[currentIndex]
    setEditQuestion(currentQData.question)
    setEditExplanation(currentQData.explanation)
    setEditOptions([...currentQData.options])
    setEditCorrectIndex(currentQData.correctIndex)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!quizId) return
    setIsSavingEdit(true)
    try {
      const updatedQuestions = [...questions]
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        question: editQuestion,
        explanation: editExplanation,
        options: editOptions,
        correctIndex: editCorrectIndex
      }
      
      await updateQuiz(quizId, { questions: updatedQuestions })
      
      setQuestions(updatedQuestions)
      toast.success('Question updated successfully')
      setIsEditModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update question')
    } finally {
      setIsSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="bg-primary/20 p-4 rounded-full animate-pulse border border-primary/30">
          <Brain className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="font-serif text-xl text-muted-foreground animate-pulse">Generating quiz questions...</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto">
        <div className="bg-primary/5 p-6 rounded-full mb-4">
          <Brain className="w-12 h-12 text-primary/30" />
        </div>
        <h3 className="font-serif text-2xl text-foreground mb-2">No Quizzes Available</h3>
        <p className="text-muted-foreground mb-8">This topic does not have any quizzes generated yet.</p>
        <Link href={`/topics/${topicId}`}>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12">
            Back to Topic
          </Button>
        </Link>
      </div>
    )
  }

  if (completed) {
    const score = Math.round((correctCount / questions.length) * 100)
    
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-16 animate-in fade-in zoom-in-95 duration-500">
        <div className="glass-card rounded-2xl p-8 mb-10 text-center border-border shadow-2xl">
          <h2 className="font-serif text-3xl md:text-5xl mb-8">Quiz Results</h2>
          <ScoreCircle score={score} size={160} strokeWidth={12} />
          <p className="text-xl text-muted-foreground mt-8 font-medium">
            You got <span className="text-foreground">{correctCount}</span> out of <span className="text-foreground">{questions.length}</span> correct.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <h3 className="font-serif text-2xl mb-6">Review Answers</h3>
          {userAnswers.map((item, idx) => (
            <div key={idx} className={`glass-card rounded-xl border p-6 space-y-4 ${item.isCorrect ? 'border-[#4CAF50]/30' : 'border-destructive/30'}`}>
              <div className="flex items-start gap-3">
                <span className="bg-card w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-border shrink-0">
                  {idx + 1}
                </span>
                <p className="text-foreground text-lg leading-relaxed pt-0.5">{item.question.question}</p>
              </div>
              
              <div className="pl-11 flex flex-col sm:flex-row flex-wrap gap-2">
                {!item.isCorrect && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-full px-4 py-1.5 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> 
                    <span className="font-medium">Your Answer: <span className="font-normal opacity-90">{item.question.options[item.selected]}</span></span>
                  </div>
                )}
                <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 text-[#4CAF50] rounded-full px-4 py-1.5 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> 
                  <span className="font-medium">Correct Answer: <span className="font-normal opacity-90">{item.question.options[item.question.correctIndex]}</span></span>
                </div>
              </div>
              
              <div className="mt-4 pl-11">
                <div className={`bg-primary/5 border rounded-xl p-4 text-sm leading-relaxed ${item.isCorrect ? 'border-primary/20 text-foreground' : 'border-amber-500/30 text-amber-500/90'}`}>
                  <strong className="uppercase tracking-wide text-xs mb-1 block opacity-70">Explanation</strong>
                  {item.question.explanation}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-4 z-10 bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-2xl">
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
              setCompleted(false)
              setUserAnswers([])
              setCorrectCount(0)
            }}
          >
            <RefreshCw className="w-5 h-5 mr-2" /> Retake Quiz
          </Button>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const currentUserAnswer = userAnswers[currentIndex]
  const isAnswered = currentUserAnswer !== undefined
  const selectedAnswer = currentUserAnswer?.selected

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-12 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <Link href={`/topics/${topicId}`}>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-card border border-border/50 shadow-sm shrink-0">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
        </Link>
        <div className="flex-1 px-6">
          <Progress value={((currentIndex) / questions.length) * 100} className="h-2 [&>div]:bg-primary rounded-full bg-card shadow-inner" />
        </div>
        <span className="font-serif text-lg text-muted-foreground shrink-0 border border-border px-3 py-1 rounded-full bg-card/50">
          Q {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentIndex}
           initial={{ x: 20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           exit={{ x: -20, opacity: 0 }}
           transition={{ duration: 0.3 }}
           className="glass-card rounded-2xl p-6 md:p-8 flex flex-col flex-1 border-border shadow-xl shadow-primary/5"
        >
          <div className="flex justify-between items-start mb-8">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground text-center leading-relaxed flex-1">
              {currentQ.question}
            </h2>
            {quizId && !isAnswered && (
              <Button variant="ghost" size="icon" onClick={handleEditClick} className="rounded-full shrink-0 -mt-2 -mr-2 text-muted-foreground hover:text-primary">
                <Edit2 className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
            {currentQ.options.map((opt: string, idx: number) => {
              const isSelected = selectedAnswer === idx
              const isCorrectTarget = idx === currentQ.correctIndex
              
              let btnClass = "bg-card border-border hover:border-primary/50 hover:bg-card/80 text-foreground"
              
              if (isAnswered) {
                if (isCorrectTarget) {
                  btnClass = "border-[#4CAF50] bg-[#4CAF50]/10 text-[#4CAF50] shadow-[0_0_15px_rgba(76,175,80,0.15)]"
                } else if (isSelected && !isCorrectTarget) {
                  btnClass = "border-destructive bg-destructive/10 text-destructive"
                } else {
                  btnClass = "border-border/50 bg-card/30 text-muted-foreground opacity-50"
                }
              }

              return (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`min-h-[70px] h-auto p-4 justify-start text-left items-start whitespace-normal rounded-xl border-2 transition-all duration-300 ${btnClass}`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5 opacity-80 uppercase">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base font-medium leading-relaxed">{opt}</span>
                </Button>
              )
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mt-8 bg-primary/10 border border-primary/30 rounded-xl p-5"
            >
              <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Explanation
              </h3>
              <p className="text-foreground/90 leading-relaxed text-[15px]">{currentQ.explanation}</p>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-border flex justify-between gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto min-w-[140px] h-14 text-lg rounded-xl border-border hover:bg-card"
            >
              Previous
            </Button>
            <Button 
              size="lg"
              disabled={!isAnswered}
              onClick={handleNext}
              className="w-full sm:w-auto min-w-[160px] bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg rounded-xl shadow-lg shadow-primary/20 disabled:shadow-none"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-xl bg-popover border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Question</label>
              <Textarea 
                value={editQuestion} 
                onChange={e => setEditQuestion(e.target.value)} 
                className="bg-card border-border resize-none"
              />
            </div>
            <div className="space-y-4 border rounded-xl p-4 bg-card/50">
              <label className="text-sm font-medium">Options</label>
              {editOptions.map((opt, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input 
                    type="radio" 
                    name="correctIndex" 
                    checked={editCorrectIndex === i} 
                    onChange={() => setEditCorrectIndex(i)}
                    className="w-5 h-5 accent-primary shrink-0 cursor-pointer"
                  />
                  <Input 
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...editOptions]
                      newOpts[i] = e.target.value
                      setEditOptions(newOpts)
                    }}
                    className="bg-card text-foreground"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2 text-primary">
              <label className="text-sm font-medium ml-1">Explanation</label>
              <Textarea 
                value={editExplanation} 
                onChange={e => setEditExplanation(e.target.value)} 
                className="bg-primary/5 border-primary/20 resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter className="pt-2 sm:justify-start flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto mt-2 sm:mt-0 rounded-xl">Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit || editOptions.some(o => !o.trim())} className="w-full sm:w-auto bg-primary text-primary-foreground rounded-xl">
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
