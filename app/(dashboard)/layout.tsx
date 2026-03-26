'use client'


import { AppSidebar } from '@/components/app-sidebar'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Navbar } from '@/components/layout/Navbar'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen bg-background text-foreground noise-bg">
      <AppSidebar />
      <main className="flex-1 lg:ml-60 pb-20 lg:pb-0 overflow-y-auto w-full min-h-screen relative z-10 flex flex-col">
        <Navbar onMenuClick={() => { }} />
        <div className="flex-1">
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
