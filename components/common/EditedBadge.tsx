import { cn } from '@/lib/utils'

interface EditedBadgeProps {
  className?: string
}

export function EditedBadge({ className }: EditedBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full bg-violet/20 px-2 py-0.5 text-xs font-medium text-violet',
      className
    )}>
      Edited
    </span>
  )
}
