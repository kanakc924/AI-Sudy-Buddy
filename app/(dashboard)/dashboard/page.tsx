'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Brain, Target, Flame, AlertTriangle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getProgress } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProgress()
      .then(res => setData(res.data))
      .catch((e) => console.error("Error fetching progress", e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton variant="statCard" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton variant="subjectCard" />
            <LoadingSkeleton variant="subjectCard" />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton variant="topicCard" />
            <LoadingSkeleton variant="topicCard" />
          </div>
        </div>
      </div>
    )
  }

  // Fallbacks if data is missing
  const stats = [
    { label: 'Total Subjects', value: data?.totalSubjects || 0, icon: BookOpen, colorClass: 'border-primary bg-primary/10 text-primary' },
    { label: 'Study Sessions', value: data?.totalSessions || 0, icon: Brain, colorClass: 'border-primary bg-primary/10 text-primary' },
    { label: 'Avg Score', value: `${data?.averageQuizScore || 0}%`, icon: Target, colorClass: 'border-[#4CAF50] bg-[#4CAF50]/10 text-[#4CAF50]' },
    { label: 'Study Streak', value: `${data?.currentStreak || 0} Days`, icon: Flame, colorClass: 'border-gold bg-gold/10 text-gold', subtext: 'Keep it going!' },
  ]

  // Mock data for charts if API doesn't return it
  const scoreTrend = data?.scoreTrend || [
    { date: 'Mon', score: 65 }, { date: 'Tue', score: 70 }, { date: 'Wed', score: 68 },
    { date: 'Thu', score: 85 }, { date: 'Fri', score: 82 }, { date: 'Sat', score: 90 }, { date: 'Sun', score: 95 }
  ]

  // Generate 12 weeks * 7 days heatmap mock if missing
  const heatmapData = Array.from({ length: 12 * 7 }).map((_, i) => ({
    date: `Day ${i}`,
    count: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0
  }))
  
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-card'
    if (count === 1) return 'bg-primary/20'
    if (count === 2) return 'bg-primary/40'
    if (count === 3) return 'bg-primary/60'
    return 'bg-primary'
  }

  const aiUsage = data?.aiUsage || { count: 180, max: 200 }
  const usagePercent = Math.min(100, (aiUsage.count / aiUsage.max) * 100)
  const isUsageHigh = usagePercent >= 80

  const weakTopics = data?.weakTopics || [
    { _id: '1', name: 'Mitochondria function', subject: 'Biology', score: 45 },
    { _id: '2', name: 'Derivative rules', subject: 'Calculus', score: 55 }
  ]

  const recentSessions = data?.recentSessions || [
    { _id: '1', type: 'quiz', topic: 'React Hooks', subject: 'Web Dev', score: 90, timeAgo: '2h ago' },
    { _id: '2', type: 'flashcard', topic: 'French Vocab', subject: 'Languages', score: 100, timeAgo: '5h ago' }
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl md:text-4xl text-foreground">
          Welcome back, <span className="text-primary italic">{user?.name?.split(' ')[0] || 'Student'}</span>
        </h1>
        <p className="text-muted-foreground">Here's your study overview for today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card glow-hover border-border h-full">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className={`p-3 rounded-xl border ${stat.colorClass} shrink-0`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-serif font-bold text-foreground mt-0.5">{stat.value}</p>
                  {stat.subtext && <p className="text-[10px] text-muted-foreground mt-0.5">{stat.subtext}</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Heatmap */}
          <Card className="glass-card border-border overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-card/30">
              <CardTitle className="font-serif text-xl">Study Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="min-w-[600px]">
                  <TooltipProvider delayDuration={0}>
                    <div className="flex gap-2 items-start">
                      <div className="flex flex-col justify-between h-[116px] text-xs text-muted-foreground pr-2 pt-2">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                      </div>
                      <div className="grid grid-flow-col grid-rows-7 gap-1 flex-1">
                        {heatmapData.map((day, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger>
                              <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)} border border-border/10 hover:border-foreground/50 transition-colors`} />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-popover text-popover-foreground border-border text-xs">
                              {day.count} sessions on {day.date}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </TooltipProvider>
                  <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(c => (
                        <div key={c} className={`w-3 h-3 rounded-sm ${getHeatmapColor(c)} border border-border/10`} />
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Trend */}
          <Card className="glass-card border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-card/30">
              <CardTitle className="font-serif text-xl">Score Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* AI Usage */}
          <Card className="glass-card border-border">
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm text-muted-foreground">AI Generation Usage</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold">{aiUsage.count}</span>
                  <span className="text-muted-foreground text-sm">/ {aiUsage.max}</span>
                </div>
              </div>
              <Progress 
                value={usagePercent} 
                className={`h-2 mb-2 ${isUsageHigh ? 'bg-destructive/20 [&>div]:bg-destructive' : '[&>div]:bg-primary'}`} 
              />
              <div className="flex justify-between items-center text-xs">
                {isUsageHigh ? (
                  <span className="text-destructive flex items-center gap-1 font-medium"><AlertTriangle className="w-3 h-3" /> Nearing limit</span>
                ) : (
                  <span className="text-muted-foreground">Resets at midnight</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Needs Review */}
          <Card className="glass-card border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-card/30">
              <CardTitle className="font-serif text-xl">Needs Review</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">
              {weakTopics.length > 0 ? weakTopics.map((topic: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex flex-col overflow-hidden max-w-[140px] sm:max-w-[200px]">
                    <span className="font-medium text-sm truncate">{topic.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{topic.subject}</span>
                    <Progress value={topic.score} className="h-1 mt-1.5 [&>div]:bg-destructive" />
                  </div>
                  <Link href={`/topics/${topic._id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                      Study
                    </Button>
                  </Link>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">You're doing great! No weak topics found.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="glass-card border-border">
            <CardHeader className="pb-3 border-b border-border/50 bg-card/30 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-xl">History</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">
              {recentSessions.length > 0 ? recentSessions.map((session: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${session.type === 'quiz' ? 'bg-primary/15 text-primary' : 'bg-gold/15 text-gold'}`}>
                    {session.type === 'quiz' ? <Brain className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-medium text-sm truncate">{session.topic}</span>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="truncate">{session.subject}</span>
                      <span>{session.timeAgo}</span>
                    </div>
                  </div>
                  <div className={`font-serif font-bold text-sm shrink-0 ${session.score >= 80 ? 'text-[#4CAF50]' : session.score >= 50 ? 'text-gold' : 'text-destructive'}`}>
                    {session.score}%
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent sessions.</p>
              )}
              <Button variant="outline" className="w-full mt-2 text-xs border-border/50 hover:bg-card">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}