import { Skeleton } from "@/components/ui/skeleton";

interface DashboardKPISkeletonProps {
  count?: number;
}

export function DashboardKPISkeleton({ count = 4 }: DashboardKPISkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-sm border border-slate-100 bg-white p-5 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-28 rounded-xs" />
            <Skeleton className="h-9 w-9 rounded-sm" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-6 w-36 rounded-xs" />
            <Skeleton className="h-3 w-20 rounded-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}
