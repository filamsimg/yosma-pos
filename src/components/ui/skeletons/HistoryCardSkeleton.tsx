import { Skeleton } from "@/components/ui/skeleton";

interface HistoryCardSkeletonProps {
  count?: number;
}

export function HistoryCardSkeleton({ count = 5 }: HistoryCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-sm border border-slate-100 bg-white p-4 space-y-3 shadow-xs"
        >
          {/* Header invoice & status */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-xs" />
              <Skeleton className="h-4 w-28 rounded-xs" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          {/* Body store name & details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36 rounded-xs" />
              <Skeleton className="h-4 w-24 rounded-xs" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded-xs" />
              <Skeleton className="h-3 w-16 rounded-xs" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
