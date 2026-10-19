import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridSkeletonProps {
  count?: number;
  layout?: 'grid-2' | 'grid-3' | 'grid-4';
}

export function ProductGridSkeleton({ count = 8, layout = 'grid-2' }: ProductGridSkeletonProps) {
  const gridColsClass = 
    layout === 'grid-4' 
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
      : layout === 'grid-3' 
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
      : 'grid-cols-2';

  return (
    <div className={`grid ${gridColsClass} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-sm border border-slate-100 bg-white p-3.5 space-y-3 shadow-xs"
        >
          {/* Badge & Category skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16 rounded-xs" />
            <Skeleton className="h-3.5 w-10 rounded-full" />
          </div>

          {/* Product Icon & Title skeleton */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-sm" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-full rounded-xs" />
              <Skeleton className="h-2.5 w-2/3 rounded-xs" />
            </div>
          </div>

          {/* Price & Action button skeleton */}
          <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-20 rounded-xs" />
              <Skeleton className="h-2.5 w-12 rounded-xs" />
            </div>
            <Skeleton className="h-8 w-8 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
