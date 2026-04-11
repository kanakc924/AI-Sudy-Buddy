'use client'

import { BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts'
import { ActivityHeatmap } from '@/components/topics/ActivityHeatmap'

interface StatsSectionProps {
  sessions: any[]
  isMounted: boolean
}

export function StatsSection({ sessions, isMounted }: StatsSectionProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  const studyTimeData = days.map(day => {
    const daySessions = sessions.filter(s => {
      const d = new Date(s.completedAt);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      return dayName === day;
    });
    
    const avgScore = daySessions.length > 0 
      ? Math.round(daySessions.reduce((acc, s) => acc + s.score, 0) / daySessions.length)
      : 0;

    return { day, score: avgScore };
  });

  return (
    <div className="grid lg:grid-cols-2 gap-8 pb-12 items-stretch">
      <div className="flex flex-col h-full">
        <ActivityHeatmap 
          sessions={sessions} 
          subtitle="Study consistency for this topic" 
        />
      </div>

      <div className="flex flex-col h-full">
        <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
          <CardHeader className="pb-2.5 border-b border-border/50 bg-muted/20">
            <CardTitle className="font-serif text-xl font-bold flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              Score History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 py-5 flex-1 flex flex-col">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 font-medium">
              Quiz scores over time
            </p>
            {sessions.length > 0 && isMounted ? (
              <div className="h-[240px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="day" 
                      stroke="var(--color-muted-foreground)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'var(--color-muted-foreground)', fontWeight: 600 }}
                    />
                    <YAxis 
                      stroke="var(--color-muted-foreground)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: 'var(--color-muted-foreground)', fontWeight: 600 }}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                      contentStyle={{ 
                        backgroundColor: 'var(--color-card)', 
                        borderColor: 'var(--color-border)', 
                        borderRadius: '12px', 
                        border: '1px solid var(--color-border)' 
                      }}
                      itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value}%`, 'Average Score']}
                    />
                    <Bar 
                      dataKey="score" 
                      radius={[6, 6, 0, 0]} 
                      barSize={32}
                      fill="var(--color-primary)"
                    >
                      {studyTimeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.score > 0 ? 'var(--color-primary)' : 'var(--color-border)'} 
                          fillOpacity={entry.score > 0 ? 1 : 0.3}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : sessions.length > 0 && !isMounted ? (
              <div className="h-[240px] w-full bg-muted/20 animate-pulse rounded-2xl mt-auto" />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                <p className="text-sm font-medium">No quiz data yet.</p>
                <p className="text-xs mt-1">Complete a quiz to see your score history.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
