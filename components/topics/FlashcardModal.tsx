'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Flashcard } from '@/types'
import { Loader2 } from 'lucide-react'

interface FlashcardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flashcard?: Flashcard | null
  onSave: (data: { question: string; answer: string }) => Promise<void>
}

export function FlashcardModal({
  open,
  onOpenChange,
  flashcard,
  onSave,
}: FlashcardModalProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!flashcard

  useEffect(() => {
    if (flashcard) {
      setQuestion(flashcard.question)
      setAnswer(flashcard.answer)
    } else {
      setQuestion('')
      setAnswer('')
    }
  }, [flashcard, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return

    setIsLoading(true)
    try {
      await onSave({ question: question.trim(), answer: answer.trim() })
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Flashcard' : 'Add Flashcard'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Question</FieldLabel>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="min-h-[80px] resize-none"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Answer</FieldLabel>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the answer..."
                className="min-h-[80px] resize-none"
                required
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Flashcard'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
