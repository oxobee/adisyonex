import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 animate-in fade-in-50 duration-200">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 sm:w-64 rounded-xl" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-lg opacity-70" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="size-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-md opacity-60" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs space-y-4">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
