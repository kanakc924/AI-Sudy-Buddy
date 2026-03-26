'use client'

import { Brain, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { StudySession } from '@/types'
import { cn } from '@/lib/utils'

interface RecentSessionsFeedProps {
  sessions: StudySession[]
  className?: string
}

export function RecentSessionsFeed({ sessions, className }: RecentSessionsFeedProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400'
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <h3 className="font-serif text-lg font-semibold text-foreground">Recent Sessions</h3>
      <p className="mt-1 text-sm text-muted-foreground">Your latest study activity</p>

      <div className="mt-6 space-y-3">
        {sessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No sessions yet. Start studying to track your progress!
          </p>
        ) : (
          sessions.map((session, index) => (
            <div 
              key={session.id} 
              className="flex items-center gap-4 rounded-lg border border-border bg-background/50 p-3"
              style={{ 
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                session.type === 'flashcard' ? 'bg-violet/10 text-violet' : 'bg-gold/10 text-gold'
              )}>
                {session.type === 'flashcard' ? (
                  <Brain className="h-5 w-5" />
                ) : (
                  <ClipboardList className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {session.topicTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.subjectTitle}
                </p>
              </div>

              <Badge variant="secondary" className="shrink-0 capitalize">
                {session.type}
              </Badge>

              <div className={cn(
                'shrink-0 rounded-md px-2 py-1 text-xs font-medium',
                getScoreColor(session.score)
              )}>
                {session.score}%
              </div>

              <span className="shrink-0 text-xs text-muted-foreground">
                {session.completedAt}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
