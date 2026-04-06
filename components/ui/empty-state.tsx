import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from './button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5 ${className}`}
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
          className="rounded-xl px-6 h-11 font-semibold flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
