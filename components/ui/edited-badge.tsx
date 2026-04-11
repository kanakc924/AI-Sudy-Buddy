'use client'

import { cn } from '@/lib/utils'

interface EditedBadgeProps {
  className?: string
}

export function EditedBadge({ className }: EditedBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20',
      className
    )}>
      Edited
    </span>
  )
}
