"use client";

import { useEffect } from "react";
import { syncOfflineQueue, getOfflineQueue } from "@/lib/offline-sync";

export function OfflineSyncManager() {
  useEffect(() => {
    // 1. Initial sync on mount if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      if (getOfflineQueue().length > 0) {
        syncOfflineQueue().catch(console.error);
      }
    }

    // 2. Online event listener
    const handleOnline = () => {
      syncOfflineQueue().catch(console.error);
    };

    window.addEventListener("online", handleOnline);

    // 3. Periodic retry check every 25 seconds
    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        if (getOfflineQueue().length > 0) {
          syncOfflineQueue().catch(console.error);
        }
      }
    }, 25000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  return null;
}
