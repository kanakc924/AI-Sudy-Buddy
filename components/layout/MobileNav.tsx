'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, FolderOpen, Settings, LogOut, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SheetClose } from '@/components/ui/sheet'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Subjects', href: '/subjects', icon: FolderOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const aiUsagePercent = ((user.aiUsageToday ?? 0) / (user.aiDailyLimit ?? 200)) * 100
  const usageColor = aiUsagePercent > 95 ? 'bg-destructive' : aiUsagePercent > 80 ? 'bg-amber-500' : 'bg-primary'
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <BookOpen className="h-5 w-5" />
        </div>
        <span className="font-serif text-xl font-semibold">StudyBuddy</span>
      </div>

      {/* User Info */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-violet/10 text-violet">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <SheetClose key={item.name} asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet/10 text-violet'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </SheetClose>
          )
        })}
      </nav>

      {/* Streak Badge */}
      <div className="border-t border-border px-4 py-4">
        <div className={cn(
          'flex items-center gap-3 rounded-lg bg-gold/10 px-3 py-2',
          (user.streak ?? 0) > 5 && 'golden-pulse'
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20">
            <Flame className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gold">{user.streak ?? 0} day streak</p>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </div>
        </div>
      </div>

      {/* AI Usage Meter */}
      <div className="border-t border-border px-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI Usage</span>
            <span className="font-medium">
              {user.aiUsageToday ?? 0}/{user.aiDailyLimit ?? 200}
            </span>
          </div>
          <Progress 
            value={aiUsagePercent} 
            className="h-2"
            indicatorClassName={usageColor}
          />
          <p className="text-xs text-muted-foreground">Resets at midnight</p>
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-border p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  )
}
