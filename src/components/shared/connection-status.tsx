"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ActivityIcon,
  CheckCircle2Icon,
  HardDriveIcon,
  RefreshCwIcon,
  WifiIcon,
  WifiOffIcon,
} from "lucide-react";
import { useOfflineSync } from "@/lib/offline-sync";
import { cn } from "@/lib/utils";

export function ConnectionStatus({
  showLabel = true,
}: {
  readonly showLabel?: boolean;
} = {}) {
  const router = useRouter();
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLastSyncTime(
        new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }

    const interval = setInterval(() => {
      if (!navigator.onLine || document.hidden) return;
      startTransition(() => {
        router.refresh();
        setLastSyncTime(
          new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [router]);

  if (!isOnline) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold shadow-xs select-none",
          showLabel ? "px-2.5 py-1 text-xs" : "p-1.5",
        )}
        title="İnternet bağlantısı yok. Sistem çevrimdışı lokal kayıt modunda çalışıyor."
      >
        <WifiOffIcon className="size-3.5 shrink-0" />
        {showLabel && (
          <span className="truncate">
            Çevrimdışı (Lokal Aktif{pendingCount > 0 ? ` · ${pendingCount} Bekleyen` : ""})
          </span>
        )}
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        type="button"
        onClick={() => void syncNow()}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-400 font-bold shadow-xs transition-all hover:bg-sky-500/25 cursor-pointer select-none",
          showLabel ? "px-2.5 py-1 text-xs" : "p-1.5",
        )}
        title={`${pendingCount} bekleyen çevrimdışı işlem var. Sunucuyla eşitlemek için tıklayın.`}
      >
        <RefreshCwIcon
          className={cn("size-3.5 shrink-0", isSyncing && "animate-spin")}
        />
        {showLabel && (
          <span className="truncate">
            {isSyncing ? "Eşitleniyor…" : `Eşitle (${pendingCount})`}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs select-none",
        showLabel ? "px-3 py-1" : "p-1.5",
      )}
      title={`Sistem Çevrimiçi · Son Senkronizasyon: ${lastSyncTime}`}
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
      </span>

      {showLabel && <span className="font-extrabold tracking-tight">Sistem Aktif</span>}

      {isSyncing && (
        <RefreshCwIcon className="size-3 shrink-0 animate-spin opacity-80" />
      )}
    </div>
  );
}
