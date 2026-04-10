'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Settings, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()
  
  const isDashboard = pathname === '/dashboard'
  const isSubjects = pathname.startsWith('/subjects') && !pathname.includes('/topics/')
  const isTopic = pathname.includes('/topics/')
  const isSettings = pathname === '/settings'

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', active: isDashboard },
    { href: '/subjects', icon: BookOpen, label: 'Subjects', active: isSubjects },
    { href: '/settings', icon: Settings, label: 'Settings', active: isSettings },
  ]

  // Add a dynamic topic tab if we are deep linked
  if (isTopic) {
    navItems.splice(2, 0, { href: pathname, icon: Brain, label: 'Topic', active: true })
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 pb-safe pt-2 no-print">
      {navItems.map((item) => (
        <Link 
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] p-2 transition-colors",
            item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          {item.active && (
            <div className="w-1 h-1 bg-primary rounded-full mt-1 animate-in zoom-in" />
          )}
        </Link>
      ))}
    </nav>
  )
}
