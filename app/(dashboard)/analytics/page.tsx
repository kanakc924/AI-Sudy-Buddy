'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, Bell, TrendingUp, Target, Award, Brain, 
  ArrowUpRight, ArrowDownRight, Zap, CheckCircle2, 
  Calendar, PieChart, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, 
  Tooltip as RechartsTooltip, PieChart as RePieChart, Pie, Sector
} from 'recharts'
import { useAuth } from '@/context/AuthContext'

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('@/services/api').then(({ getStats, getHeatmap, getStreak }) => {
      Promise.all([getStats(), getHeatmap(), getStreak()])
        .then(([statsRes, heatmapRes, streakRes]) => {
          setData({
            ...statsRes.data,
            activityHeatmap: heatmapRes.data || [],
            currentStreak: streakRes.data?.currentStreak || 0
          })
        })
        .catch(e => console.error("Error fetching analytics data", e))
        .finally(() => setLoading(false))
    })
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-[400px] bg-muted rounded-3xl" />
          <div className="lg:col-span-2 h-[400px] bg-muted rounded-3xl" />
        </div>
      </div>
    )
  }

  // Data mapping
  const subjectPerformance = data?.subjectMastery?.map((item: any, i: number) => ({
    subject: item.subject,
    score: item.score,
    color: ['var(--primary)', 'var(--mint)', 'var(--blue)', 'var(--pink)'][i % 4]
  })) || []

  const overallProgress = [
    { name: 'Completed', value: data?.topicProgress?.percentage || 0, fill: 'var(--primary)' },
    { name: 'Remaining', value: 100 - (data?.topicProgress?.percentage || 0), fill: 'var(--muted)' },
  ]

  const focusAreas = data?.weakTopics?.map((topic: any) => ({
    topic: topic.title,
    subject: topic.subject,
    score: topic.score,
    trend: topic.score < 50 ? 'down' : 'up'
  })) || []

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl border-border bg-card">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">Learning <span className="text-primary italic">Analytics</span></h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Performance Overview</p>
          </div>
        </div>
        <Button variant="outline" size="icon" className="rounded-xl border-border bg-card relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Cards */}
        <Card className="border-border bg-card rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Avg. Mastery</p>
            <h3 className="text-2xl font-bold">{data?.averageQuizScore || 0}%</h3>
          </div>
          <div className="ml-auto flex items-center text-xs font-bold text-[#4CAF50]">
            <ArrowUpRight className="w-3 h-3 mr-1" /> Best
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-mint" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Study Streak</p>
            <h3 className="text-2xl font-bold">{data?.currentStreak || 0} Days</h3>
          </div>
          <div className="ml-auto text-primary font-serif italic text-xl">🔥</div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-blue" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Today&apos;s Sessions</p>
            <h3 className="text-2xl font-bold">{data?.todaySessionCount || 0}</h3>
          </div>
          <div className="ml-auto flex items-center text-xs font-bold text-muted-foreground">
            Goal: 5
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Overall Progress & Focus Areas */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-border bg-linear-to-br from-primary/5 to-transparent rounded-3xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="font-serif text-lg font-bold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="h-[200px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={overallProgress}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {overallProgress.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{data?.topicProgress?.percentage || 0}%</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Complete</span>
                </div>
              </div>
              <div className="mt-6 w-full space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Topic Mastery</span>
                  <span className="font-bold text-foreground">{data?.topicProgress?.completed} / {data?.topicProgress?.total} Topics</span>
                </div>
                <Progress value={data?.topicProgress?.percentage || 0} className="h-2 rounded-full bg-muted [&>div]:bg-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card rounded-3xl shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="font-serif text-lg font-bold flex items-center gap-2">
                <Brain className="w-5 h-5 text-pink" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {focusAreas.map((area: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${area.trend === 'down' ? 'bg-pink/10' : 'bg-mint/10'}`}>
                      {area.trend === 'down' ? <ArrowDownRight className="w-5 h-5 text-pink" /> : <ArrowUpRight className="w-5 h-5 text-mint" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{area.topic}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{area.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{area.score}%</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Score</div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs font-bold text-primary hover:bg-primary/5 uppercase tracking-widest mt-2">
                View All Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Subject Performance */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border bg-card rounded-3xl shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue" />
                  Subject Mastery
                </CardTitle>
                <div className="flex gap-2">
                  {['Week', 'Month', 'Year'].map(tab => (
                    <Button key={tab} variant="ghost" className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase ${tab === 'Week' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                      {tab}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerformance} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="subject" 
                      type="category" 
                      stroke="var(--muted-foreground)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontWeight: 700 }}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                    />
                    <Bar 
                      dataKey="score" 
                      radius={[0, 6, 6, 0]} 
                      barSize={32}
                    >
                      {subjectPerformance.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Quiz Avg.', value: '82%', icon: CheckCircle2, color: 'text-mint' },
                  { label: 'Energy', value: 'High', icon: Zap, color: 'text-primary' },
                  { label: 'Consistency', value: '95%', icon: Calendar, color: 'text-pink' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col items-center text-center">
                    <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{stat.label}</span>
                    <span className="text-lg font-bold mt-1">{stat.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
