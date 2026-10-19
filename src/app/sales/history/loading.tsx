import { Skeleton } from "@/components/ui/skeleton";
import { HistoryCardSkeleton } from "@/components/ui/skeletons";

export default function SalesHistoryLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in-50 duration-300">
      <div className="bg-white border-b border-slate-100 px-5 py-6 shadow-xs sticky top-0 z-10 space-y-4">
        {/* Title skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-6 w-44 rounded-xs" />
          <Skeleton className="h-3 w-32 rounded-xs" />
        </div>

        {/* Highlight Omzet skeleton */}
        <Skeleton className="h-20 w-full rounded-sm" />

        {/* Quick Stats Grid skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 w-full rounded-sm" />
          <Skeleton className="h-16 w-full rounded-sm" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filter bar skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-sm" />
          <Skeleton className="h-10 w-28 rounded-sm" />
        </div>

        {/* Receipt Cards skeleton */}
        <HistoryCardSkeleton count={5} />
      </div>
    </div>
  );
}
