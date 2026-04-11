'use client'

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Pencil, Trash2, ArrowRight, LucideIcon, FileText, Smartphone, Sparkles, Plus, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/**
 * GLASS CARD
 * BASE WRAPPER FOR PREMIUM TRANSLUCENT CARDS
 */
interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function GlassCard({ children, className, onClick, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : {}}
      onClick={onClick}
      className={cn(
        "glass-card bg-card/60 backdrop-blur-md border border-border/50 rounded-3xl overflow-hidden transition-all duration-300",
        hover && "hover:border-primary/50 cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

/**
 * STAT CARD
 * USED ON DASHBOARD AND SUBJECTS LIST
 */
interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  color?: string
  bg?: string
  delay?: number
}

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = "text-primary", 
  bg = "bg-primary/10",
  delay = 0 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard className="p-6 flex flex-col items-center justify-center gap-2 min-h-[140px] text-center">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-1", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {label}
        </p>
        <p className="text-3xl font-serif font-bold text-foreground">
          {value}
        </p>
      </GlassCard>
    </motion.div>
  )
}

/**
 * SUBJECT CARD
 * PRIMARY CARD FOR THE SUBJECTS GRID
 */
interface SubjectCardProps {
  subject: {
    _id: string
    title: string
    description?: string
    color?: string
    topicCount?: number
  }
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onClick: () => void
  delay?: number
}

export function SubjectCard({ subject, onEdit, onDelete, onClick, delay = 0 }: SubjectCardProps) {
  const color = subject.color || '#7C5CFC'
  const topicCount = subject.topicCount || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="h-full"
    >
      <GlassCard onClick={onClick} className="p-6 flex flex-col h-full group">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="p-3 rounded-xl transition-transform group-hover:scale-110" 
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <BookOpen className="w-6 h-6" style={{ color }} />
          </div>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card rounded-xl" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <h3 className="font-serif text-xl text-foreground mb-1 line-clamp-1">{subject.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">
          {subject.description || 'No description provided.'}
        </p>
        <div className="flex items-center justify-between text-xs font-medium pt-4 border-t border-border/50">
          <span className="bg-card px-2 py-1 rounded-md border border-border text-[#A0A6B8]">
            {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
          </span>
          <span className="flex items-center gap-1 text-primary font-bold group-hover:underline uppercase tracking-tighter">
            Study <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/**
 * TOPIC CARD
 * USED ON SUBJECT DETAIL PAGE
 */
interface TopicCardProps {
  topic: {
    _id: string
    title: string
    notes?: string
  }
  mastery: number
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onClick: () => void
  delay?: number
}

export function TopicCard({ topic, mastery, onEdit, onDelete, onClick, delay = 0 }: TopicCardProps) {
  const isMastered = mastery > 80
  const status = mastery === 0 ? 'Not Started' : (isMastered ? 'Mastered' : 'In Progress')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="h-full"
    >
      <GlassCard onClick={onClick} className="h-full group">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {topic.title}
              </h3>
              <div className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                mastery === 0 ? 'bg-muted text-muted-foreground' : (isMastered ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary')
              )}>
                {status}
              </div>
            </div>
            <div className="flex gap-1 items-center shrink-0" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 min-h-10 leading-relaxed">
            {topic.notes ? topic.notes.substring(0, 80) + '...' : 'Dive into details or extract key factors from your materials.'}
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Mastery</span>
              <span>{mastery}%</span>
            </div>
            <Progress value={mastery} className="h-1.5 rounded-full bg-muted [&>div]:bg-primary" />
          </div>

          <div className="flex items-center justify-end pt-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
              <ArrowRight className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/**
 * FEATURE CARD
 * USED ON LANDING PAGE
 */
interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <GlassCard className="p-6 glow-hover group min-h-[220px]">
        <div className="bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
          <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
        </div>
        <h3 className="font-serif text-xl mb-2 text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </GlassCard>
    </motion.div>
  )
}

/**
 * GENERATE CARD
 * USED ON TOPIC DETAIL GENERATE TAB
 */
interface GenerateCardProps {
  icon: LucideIcon
  title: string
  description: string
  color: string
  onGenerate: () => void
  onView: () => void
  loading?: boolean
  disabled?: boolean
}

export function GenerateCard({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  onGenerate, 
  onView, 
  loading, 
  disabled 
}: GenerateCardProps) {
  return (
    <GlassCard className="p-6 flex flex-col items-center text-center space-y-4 hover:border-border transition-all cursor-default">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-lg", color)}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-[200px] leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex gap-2 w-full pt-2">
        <Button 
          variant="outline" 
          onClick={onView} 
          disabled={disabled || loading}
          className="flex-1 rounded-xl h-11 font-bold border-border"
        >
          View Existing
        </Button>
        <Button 
          onClick={onGenerate} 
          disabled={disabled || loading}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Generate
        </Button>
      </div>
    </GlassCard>
  )
}

/**
 * FLASHCARD CARD
 * USED IN FLASHCARD SESSION (FRONT/BACK FLIP)
 */
interface FlashcardCardProps {
  question: string
  answer: string
  isFlipped: boolean
  onFlip: () => void
}

export function FlashcardCard({ question, answer, isFlipped, onFlip }: FlashcardCardProps) {
  return (
    <div 
      className="w-full max-w-2xl aspect-3/2 perspective-1000 cursor-pointer group"
      onClick={onFlip}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full h-full relative preserve-3d"
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <GlassCard className="w-full h-full p-12 flex flex-col items-center justify-center text-center border-2 border-primary/20 bg-card/80">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-8">Question</span>
            <div className="flex-1 flex items-center">
              <h2 className="text-2xl md:text-3xl font-serif font-bold leading-tight">
                {question}
              </h2>
            </div>
            <div className="mt-8 text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Smartphone className="w-3 h-3" /> Tap or click to reveal answer
            </div>
          </GlassCard>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)]">
          <GlassCard className="w-full h-full p-12 flex flex-col items-center justify-center text-center border-2 border-mint/20 bg-card shadow-mint/5 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-mint mb-8">Correct Answer</span>
            <div className="flex-1 flex items-center">
              <p className="text-xl md:text-2xl font-medium leading-relaxed">
                {answer}
              </p>
            </div>
            <div className="mt-8 text-mint/40 text-[10px] font-bold uppercase tracking-widest">
              Tap to Flip Back
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  )
}
