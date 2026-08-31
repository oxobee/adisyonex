"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ActivityIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  WifiIcon,
  WifiOffIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Initial online state
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setLastSyncTime(
        new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }

    const handleOnline = () => {
      setIsOnline(true);
      startTransition(() => {
        router.refresh();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        startTransition(() => {
          router.refresh();
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Continuous Real-Time Live Sync (every 3 seconds)
    const interval = setInterval(() => {
      if (!navigator.onLine || document.hidden) return;

      setIsSyncing(true);
      startTransition(() => {
        router.refresh();
        setLastSyncTime(
          new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
        setTimeout(() => setIsSyncing(false), 500);
      });
    }, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [router]);

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/15 px-3 py-1 text-xs font-black text-destructive shadow-sm animate-pulse"
        title="İnternet bağlantısı kesildi. Lütfen ağınızı kontrol edin."
      >
        <WifiOffIcon className="size-3.5 shrink-0 animate-bounce" />
        <span className="truncate">Bağlantı Yok</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs select-none"
      title={`Sistem Canlı ve Çevrimiçi · Son Güncelleme: ${lastSyncTime}`}
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
      </span>

      <span className="font-extrabold tracking-tight">Sistem Aktif</span>

      {isSyncing && (
        <RefreshCwIcon className="size-3 shrink-0 animate-spin opacity-80" />
      )}
    </div>
  );
}
