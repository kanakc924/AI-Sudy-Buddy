'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Brain, Target, Flame, AlertTriangle, ArrowRight, Sparkles, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getStats, getStreak, getHeatmap } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

import { 
  DashboardSkeleton, 
  EmptyState, 
  StatCard, 
  GlassCard,
  PageHeader
} from '@/components/common'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    Promise.all([getStats(), getStreak(), getHeatmap()])
      .then(([statsRes, streakRes, heatmapRes]) => {
        setData({
          ...statsRes.data,
          currentStreak: streakRes.data?.currentStreak || 0,
          activityHeatmap: heatmapRes.data || []
        })
      })
      .catch((e) => console.error("Error fetching dashboard data", e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  const stats = [
    { label: 'Total Subjects', value: data?.totalSubjects || 0, icon: BookOpen, colorClass: 'text-primary', bgClass: 'bg-primary/10' },
    { label: 'Study Sessions', value: data?.totalSessions || 0, icon: Brain, colorClass: 'text-primary', bgClass: 'bg-primary/10' },
    { label: 'Avg Score', value: `${data?.averageScore || 0}%`, icon: Target, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
    { label: 'Study Streak', value: `${data?.currentStreak || 0} Days`, icon: Flame, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  ]

  const scoreTrend = (data?.scoreTrend && data.scoreTrend.length > 0) ? data.scoreTrend : [];

  const heatmapData = Array.isArray(data?.activityHeatmap) && data.activityHeatmap.length > 0 
    ? data.activityHeatmap 
    : Array.from({ length: 12 * 7 }).map((_, i) => ({
        date: `Day ${i}`,
        count: 0
      }))
  
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-card'
    if (count === 1) return 'bg-primary/20'
    if (count === 2) return 'bg-primary/40'
    if (count === 3) return 'bg-primary/60'
    return 'bg-primary'
  }

  const aiUsage = data?.aiUsage || { count: 0, max: 200 }
  const usagePercent = Math.min(100, (aiUsage.count / aiUsage.max) * 100)
  const isUsageHigh = usagePercent >= 80

  const weakTopics = data?.weakTopics || []
  const recentSessions = data?.recentSessions || []

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="AI Study Buddy" 
        subtitle="Track your progress and level up your learning"
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
          <Flame className="w-4 h-4 text-primary" />
          <span className="font-bold text-primary text-xs uppercase tracking-wider">{data?.currentStreak || 0} Day Streak</span>
        </div>
      </PageHeader>

      {/* Goal Card */}
      <GlassCard className="relative overflow-hidden p-8 bg-linear-to-br from-[#8F8DF2]/20 to-[#C4F2E8]/20 border-primary/10" hover={false}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-serif font-black leading-tight text-foreground">
              Today&apos;s Study Goal: <br />
              <span className="text-primary italic">Keep the momentum going!</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-md font-medium">
              You&apos;ve completed <span className="text-foreground font-bold">{data?.todaySessionCount || 0}</span> sessions today. 
              {data?.todaySessionCount >= 5 
                ? " Brilliant work on hitting your daily rhythm!" 
                : " Try a few more sessions to reach your peak performance today."}
            </p>
          </div>
          <Card className="bg-card/40 backdrop-blur-sm border-white/10 shrink-0 w-full md:w-64 rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic Mastery</span>
                <span className="text-primary font-bold">{data?.topicProgress?.percentage || 0}%</span>
              </div>
              <Progress value={data?.topicProgress?.percentage || 0} className="h-2 [&>div]:bg-primary" />
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-center font-bold">
                {data?.topicProgress?.completed} of {data?.topicProgress?.total} topics mastered
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Abstract background decorations */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard 
            key={i}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.colorClass}
            bg={stat.bgClass}
            delay={i * 0.05}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col min-w-0">
          {/* Heatmap */}
          <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Study Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="min-w-[600px]">
                  <TooltipProvider delayDuration={0}>
                    <div className="flex gap-3 items-start">
                      <div className="grid grid-rows-7 gap-3.5 text-[9px] uppercase tracking-wider text-muted-foreground pr-2 font-bold pt-0.5">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <span key={day} className="h-3.5 flex items-center">{day}</span>
                        ))}
                      </div>
                      <div className="grid grid-flow-col grid-rows-7 gap-3.5 flex-1">
                        {heatmapData.map((day: { date: string; count: number }, i: number) => (
                          <Tooltip key={i}>
                            <TooltipTrigger>
                              <div className={cn(
                                "w-3.5 h-3.5 rounded-[3px] border border-border/10 hover:ring-2 hover:ring-primary/30 transition-all",
                                getHeatmapColor(day.count)
                              )} />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-popover text-popover-foreground border-border text-xs rounded-lg font-medium">
                              {day.count} sessions on {day.date}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </TooltipProvider>
                  <div className="flex items-center justify-end gap-3 mt-6 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span>Less</span>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4].map(c => (
                        <div key={c} className={cn("w-3 h-3 rounded-[2px]", getHeatmapColor(c))} />
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="font-serif text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[300px] w-full min-w-0">
              {isMounted && scoreTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontWeight: 600 }} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontWeight: 600 }} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                      cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className={cn("flex flex-col items-center justify-center text-center space-y-3 h-full rounded-2xl", scoreTrend.length === 0 && "bg-muted/5")}>
                  <Sparkles className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-sm font-serif font-medium text-muted-foreground">Complete target quizzes to see performance trends</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border-border bg-card rounded-3xl shadow-sm flex-1 flex flex-col min-h-[250px]">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="font-serif text-lg font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentSessions.length > 0 ? recentSessions.map((session: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition-all group">
                  <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110", session.type === 'quiz' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500')}>
                    {session.type === 'quiz' ? <Brain className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-bold text-sm truncate">{session.topic}</span>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1">
                      <span className="truncate pr-2">{session.subject}</span>
                      <span className="shrink-0">{session.timeAgo}</span>
                    </div>
                  </div>
                  <div className={cn("font-serif font-black text-xl shrink-0", session.score >= 80 ? 'text-emerald-500' : session.score >= 50 ? 'text-primary' : 'text-destructive')}>
                    {session.score}%
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center md:col-span-2">
                  <EmptyState variant="content" className="border-none bg-transparent py-4" onAction={() => router.push('/subjects')} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 flex flex-col">
          {/* AI Usage */}
          <Card className="border-border bg-card rounded-3xl shadow-sm border-l-4 border-l-primary overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Daily Quota</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Usage Metrics</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-black">{aiUsage.count}</span>
                  <span className="text-muted-foreground text-xs font-bold">/ {aiUsage.max}</span>
                </div>
              </div>
              <Progress 
                value={usagePercent} 
                className={cn("h-2.5 mb-2 rounded-full", isUsageHigh ? 'bg-destructive/10 [&>div]:bg-destructive' : 'bg-muted [&>div]:bg-primary')} 
              />
              {isUsageHigh && (
                <div className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> System Load Warning
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weak Topics */}
          {weakTopics.length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5 rounded-3xl shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
              <CardHeader className="pb-3 border-b border-amber-500/10 bg-amber-500/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 font-serif uppercase tracking-tight">
                  <AlertTriangle className="w-4 h-4" />
                  Concentrated Focus Required
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {weakTopics.map((topic: any, i: number) => (
                  <Link key={topic._id} href={`/topics/${topic._id}`} className="block group">
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate group-hover:text-amber-600 transition-colors">{topic.title}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">{topic.subject}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-black text-amber-600">{topic.score}%</span>
                        <div className="w-12 h-1 bg-amber-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${topic.score}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Subject Mastery List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold">Your Subjects</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
                  className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground transition-all"
                >
                  <motion.div animate={{ rotate: isSubjectsExpanded ? 0 : 180 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </Button>
              </div>
              <Link href="/subjects">
                <Button variant="ghost" size="sm" className="text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 rounded-xl px-3 h-8">View Archive</Button>
              </Link>
            </div>

            <AnimatePresence initial={false}>
              {isSubjectsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  {data?.subjectMastery?.length > 0 ? data.subjectMastery.map((item: any, i: number) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ x: 5 }} 
                      className="group cursor-pointer" 
                      onClick={() => router.push(`/subjects`)}
                    >
                      <Card className="border-border bg-card rounded-2xl overflow-hidden transition-all hover:border-primary/50 shadow-sm hover:shadow-md">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <h4 className="font-bold text-sm truncate">{item.subject}</h4>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                  {item.topicCount} {item.topicCount === 1 ? 'topic' : 'topics'}
                                </span>
                              </div>
                              <span className="text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-widest">{item.score}% Mastery</span>
                            </div>
                            <Progress value={item.score} className="h-1 mt-2 bg-muted [&>div]:bg-primary" />
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )) : (
                    <EmptyState variant="subjects" className="py-8 border-none bg-muted/5" onAction={() => router.push('/subjects')} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}