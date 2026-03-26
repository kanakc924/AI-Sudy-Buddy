export function LoadingSkeleton({ variant = 'default' }: { variant?: 'subjectCard' | 'topicCard' | 'statCard' | 'tableRow' | 'default' }) {
  const heightClass = {
    subjectCard: 'h-44',
    topicCard: 'h-36',
    statCard: 'h-24',
    tableRow: 'h-12',
    default: 'h-20'
  }[variant]

  return (
    <div className={`animate-pulse bg-card/50 rounded-xl border border-border/50 w-full ${heightClass}`} />
  )
}
