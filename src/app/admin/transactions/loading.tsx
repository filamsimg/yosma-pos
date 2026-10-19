import { Skeleton } from "@/components/ui/skeleton";
import { DashboardKPISkeleton, TableRowsSkeleton } from "@/components/ui/skeletons";

export default function AdminTransactionsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-xs" />
          <Skeleton className="h-4 w-72 rounded-xs" />
        </div>
        <Skeleton className="h-10 w-28 rounded-sm" />
      </div>

      {/* 4 Stat Cards skeleton */}
      <DashboardKPISkeleton count={4} />

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between p-2 rounded-sm border border-slate-200 bg-white gap-3">
        <Skeleton className="h-9 flex-1 rounded-sm" />
        <Skeleton className="h-9 w-64 rounded-sm" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-sm border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-xs" />
          <Skeleton className="h-4 w-20 rounded-xs" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <TableRowsSkeleton rows={8} columns={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
