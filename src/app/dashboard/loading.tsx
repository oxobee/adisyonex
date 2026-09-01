import { LottieLoader } from "@/components/shared/lottie-loader";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-[70svh] w-full flex flex-col items-center justify-center p-4 lg:p-6 animate-in fade-in-50 duration-200">
      {/* Background Ghost Skeletons */}
      <div className="w-full max-w-5xl opacity-20 pointer-events-none select-none blur-[1px] space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>

      {/* Centered Lottie Animated Loader */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center justify-center rounded-3xl bg-card/85 p-6 sm:p-8 shadow-2xl border border-primary/20 backdrop-blur-xl animate-in zoom-in-95 duration-200">
          <LottieLoader
            size="md"
            text="Yükleniyor…"
            className="p-0"
          />
        </div>
      </div>
    </div>
  );
}
