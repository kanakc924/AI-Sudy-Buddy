'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { QuizQuestion } from '@/types'
import { cn } from '@/lib/utils'
import { Check, X, ChevronRight } from 'lucide-react'

interface QuizCardProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer: (isCorrect: boolean) => void
  onNext: () => void
}

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
}: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  const progress = (questionNumber / totalQuestions) * 100
  const isCorrect = selectedAnswer === question.correctAnswer

  const handleSelect = (option: string) => {
    if (hasAnswered) return
    setSelectedAnswer(option)
    setHasAnswered(true)
    onAnswer(option === question.correctAnswer)
  }

  const handleNext = () => {
    setSelectedAnswer(null)
    setHasAnswered(false)
    onNext()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-8 pb-6 px-6">
          <p className="text-xl font-medium text-foreground text-center leading-relaxed">
            {question.question}
          </p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const isCorrectOption = option === question.correctAnswer
          const showCorrect = hasAnswered && isCorrectOption
          const showIncorrect = hasAnswered && isSelected && !isCorrectOption

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={hasAnswered}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all duration-200",
                "flex items-center gap-3",
                !hasAnswered && "hover:border-primary/40 hover:bg-primary/5 hover:translate-x-1 cursor-pointer shadow-sm",
                !hasAnswered && !isSelected && "border-border/50 bg-card",
                showCorrect && "border-green-500 bg-green-500/10",
                showIncorrect && "border-red-500 bg-red-500/10",
                hasAnswered && !showCorrect && !showIncorrect && "border-border/30 bg-card/50 opacity-50"
              )}
            >
              <span className={cn(
                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                !hasAnswered && "bg-muted text-muted-foreground",
                showCorrect && "bg-green-500 text-white",
                showIncorrect && "bg-red-500 text-white",
                hasAnswered && !showCorrect && !showIncorrect && "bg-muted/50 text-muted-foreground"
              )}>
                {showCorrect ? <Check className="h-4 w-4" /> :
                 showIncorrect ? <X className="h-4 w-4" /> :
                 String.fromCharCode(65 + index)}
              </span>
              <span className={cn(
                "flex-1",
                hasAnswered && !showCorrect && !showIncorrect && "text-muted-foreground"
              )}>
                {option}
              </span>
            </button>
          )
        })}
      </div>

      {/* Feedback & Next */}
      {hasAnswered && (
        <div className="space-y-4">
          <div className={cn(
            "p-4 rounded-lg text-center",
            isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
          )}>
            <p className={cn(
              "font-medium",
              isCorrect ? "text-green-400" : "text-red-400"
            )}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            {!isCorrect && (
              <p className="text-sm text-muted-foreground mt-1">
                The correct answer was: <span className="text-foreground">{question.correctAnswer}</span>
              </p>
            )}
          </div>

          <Button onClick={handleNext} className="w-full gap-2">
            {questionNumber === totalQuestions ? 'See Results' : 'Next Question'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
