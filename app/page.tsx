'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight, Brain, Zap, Target, FileText, TrendingUp, Sparkles, Flame } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/hooks/useAuth'

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [router, user, loading])

  return (
    <div className="min-h-screen bg-background text-foreground noise-bg relative flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 rounded-lg p-2">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-medium tracking-wide">Study Buddy</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Log In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6"
            >
              <h1 className="font-serif text-5xl lg:text-6xl tracking-tight leading-tight text-foreground font-bold">
                The study partner that never sleeps.
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Track your streaks, analyze your weak spots, and level up your learning with a companion that understands your notes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-[#8F8DF2] hover:bg-[#8F8DF2]/90 text-white h-14 text-lg rounded-full px-8">
                    Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-lg rounded-xl border-border hover:bg-card">
                    Log In
                  </Button>
                </Link>
              </div>
              

            </motion.div>

            <div className="relative h-[400px] sm:h-[500px] flex items-center justify-center perspective-1000">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="w-full max-w-md bg-[#252833] rounded-2xl p-6 flex flex-col gap-6 border border-border/50 shadow-2xl shadow-primary/10"
              >
                {/* Streak Component */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-gold animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Current Streak</p>
                      <p className="text-xl font-bold text-white">7 Days</p>
                    </div>
                  </div>
                </div>

                {/* Heatmap Mockup */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">Study Activity</p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 28 }).map((_, i) => {
                      const intensities = ['bg-[#323645]', 'bg-[#8F8DF2]/30', 'bg-[#8F8DF2]/60', 'bg-[#8F8DF2]', 'bg-[#C4F2E8]/60', 'bg-[#C4F2E8]'];
                      // Predictable pattern instead of pure random for consistent visual
                      const pattern = [0, 0, 1, 3, 2, 0, 0, 0, 2, 4, 3, 5, 1, 0, 0, 1, 2, 3, 4, 5, 3, 0, 0, 0, 1, 0, 0, 0];
                      const intensity = intensities[pattern[i % pattern.length]];
                      return (
                        <div key={i} className={`w-full aspect-square rounded-sm ${i > 24 ? 'bg-[#323645]' : intensity}`}></div>
                      )
                    })}
                  </div>
                </div>

                {/* Insight Badge */}
                <div className="bg-[#8F8DF2]/10 border border-[#8F8DF2]/20 rounded-xl p-4 flex gap-3 items-start mt-2">
                  <Sparkles className="w-5 h-5 text-[#8F8DF2] shrink-0 mt-0.5" />
                  <p className="text-sm text-white/90 leading-relaxed">
                    <span className="font-semibold text-white">Insight:</span> You're struggling with <span className="italic">'Integrals'</span>. Generate a quick quiz?
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-16">How It Works</h2>
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
                  className="relative p-6 glass-card rounded-2xl overflow-hidden group hover:border-primary/50 transition-colors"
                >
                  <span className="absolute -top-4 -right-4 font-serif text-8xl text-primary/5 font-bold pointer-events-none group-hover:text-primary/10 transition-colors">
                    {i + 1}
                  </span>
                  <h3 className="font-serif text-xl mb-3 relative z-10">{step.title}</h3>
                  <p className="text-muted-foreground relative z-10">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-16">Everything you need to excel</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Brain, title: 'AI Generation', desc: 'State-of-the-art models extract key concepts automatically.' },
                { icon: Zap, title: 'Instant Flashcards', desc: 'Turn pages of notes into bite-sized review cards in seconds.' },
                { icon: Target, title: 'Smart Quizzes', desc: 'Test your knowledge with tricky multiple-choice questions.' },
                { icon: FileText, title: 'Clean Summaries', desc: 'Get the TL;DR of any long document or lecture transcript.' },
                { icon: TrendingUp, title: 'Track Progress', desc: 'Visualize your studying streak and mastery over time.' },
                { icon: Sparkles, title: 'Image Recognition', desc: 'Snap a picture of textbook pages to generate study aids.' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4, borderColor: 'var(--primary)' }}
                  className="glass-card glow-hover rounded-xl p-6"
                >
                  <div className="bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 text-center">
          <h2 className="font-serif text-3xl md:text-5xl mb-8 max-w-2xl mx-auto leading-tight">
            Ready to transform your study routine?
          </h2>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 text-lg rounded-xl shadow-lg shadow-primary/20">
              Get Started for Free
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
      </footer>
    </div>
  )
}
