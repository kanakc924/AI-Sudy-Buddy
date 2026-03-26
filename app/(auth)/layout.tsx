import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative noise-bg overflow-hidden flex flex-col bg-background text-foreground">
      <div className="absolute top-4 left-4 z-50">
         <Link href="/">
           <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-card">
             <ArrowLeft className="w-5 h-5 text-muted-foreground" />
           </Button>
         </Link>
      </div>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center relative z-10 w-full">
        {children}
      </div>
    </div>
  )
}
