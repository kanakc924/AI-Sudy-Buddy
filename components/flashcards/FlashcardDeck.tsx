'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flashcard } from '@/types'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Check, 
  X,
  Shuffle
} from 'lucide-react'

interface FlashcardDeckProps {
  flashcards: Flashcard[]
  currentIndex: number
  isFlipped: boolean
  onFlip: () => void
  onNext: () => void
  onPrevious: () => void
  onMarkCorrect: () => void
  onMarkIncorrect: () => void
  onShuffle: () => void
  correctCount: number
  incorrectCount: number
}

export function FlashcardDeck({
  flashcards,
  currentIndex,
  isFlipped,
  onFlip,
  onNext,
  onPrevious,
  onMarkCorrect,
  onMarkIncorrect,
  onShuffle,
  correctCount,
  incorrectCount,
}: FlashcardDeckProps) {
  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100
  const answered = correctCount + incorrectCount

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-400 flex items-center gap-1">
              <Check className="h-4 w-4" />
              {correctCount}
            </span>
            <span className="text-red-400 flex items-center gap-1">
              <X className="h-4 w-4" />
              {incorrectCount}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card */}
      <div 
        className="relative perspective-1000 h-80 mb-6 cursor-pointer"
        onClick={onFlip}
      >
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-500 transform-style-3d",
            isFlipped && "transform-[rotateY(180deg)]"
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <Card
            className={cn(
              "absolute inset-0 border-border/50 bg-linear-to-br from-card to-card/80",
              isFlipped && "invisible"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
              <span className="text-xs uppercase tracking-wider text-primary mb-4">
                Question
              </span>
              <p className="text-xl font-medium text-foreground leading-relaxed">
                {currentCard.question}
              </p>
              <span className="text-sm text-muted-foreground mt-auto">
                Tap to reveal answer
              </span>
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className={cn(
              "absolute inset-0 border-accent/30 bg-linear-to-br from-accent/10 to-accent/5",
              !isFlipped && "invisible"
            )}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
              <span className="text-xs uppercase tracking-wider text-accent mb-4">
                Answer
              </span>
              <p className="text-xl font-medium text-foreground leading-relaxed">
                {currentCard.answer}
              </p>
              <span className="text-sm text-muted-foreground mt-auto">
                Tap to flip back
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Answer buttons - only show when flipped */}
        {isFlipped && (
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onMarkIncorrect()
              }}
              className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400"
            >
              <X className="h-5 w-5" />
              Incorrect
            </Button>
            <Button
              size="lg"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onMarkCorrect()
              }}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-5 w-5" />
              Correct
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onFlip}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShuffle}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onNext}
            disabled={currentIndex === flashcards.length - 1}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
