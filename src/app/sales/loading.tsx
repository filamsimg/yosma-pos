import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/ui/skeletons";

export default function SalesLoading() {
  return (
    <div className="space-y-4 p-4 animate-in fade-in-50 duration-300">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-sm" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 rounded-xs" />
            <Skeleton className="h-2.5 w-20 rounded-xs" />
          </div>
        </div>
        <Skeleton className="h-9 w-24 rounded-sm" />
      </div>

      {/* Search Input skeleton */}
      <Skeleton className="h-11 w-full rounded-sm" />

      {/* Category Pills skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-sm" />
        ))}
      </div>

      {/* Product Grid skeleton */}
      <ProductGridSkeleton count={8} layout="grid-2" />
    </div>
  );
}
