import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

/**
 * Reusable skeleton loaders for consistent page transitions.
 */

export function StatCardSkeleton() {
  return <Skeleton className="h-24 w-full rounded-2xl" />;
}

export function SubjectCardSkeleton() {
  return <Skeleton className="h-48 w-full rounded-2xl" />;
}

export function TopicCardSkeleton() {
  return <Skeleton className="h-48 w-full rounded-3xl" />;
}

export function FlashcardSkeleton() {
  return <Skeleton className="h-[400px] w-full max-w-2xl mx-auto rounded-3xl" />;
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-border/50">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export function SummaryPageSkeleton() {
  return (
    <div className="space-y-8 p-4 md:p-8 animate-pulse">
      <div className="flex justify-between items-center mb-12">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl col-span-2" />
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

interface GridSkeletonProps {
  count?: number;
  columns?: string;
  children?: ReactNode;
}

export function GridSkeleton({ count = 3, columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", children }: GridSkeletonProps) {
  return (
    <div className={`grid gap-6 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children || <TopicCardSkeleton />}</div>
      ))}
    </div>
  );
}
