'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight, Brain, Zap, Target, FileText, TrendingUp, Sparkles, Flame } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/hooks/useAuth'
import { FeatureCard, PrimaryButton } from '@/components/common'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [router, user, loading])

  return (
    <div className="min-h-screen bg-background text-foreground noise-bg relative flex flex-col selection:bg-primary/20">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="bg-primary/20 rounded-lg p-2 transition-transform group-hover:scale-110">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-medium tracking-wide">Study Buddy</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" className="rounded-xl">Log In</Button>
            </Link>
            <Link href="/register">
              <PrimaryButton>Get Started</PrimaryButton>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6 text-left"
            >
              <h1 className="font-serif text-5xl lg:text-7xl tracking-tight leading-[1.1] text-foreground font-black">
                The study partner that <span className="text-primary italic">never sleeps.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed font-medium">
                Track your streaks, analyze your weak spots, and level up your learning with a companion that understands your notes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <PrimaryButton className="w-full sm:w-auto h-14 text-lg rounded-full px-10">
                    Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                  </PrimaryButton>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto h-14 text-lg rounded-full border-border hover:bg-card px-10">
                    Log In
                  </Button>
                </Link>
              </div>
            </motion.div>

            <div className="relative h-[400px] sm:h-[500px] flex items-center justify-center perspective-1000">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="w-full max-w-md bg-card rounded-3xl p-8 flex flex-col gap-6 border border-border/50 shadow-2xl shadow-primary/10 relative z-10"
              >
                {/* Streak Component */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Current Streak</p>
                      <p className="text-2xl font-bold text-foreground">7 Days</p>
                    </div>
                  </div>
                </div>

                {/* Heatmap Mockup */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Study Activity
                  </p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 28 }).map((_, i) => {
                      const intensities = ['bg-muted/30', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80', 'bg-primary'];
                      const pattern = [0, 0, 1, 3, 2, 0, 0, 0, 2, 4, 3, 5, 1, 0, 0, 1, 2, 3, 4, 5, 3, 0, 0, 0, 1, 0, 0, 0];
                      const intensity = intensities[pattern[i % pattern.length]];
                      return (
                        <div key={i} className={cn("w-full aspect-square rounded-sm transition-colors duration-500", intensity)} />
                      )
                    })}
                  </div>
                </div>

                {/* Insight Badge */}
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3 items-start mt-2">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    <span className="font-bold text-foreground">Smart Insight:</span> You&apos;re struggling with <span className="italic font-medium text-primary">&apos;Integrals&apos;</span>. Generate a quick quiz?
                  </p>
                </div>
              </motion.div>
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/20 blur-[100px] rounded-full" />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4 bg-muted/20">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl text-center mb-16 font-bold tracking-tight">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Upload Your Notes', desc: 'Paste text or drop a file to instantly create a new topic.' },
                { title: 'AI Generates Content', desc: 'Our AI analyzes your materials and generates questions.' },
                { title: 'Study & Track Progress', desc: 'Review flashcards, take quizzes, and master the material.' }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative p-8 glass-card rounded-3xl overflow-hidden group hover:border-primary/50 transition-colors bg-card"
                >
                  <span className="absolute -top-6 -right-6 font-serif text-9xl text-primary/5 font-black pointer-events-none group-hover:text-primary/10 transition-colors">
                    {i + 1}
                  </span>
                  <h3 className="font-serif text-2xl mb-3 relative z-10 font-bold">{step.title}</h3>
                  <p className="text-muted-foreground relative z-10 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-4xl md:text-5xl mb-4 font-bold tracking-tight">Everything you need to excel</h2>
              <p className="text-muted-foreground text-lg">Powerful AI tools designed to help you learn faster and retain more information.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Brain, title: 'AI Generation', desc: 'State-of-the-art models extract key concepts automatically from your materials.' },
                { icon: Zap, title: 'Instant Flashcards', desc: 'Turn pages of notes into bite-sized review cards in just a few seconds.' },
                { icon: Target, title: 'Smart Quizzes', desc: 'Test your knowledge with adaptive, tricky multiple-choice questions.' },
                { icon: FileText, title: 'Clean Summaries', desc: 'Get the TL;DR of any long document, lecture transcript, or textbook chapter.' },
                { icon: TrendingUp, title: 'Track Progress', desc: 'Visualize your studying streak and topic mastery over time with beautiful charts.' },
                { icon: Sparkles, title: 'Vision Support', desc: 'Snap a picture of textbook pages or diagrams to generate high-quality study aids.' }
              ].map((feature, i) => (
                <FeatureCard 
                  key={i}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.desc}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-4 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-serif text-4xl md:text-6xl mb-8 font-black leading-tight tracking-tight">
              Ready to transform your <span className="text-primary italic">study routine?</span>
            </h2>
            <Link href="/register">
              <PrimaryButton className="h-16 px-12 text-xl rounded-full">
                Get Started for Free
              </PrimaryButton>
            </Link>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        </section>
      </main>

      <footer className="border-t border-border/50 py-12 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary/60" />
            <span className="font-serif text-lg font-medium text-muted-foreground">Study Buddy</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AI Study Buddy. Built for advanced academic excellence.</p>
        </div>
      </footer>
    </div>
  )
}

