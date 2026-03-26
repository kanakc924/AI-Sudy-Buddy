'use client'

import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { HeatmapDay } from '@/types'
import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
  data: HeatmapDay[]
  className?: string
}

const intensityClasses = [
  'bg-violet/0 border border-border',
  'bg-violet/20',
  'bg-violet/40',
  'bg-violet/60',
  'bg-violet/80',
  'bg-violet',
]

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    // Organize data into weeks (columns) and days (rows)
    const weeks: HeatmapDay[][] = []
    for (let i = 0; i < data.length; i += 7) {
      weeks.push(data.slice(i, i + 7))
    }

    // Generate month labels for top
    const labels: { month: string; colStart: number }[] = []
    let lastMonth = ''
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0]
      if (firstDay) {
        const date = new Date(firstDay.date)
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        if (month !== lastMonth) {
          labels.push({ month, colStart: weekIndex })
          lastMonth = month
        }
      }
    })

    return { weeks, monthLabels: labels }
  }, [data])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const getSessionText = (intensity: number) => {
    if (intensity === 0) return 'No activity'
    if (intensity === 1) return '1-2 sessions'
    if (intensity === 2) return '3-4 sessions'
    if (intensity === 3) return '5-6 sessions'
    return '7+ sessions'
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <h3 className="font-serif text-lg font-semibold text-foreground">Study Activity</h3>
      <p className="mt-1 text-sm text-muted-foreground">Your study sessions over the past 12 weeks</p>
      
      <TooltipProvider delayDuration={100}>
        <div className="mt-6">
          {/* Month labels */}
          <div className="mb-2 flex gap-[2px]" style={{ paddingLeft: '0px' }}>
            {weeks.map((_, weekIndex) => {
              const label = monthLabels.find(l => l.colStart === weekIndex)
              return (
                <div key={weekIndex} className="h-4 w-3 text-xs text-muted-foreground">
                  {label?.month || ''}
                </div>
              )
            })}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'h-3 w-3 rounded-sm transition-colors hover:ring-1 hover:ring-violet hover:ring-offset-1 hover:ring-offset-background',
                          intensityClasses[day.intensity] || intensityClasses[0]
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{getSessionText(day.intensity)}</p>
                      <p className="text-muted-foreground">{formatDate(day.date)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Less</span>
            {intensityClasses.map((cls, i) => (
              <div key={i} className={cn('h-3 w-3 rounded-sm', cls)} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
