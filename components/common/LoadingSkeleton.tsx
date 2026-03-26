export function LoadingSkeleton({ className = "", count = 1 }: { className?: string, count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`animate-pulse bg-surface2 rounded-md ${className}`} 
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass p-6 rounded-xl flex flex-col gap-4">
      <LoadingSkeleton className="h-6 w-3/4" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-2/3" />
      <div className="mt-4 flex gap-2">
        <LoadingSkeleton className="h-8 w-20" />
        <LoadingSkeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
