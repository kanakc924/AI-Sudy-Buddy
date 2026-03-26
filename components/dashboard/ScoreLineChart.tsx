'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ScoreDataPoint } from '@/types'
import { cn } from '@/lib/utils'

interface ScoreLineChartProps {
  data: ScoreDataPoint[]
  className?: string
}

export function ScoreLineChart({ data, className }: ScoreLineChartProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('all')

  const topics = useMemo(() => {
    const uniqueTopics = [...new Set(data.map(d => d.topic))]
    return ['all', ...uniqueTopics]
  }, [data])

  const filteredData = useMemo(() => {
    if (selectedTopic === 'all') return data
    return data.filter(d => d.topic === selectedTopic)
  }, [data, selectedTopic])

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground">Quiz Score Trend</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your performance over recent sessions</p>
        </div>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by topic" />
          </SelectTrigger>
          <SelectContent>
            {topics.map(topic => (
              <SelectItem key={topic} value={topic}>
                {topic === 'all' ? 'All Topics' : topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2E2C29" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#7A7570" 
              tick={{ fill: '#7A7570', fontSize: 12 }}
              axisLine={{ stroke: '#2E2C29' }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#7A7570" 
              tick={{ fill: '#7A7570', fontSize: 12 }}
              axisLine={{ stroke: '#2E2C29' }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1A1917', 
                border: '1px solid #2E2C29',
                borderRadius: '8px',
                color: '#F2EDE4'
              }}
              labelStyle={{ color: '#7A7570', marginBottom: '4px' }}
              formatter={(value: any) => [`${value}%`, 'Score'] as any}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#7C5CFC" 
              strokeWidth={2}
              fill="url(#scoreGradient)"
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#7C5CFC" 
              strokeWidth={2}
              dot={{ fill: '#7C5CFC', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: '#7C5CFC', strokeWidth: 2, stroke: '#F2EDE4', r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
