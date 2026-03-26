'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Save, X, Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryEditorProps {
  summary: string
  onSave: (summary: string) => void
  onGenerateAI?: () => Promise<string>
  isGenerating?: boolean
  className?: string
}

export function SummaryEditor({
  summary,
  onSave,
  onGenerateAI,
  isGenerating = false,
  className
}: SummaryEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState(summary)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditedSummary(summary)
  }, [summary])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedSummary)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedSummary(summary)
    setIsEditing(false)
  }

  const handleGenerateAI = async () => {
    if (onGenerateAI) {
      const generated = await onGenerateAI()
      setEditedSummary(generated)
      setIsEditing(true)
    }
  }

  if (!summary && !isEditing) {
    return (
      <Card className={cn("border-dashed border-border/50", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No summary yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Generate an AI-powered summary or write your own notes for this topic.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate with AI
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Write manually
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isEditing) {
    return (
      <Card className={cn("border-primary/30", className)}>
        <CardContent className="pt-6">
          <Textarea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            placeholder="Write your summary here..."
            className="min-h-[200px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
          />
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="gap-2 text-primary hover:text-primary"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Regenerate with AI
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("group", className)}>
      <CardContent className="pt-6">
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {summary}
          </p>
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="gap-2 text-muted-foreground hover:text-primary"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Regenerate
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
