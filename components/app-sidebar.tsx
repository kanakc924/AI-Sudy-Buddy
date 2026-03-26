'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brain, LayoutDashboard, Settings, Plus, Flame, LogOut, ArrowRight, BookOpen } from 'lucide-react'
import { getSubjects, getProgress } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'


const SUBJECT_COLORS = [
  '#4CAF50', '#F7DF1E', '#E91E63', '#00BCD4', 
  '#FF5722', '#7C5CFC', '#9C27B0', '#D4A853'
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [subjects, setSubjects] = useState<any[]>([])
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.data)).catch(() => {})
    getProgress().then(res => setStreak(res.data?.currentStreak || 0)).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
  }

  // Assuming a static aiUsage for now, would be fetched in a real app
  const aiUsage = 45

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar border-r border-sidebar-border lg:flex">
      <div className="flex h-16 items-center px-4 gap-3 border-b border-sidebar-border/50 shrink-0">
        <div className="bg-primary/20 border border-primary/30 rounded-lg p-2">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-serif text-lg leading-tight tracking-wide text-sidebar-foreground">Study Buddy</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Learning</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6 scrollbar-hide">
        <div className="flex flex-col gap-1">
          <Link 
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === '/dashboard' ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link 
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === '/settings' ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subjects</h3>
          <div className="flex flex-col gap-1">
            {subjects.map((subject, i) => {
              const color = subject.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length]
              const isActive = pathname.includes(`/subjects/${subject._id}`)
              return (
                <Link 
                  key={subject._id}
                  href={`/subjects/${subject._id}`}
                  className={cn(
                    "flex flex-col gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors group",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      <BookOpen className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <span className="truncate flex-1">{subject.title}</span>
                  </div>
                </Link>
              )
            })}
            <Link 
              href="/subjects"
              className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Subject
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 border-t border-sidebar-border/50">
        <div className="glass-card rounded-xl p-3 relative overflow-hidden group">
          <div className={cn("absolute inset-0 bg-gold/5 blur-xl group-hover:bg-gold/10 transition-colors", streak > 5 && "streak-glow")} />
          <div className="relative flex items-center justify-between z-10">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Flame className="w-3 h-3 text-gold" /> Streak</span>
              <span className="font-serif text-2xl text-gold pt-1">{streak} <span className="text-xs text-muted-foreground font-sans">Days</span></span>
            </div>
            <ArrowRight className="w-4 h-4 text-gold/50 cursor-pointer hover:text-gold transition-colors" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary uppercase">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-foreground truncate">{user?.name || 'Loading...'}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email || ''}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
