'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { QuizQuestion } from '@/types'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface QuizQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question?: QuizQuestion | null
  onSave: (data: { question: string; options: string[]; correctAnswer: string }) => Promise<void>
}

export function QuizQuestionModal({
  open,
  onOpenChange,
  question,
  onSave,
}: QuizQuestionModalProps) {
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!question

  useEffect(() => {
    if (question) {
      setQuestionText(question.question)
      setOptions(question.options)
      setCorrectAnswer(question.correctAnswer)
    } else {
      setQuestionText('')
      setOptions(['', '', '', ''])
      setCorrectAnswer('')
    }
  }, [question, open])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    
    // Update correct answer if it was the one being edited
    if (correctAnswer === options[index]) {
      setCorrectAnswer(value)
    }
  }

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
      if (correctAnswer === options[index]) {
        setCorrectAnswer('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validOptions = options.filter(o => o.trim())
    if (!questionText.trim() || validOptions.length < 2 || !correctAnswer) return

    setIsLoading(true)
    try {
      await onSave({
        question: questionText.trim(),
        options: validOptions,
        correctAnswer
      })
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Question' : 'Add Quiz Question'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Question</FieldLabel>
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question..."
                className="min-h-[80px] resize-none"
                required
              />
            </Field>
            
            <Field>
              <FieldLabel>Answer Options</FieldLabel>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={addOption}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                )}
              </div>
            </Field>

            <Field>
              <FieldLabel>Correct Answer</FieldLabel>
              <RadioGroup
                value={correctAnswer}
                onValueChange={setCorrectAnswer}
                className="space-y-2"
              >
                {options.filter(o => o.trim()).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <RadioGroupItem value={option} id={`correct-${index}`} />
                    <label
                      htmlFor={`correct-${index}`}
                      className="text-sm text-foreground cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </RadioGroup>
              {options.filter(o => o.trim()).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add options above to select the correct answer
                </p>
              )}
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
            <Button
              type="submit"
              disabled={isLoading || !correctAnswer}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
