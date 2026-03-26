'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flashcard } from '@/types'
import { Layers, Play, Plus, ChevronLeft, ChevronRight, RotateCcw, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlashcardPreviewProps {
  flashcards: Flashcard[]
  topicId: string
  onAddClick: () => void
  onEditClick: (card: Flashcard) => void
  onDeleteClick: (id: string | number) => void
}

export function FlashcardPreview({ flashcards, topicId, onAddClick, onEditClick, onDeleteClick }: FlashcardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const displayCards = flashcards.slice(0, 5)
  const hasMore = flashcards.length > 5

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % displayCards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + displayCards.length) % displayCards.length)
  }

  if (flashcards.length === 0) {
    return (
      <Card className="border-dashed border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-accent/10 p-4 mb-4">
            <Layers className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No flashcards yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create flashcards to help memorize key concepts from this topic.
          </p>
          <Button onClick={onAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Flashcard
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentCard = displayCards[currentIndex]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          Flashcards ({flashcards.length})
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onAddClick}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href={`/flashcards/${topicId}`}>
              <Play className="h-4 w-4" />
              Practice
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative perspective-1000">
          <div
            className={cn(
              "relative w-full h-48 cursor-pointer transition-transform duration-500 transform-style-3d",
              isFlipped && "rotate-y-180"
            )}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front */}
            <div
              className={cn(
                "absolute inset-0 rounded-lg border border-border/50 bg-card p-6 flex flex-col items-center justify-center text-center backface-hidden",
                isFlipped && "invisible"
              )}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-xs text-muted-foreground mb-2">Question</span>
              <p className="text-foreground font-medium">{currentCard.question}</p>
              <span className="text-xs text-muted-foreground mt-4">Click to flip</span>
            </div>
            {/* Back */}
            <div
              className={cn(
                "absolute inset-0 rounded-lg border border-accent/30 bg-accent/5 p-6 flex flex-col items-center justify-center text-center backface-hidden",
                !isFlipped && "invisible"
              )}
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <span className="text-xs text-accent mb-2">Answer</span>
              <p className="text-foreground font-medium">{currentCard.answer}</p>
              <span className="text-xs text-muted-foreground mt-4">Click to flip back</span>
            </div>
          </div>

          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(currentCard);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(currentCard.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={displayCards.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {displayCards.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFlipped(false)}
              className="h-8 w-8"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={displayCards.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {hasMore && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            +{flashcards.length - 5} more cards
          </p>
        )}
      </CardContent>
    </Card>
  )
}
