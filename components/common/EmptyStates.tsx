'use client'

import React from 'react';
import { LucideIcon, Plus, BookOpen, Brain, FileText, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * EMPTY STATES CONFIGURATION
 * CENTRALIZED DEFINITIONS FOR ALL EMPTY STATES IN THE APP
 */
const EMPTY_STATE_VARIANTS = {
  subjects: {
    icon: BookOpen,
    title: "No subjects yet",
    description: "Create your first subject to start organizing your study materials and track progress.",
    actionLabel: "New Subject"
  },
  topics: {
    icon: Brain,
    title: "No topics for this subject",
    description: "Add your first topic to start generating AI study materials like flashcards and quizzes.",
    actionLabel: "Add Topic"
  },
  content: {
    icon: Sparkles,
    title: "No content generated yet",
    description: "Ready for a deep dive? Generate flashcards, quizzes, or summaries to start mastering this topic.",
    actionLabel: "Generate Content"
  },
  search: {
    icon: Search,
    title: "No results matching your query",
    description: "We couldn't find what you're looking for. Try a different keyword or browse all items.",
    actionLabel: "Clear Search"
  },
  library: {
    icon: FileText,
    title: "Your library is empty",
    description: "Upload sources like PDFs or images to build your study library. This helps the AI generate more accurate content.",
    actionLabel: "Upload Source"
  }
} as const;

export type EmptyStateVariant = keyof typeof EMPTY_STATE_VARIANTS;

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * REUSABLE EMPTY STATE COMPONENT
 * CAN BE USED WITH PREDEFINED VARIANTS OR CUSTOM PROPS
 */
export function EmptyState({
  variant,
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  onAction,
  className
}: EmptyStateProps) {
  // Determine final values based on variant or custom props
  const config = variant ? EMPTY_STATE_VARIANTS[variant] : null;
  
  const Icon = customIcon || config?.icon || Sparkles;
  const title = customTitle || config?.title || "No data yet";
  const description = customDescription || config?.description || "Start adding content to see it listed here.";
  const actionLabel = customActionLabel || config?.actionLabel;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
        <Icon className="w-8 h-8 text-primary opacity-60" />
      </div>
      <h3 className="font-serif text-2xl font-bold tracking-tight mb-2 text-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm max-w-[320px] mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-11 font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          <Plus size={18} />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
