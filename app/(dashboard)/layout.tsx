'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Navbar } from '@/components/layout/Navbar'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { SubjectProvider } from '@/context/SubjectContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <SubjectProvider>
      <div className="flex w-full min-h-screen bg-background text-foreground noise-bg overflow-x-hidden">
        <AppSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 lg:ml-60 pb-20 lg:pb-0 overflow-y-auto overflow-x-hidden min-w-0 min-h-screen relative z-10 flex flex-col">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
          <div className="flex-1">
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </SubjectProvider>
  )
}
