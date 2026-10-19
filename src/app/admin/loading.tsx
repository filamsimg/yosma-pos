import { Skeleton } from "@/components/ui/skeleton";
import { DashboardKPISkeleton, TableRowsSkeleton } from "@/components/ui/skeletons";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-xs" />
        <Skeleton className="h-4 w-96 rounded-xs" />
      </div>

      {/* KPI Cards skeleton */}
      <DashboardKPISkeleton count={4} />

      {/* Content & Table skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-sm border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <Skeleton className="h-5 w-36 rounded-xs" />
            <Skeleton className="h-4 w-16 rounded-xs" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                <TableRowsSkeleton rows={5} columns={4} />
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-sm border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
          <Skeleton className="h-5 w-32 rounded-xs pb-3 border-b border-slate-50" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-full rounded-xs" />
                  <Skeleton className="h-2.5 w-1/2 rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
