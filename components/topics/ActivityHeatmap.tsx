'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { useMemo } from 'react'

interface ActivityHeatmapProps {
  sessions: any[]
  title?: string
  subtitle?: string
}

export function ActivityHeatmap({ sessions, title = "Study Activity", subtitle }: ActivityHeatmapProps) {
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-card'
    if (count === 1) return 'bg-primary/20'
    if (count === 2) return 'bg-primary/40'
    if (count === 3) return 'bg-primary/60'
    return 'bg-primary'
  }

  const heatmapData = useMemo(() => {
    // Generate 12 weeks of data ending today
    const data = []
    const now = new Date()
    // Start from the beginning of the week 11 weeks ago
    const start = new Date()
    start.setDate(now.getDate() - (12 * 7) + 1)
    
    // Normalize sessions to date strings for quick lookup
    const sessionCounts: Record<string, number> = {}
    sessions.forEach(s => {
      const dateStr = new Date(s.completedAt).toDateString()
      sessionCounts[dateStr] = (sessionCounts[dateStr] || 0) + 1
    })

    for (let i = 0; i < 12 * 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const dateStr = d.toDateString()
        data.push({
            date: dateStr,
            displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            count: sessionCounts[dateStr] || 0
        })
    }
    return data
  }, [sessions])

  return (
    <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {subtitle && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-6">
            {subtitle}
          </p>
        )}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="min-w-[600px]">
            <TooltipProvider delayDuration={0}>
              <div className="flex gap-2 items-start">
                <div className="flex flex-col justify-between h-[116px] text-[10px] uppercase tracking-tighter text-muted-foreground pr-2 pt-2 font-bold">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 flex-1">
                  {heatmapData.map((day, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div className={`w-3.5 h-3.5 rounded-[3px] ${getHeatmapColor(day.count)} border border-border/10 hover:ring-2 hover:ring-primary/30 transition-all`} />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-popover text-popover-foreground border-border text-xs rounded-lg">
                        {day.count} sessions on {day.displayDate}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </TooltipProvider>
            
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  Active Topic Focus
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                <span>Less</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map(c => (
                    <div key={c} className={`w-3 h-3 rounded-[2px] ${getHeatmapColor(c)}`} />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
