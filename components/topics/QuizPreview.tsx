'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuizQuestion } from '@/types'
import { Brain, Play, Plus, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizPreviewProps {
  questions: QuizQuestion[]
  topicId: string
  lastScore?: number
  onAddClick: () => void
  onEditClick: (question: QuizQuestion) => void
  onDeleteClick: (id: string | number) => void
}

export function QuizPreview({ questions, topicId, lastScore, onAddClick, onEditClick, onDeleteClick }: QuizPreviewProps) {
  if (questions.length === 0) {
    return (
      <Card className="border-dashed border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-secondary/10 p-4 mb-4">
            <Brain className="h-8 w-8 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No quiz questions yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add quiz questions to test your knowledge on this topic.
          </p>
          <Button onClick={onAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    )
  }

  const displayQuestions = questions.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-secondary" />
          Quiz ({questions.length} questions)
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onAddClick}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href={`/quiz/${topicId}`}>
              <Play className="h-4 w-4" />
              Start Quiz
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lastScore !== undefined && (
          <div className="mb-4 p-3 rounded-lg bg-muted/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Score</span>
            <span className={cn(
              "font-semibold",
              lastScore >= 80 ? "text-green-400" : lastScore >= 60 ? "text-yellow-400" : "text-red-400"
            )}>
              {lastScore}%
            </span>
          </div>
        )}

        <div className="space-y-3">
          {displayQuestions.map((question, index) => (
            <div
              key={question.id}
              className="p-3 rounded-lg border border-border/30 bg-card/50 relative group/item"
            >
              <div className="flex justify-between items-start mb-2 pr-12">
                <p className="text-sm text-foreground line-clamp-2">
                  {index + 1}. {question.question}
                </p>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => onEditClick(question)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteClick(question.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {question.options.slice(0, 2).map((option, optIndex) => (
                  <span
                    key={optIndex}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      option === question.correctAnswer
                        ? "bg-green-500/20 text-green-400"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {option.length > 20 ? option.slice(0, 20) + '...' : option}
                  </span>
                ))}
                {question.options.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{question.options.length - 2} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {questions.length > 3 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            +{questions.length - 3} more questions
          </p>
        )}
      </CardContent>
    </Card>
  )
}
