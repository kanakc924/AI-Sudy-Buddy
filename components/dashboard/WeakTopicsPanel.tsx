'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface WeakTopic {
  id: string
  title: string
  subjectTitle: string
  avgScore: number
}

interface WeakTopicsPanelProps {
  topics: WeakTopic[]
  className?: string
}

export function WeakTopicsPanel({ topics, className }: WeakTopicsPanelProps) {
  const sortedTopics = [...topics]
    .filter(t => t.avgScore > 0)
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 5)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <h3 className="font-serif text-lg font-semibold text-foreground">Topics to Review</h3>
      <p className="mt-1 text-sm text-muted-foreground">Focus on these areas to improve</p>

      <div className="mt-6 space-y-4">
        {sortedTopics.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Complete some quizzes to see your weak areas
          </p>
        ) : (
          sortedTopics.map((topic) => (
            <div key={topic.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{topic.title}</p>
                <p className="text-xs text-muted-foreground">{topic.subjectTitle}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress 
                    value={topic.avgScore} 
                    className="h-2 flex-1"
                    indicatorClassName={getScoreColor(topic.avgScore)}
                  />
                  <span className="text-xs font-medium text-muted-foreground w-10">
                    {topic.avgScore}%
                  </span>
                </div>
              </div>
              <Button 
                asChild 
                variant="ghost" 
                size="sm"
                className="shrink-0 text-violet hover:text-violet hover:bg-violet/10"
              >
                <Link href={`/topics/${topic.id}`}>
                  Study
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
