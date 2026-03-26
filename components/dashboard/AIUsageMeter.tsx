'use client'

import { Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AIUsageMeterProps {
  used: number
  limit: number
  className?: string
}

export function AIUsageMeter({ used, limit, className }: AIUsageMeterProps) {
  const percentage = (used / limit) * 100
  
  const getColor = () => {
    if (percentage > 95) return 'bg-destructive'
    if (percentage > 80) return 'bg-amber-500'
    return 'bg-violet'
  }

  const getMessage = () => {
    if (percentage > 95) return 'Almost at daily limit!'
    if (percentage > 80) return 'Running low on requests'
    return 'AI requests available'
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          percentage > 80 ? 'bg-amber-500/10 text-amber-500' : 'bg-violet/10 text-violet'
        )}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground">AI Usage</h3>
          <p className="text-sm text-muted-foreground">{getMessage()}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Daily Requests</span>
          <span className="font-medium">
            <span className={cn(
              percentage > 80 && 'text-amber-500',
              percentage > 95 && 'text-destructive'
            )}>
              {used}
            </span>
            <span className="text-muted-foreground"> / {limit}</span>
          </span>
        </div>
        <Progress 
          value={percentage} 
          className="h-3"
          indicatorClassName={getColor()}
        />
        <p className="text-xs text-muted-foreground">
          Resets at midnight UTC
        </p>
      </div>
    </div>
  )
}
