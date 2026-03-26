import { BookOpen, Brain, FileText, Sparkles, TrendingUp, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  variant: 'subjects' | 'topics' | 'notes' | 'flashcards' | 'sessions'
  onAction?: () => void
}

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const config = {
    subjects: { icon: BookOpen, title: 'No subjects yet', desc: 'Create your first subject to get started', action: 'Create Subject' },
    topics: { icon: Brain, title: 'No topics here', desc: 'Add a topic to start taking notes', action: 'Add Topic' },
    notes: { icon: FileText, title: 'No notes yet', desc: 'Start writing or upload a file', action: 'Create Notes' },
    flashcards: { icon: Sparkles, title: 'No flashcards generated', desc: 'Generate from your notes to study', action: 'Generate Flashcards' },
    sessions: { icon: TrendingUp, title: 'No sessions yet', desc: 'Start studying to see progress', action: 'Start Studying' },
  }
  
  const { icon: Icon, title, desc, action } = config[variant]

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center glass-card rounded-2xl border-dashed">
      <div className="bg-primary/5 p-6 rounded-full mb-4">
        <Icon className="w-12 h-12 text-primary/30" />
      </div>
      <h3 className="font-serif text-2xl text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-sm">{desc}</p>
      {onAction && (
        <Button onClick={onAction} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12">
          {action}
        </Button>
      )}
    </div>
  )
}
