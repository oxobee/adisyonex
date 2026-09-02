"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { uuid } from "@/lib/uuid";
import type { MenuDTO } from "@/types/menu";
import type { OrderDTO, OrderLineDTO } from "@/types/order";

export type OfflineActionType =
  | "CREATE_ORDER"
  | "ADD_ITEMS"
  | "FIRE_ORDER"
  | "SERVE_LINE"
  | "VOID_LINE"
  | "SETTLE_ORDER"
  | "SETTLE_TABLE";

export interface OfflineMutation<T = unknown> {
  readonly id: string;
  readonly actionType: OfflineActionType;
  readonly payload: T;
  readonly createdAt: number;
  readonly isStaff?: boolean;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = "adisyonex_offline_queue_v1";
const SNAPSHOT_PREFIX = "adisyonex_cache_";

// --- Queue helpers ---

export function getOfflineQueue(): OfflineMutation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineMutation[]) : [];
  } catch (err) {
    console.error("Failed to read offline queue from storage:", err);
    return [];
  }
}

export function saveOfflineQueue(queue: readonly OfflineMutation[]): void {
  if (typeof window === "undefined") return;
  try {
    if (queue.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } else {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
    window.dispatchEvent(
      new CustomEvent("adisyonex:queue-updated", { detail: { count: queue.length } }),
    );
  } catch (err) {
    console.error("Failed to persist offline queue:", err);
  }
}

// --- Lightweight Snapshot Cache (Menu, Tables, Active Orders) ---

export function setCachedSnapshot<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${SNAPSHOT_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn("Storage limit reached or failed to cache snapshot:", err);
  }
}

export function getCachedSnapshot<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// --- Optimistic State Application (Instant Real-Time Offline UI Changes) ---

export function applyOptimisticMutation(mutation: OfflineMutation<any>): void {
  if (typeof window === "undefined") return;

  try {
    const cachedOpen = getCachedSnapshot<OrderDTO[]>("open_orders") || [];
    const cachedCompleted = getCachedSnapshot<OrderDTO[]>("completed_orders") || [];
    const cachedMenu = getCachedSnapshot<MenuDTO>("menu");

    switch (mutation.actionType) {
      case "CREATE_ORDER": {
        const p = mutation.payload;
        const lines: OrderLineDTO[] = (p.items || []).map((it: any) => {
          const menuItem = cachedMenu?.items.find((m) => m.id === it.menuItemId);
          const variant = menuItem?.variants.find((v) => v.id === it.variantId);
          const unitPrice = variant ? Number(variant.price) : menuItem ? Number(menuItem.price) : 0;
          return {
            id: uuid(),
            name: menuItem?.name || "Ürün",
            variantName: variant?.name || null,
            unitPrice,
            quantity: it.quantity || 1,
            lineNote: it.lineNote || null,
            state: "FIRED",
            isComp: Boolean(it.isComp),
            source: "STAFF",
            taxRate: 0,
            taxInclusive: true,
            modifiers: [],
          };
        });

        const grandTotal = lines.reduce(
          (s, l) => s + (l.isComp ? 0 : l.unitPrice * l.quantity),
          0,
        );

        const newOrder: OrderDTO = {
          id: p.idempotencyKey || mutation.id,
          orderNumber: Math.floor(Date.now() % 1000) + 100,
          invoiceNumber: null,
          orderType: p.orderType || "DINE_IN",
          status: "OPEN",
          tableLabel: p.tableLabel || null,
          tableId: p.tableId || null,
          customerName: null,
          customerPhone: p.customerPhone || null,
          customerAddress: p.customerAddress || null,
          note: p.note || null,
          subtotal: grandTotal,
          taxTotal: 0,
          discountTotal: 0,
          compTotal: 0,
          roundOff: 0,
          grandTotal,
          createdAt: new Date().toISOString(),
          settledAt: null,
          billRequestedAt: null,
          lines,
          payments: [],
        };

        const updatedOpen = [newOrder, ...cachedOpen];
        setCachedSnapshot("open_orders", updatedOpen);
        window.dispatchEvent(
          new CustomEvent("adisyonex:orders-updated", { detail: { open: updatedOpen } }),
        );
        break;
      }

      case "ADD_ITEMS": {
        const p = mutation.payload;
        const targetOrder = cachedOpen.find((o) => o.id === p.orderId);
        if (targetOrder) {
          const newLines: OrderLineDTO[] = (p.items || []).map((it: any) => {
            const menuItem = cachedMenu?.items.find((m) => m.id === it.menuItemId);
            const variant = menuItem?.variants.find((v) => v.id === it.variantId);
            const unitPrice = variant ? Number(variant.price) : menuItem ? Number(menuItem.price) : 0;
            return {
              id: uuid(),
              name: menuItem?.name || "Ürün",
              variantName: variant?.name || null,
              unitPrice,
              quantity: it.quantity || 1,
              lineNote: it.lineNote || null,
              state: "FIRED",
              isComp: Boolean(it.isComp),
              source: "STAFF",
              taxRate: 0,
              taxInclusive: true,
              modifiers: [],
            };
          });

          const updatedLines = [...targetOrder.lines, ...newLines];
          const grandTotal = updatedLines.reduce(
            (s, l) => s + (l.isComp || l.state === "VOID" ? 0 : l.unitPrice * l.quantity),
            0,
          );

          const updatedOrder: OrderDTO = {
            ...targetOrder,
            lines: updatedLines,
            grandTotal,
            subtotal: grandTotal,
          };

          const updatedOpen = cachedOpen.map((o) => (o.id === p.orderId ? updatedOrder : o));
          setCachedSnapshot("open_orders", updatedOpen);
          window.dispatchEvent(
            new CustomEvent("adisyonex:orders-updated", { detail: { open: updatedOpen } }),
          );
        }
        break;
      }

      case "SETTLE_TABLE": {
        const p = mutation.payload;
        const remainingOpen = cachedOpen.filter((o) => o.tableId !== p.tableId);
        const settledOrders = cachedOpen
          .filter((o) => o.tableId === p.tableId)
          .map((o) => ({
            ...o,
            status: "COMPLETED" as const,
            settledAt: new Date().toISOString(),
          }));

        setCachedSnapshot("open_orders", remainingOpen);
        setCachedSnapshot("completed_orders", [...settledOrders, ...cachedCompleted]);
        window.dispatchEvent(
          new CustomEvent("adisyonex:orders-updated", { detail: { open: remainingOpen } }),
        );
        break;
      }

      case "SETTLE_ORDER": {
        const p = mutation.payload;
        const remainingOpen = cachedOpen.filter((o) => o.id !== p.orderId);
        const targetOrder = cachedOpen.find((o) => o.id === p.orderId);
        if (targetOrder) {
          const settled = {
            ...targetOrder,
            status: "COMPLETED" as const,
            settledAt: new Date().toISOString(),
          };
          setCachedSnapshot("open_orders", remainingOpen);
          setCachedSnapshot("completed_orders", [settled, ...cachedCompleted]);
          window.dispatchEvent(
            new CustomEvent("adisyonex:orders-updated", { detail: { open: remainingOpen } }),
          );
        }
        break;
      }

      case "VOID_LINE": {
        const p = mutation.payload;
        const updatedOpen = cachedOpen.map((o) => {
          if (o.id === p.orderId) {
            const lines = o.lines.map((l) => (l.id === p.lineId ? { ...l, state: "VOID" as const } : l));
            const grandTotal = lines.reduce(
              (s, l) => s + (l.isComp || l.state === "VOID" ? 0 : l.unitPrice * l.quantity),
              0,
            );
            return { ...o, lines, grandTotal, subtotal: grandTotal };
          }
          return o;
        });
        setCachedSnapshot("open_orders", updatedOpen);
        window.dispatchEvent(
          new CustomEvent("adisyonex:orders-updated", { detail: { open: updatedOpen } }),
        );
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Failed to apply optimistic offline mutation:", err);
  }
}

/** Enqueue an offline mutation to local storage & apply optimistically */
export function enqueueOfflineMutation<T = unknown>(
  actionType: OfflineActionType,
  payload: T,
  isStaff = false,
): OfflineMutation<T> {
  const mutation: OfflineMutation<T> = {
    id: uuid(),
    actionType,
    payload,
    createdAt: Date.now(),
    isStaff,
    retryCount: 0,
  };

  const queue = getOfflineQueue();
  queue.push(mutation);
  saveOfflineQueue(queue);

  // Apply state optimistically so UI immediately updates offline!
  applyOptimisticMutation(mutation);

  return mutation;
}

/** Remove a single mutation once synced with the server */
export function removeOfflineMutation(id: string): void {
  const queue = getOfflineQueue().filter((m) => m.id !== id);
  saveOfflineQueue(queue);
}

/** Remove multiple synced mutations at once and reclaim device storage */
export function clearSyncedMutations(syncedIds: readonly string[]): void {
  if (syncedIds.length === 0) return;
  const set = new Set(syncedIds);
  const queue = getOfflineQueue().filter((m) => !set.has(m.id));
  saveOfflineQueue(queue);
}

// --- Sync Dispatcher ---

let isSyncInProgress = false;

export async function processOfflineSync(): Promise<{
  synced: number;
  failed: number;
}> {
  if (isSyncInProgress || typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  isSyncInProgress = true;
  window.dispatchEvent(new CustomEvent("adisyonex:sync-started"));

  let synced = 0;
  let failed = 0;
  const successfullySyncedIds: string[] = [];

  try {
    const {
      createOrderAction,
      addItemsAction,
      fireOrderAction,
      serveLineAction,
      voidLineAction,
      settleOrderAction,
      settleTableAction,
    } = await import("@/actions/order.actions");

    const {
      createWaiterOrderAction,
      addWaiterItemsAction,
    } = await import("@/actions/staff-order.actions");

    for (const mutation of queue) {
      try {
        let res: { success: boolean; error?: string | null } = { success: false };

        switch (mutation.actionType) {
          case "CREATE_ORDER":
            res = mutation.isStaff
              ? await createWaiterOrderAction(mutation.payload as any)
              : await createOrderAction(mutation.payload as any);
            break;

          case "ADD_ITEMS":
            res = mutation.isStaff
              ? await addWaiterItemsAction(mutation.payload as any)
              : await addItemsAction(mutation.payload as any);
            break;

          case "FIRE_ORDER":
            res = await fireOrderAction(mutation.payload as any);
            break;

          case "SERVE_LINE":
            res = await serveLineAction(mutation.payload as any);
            break;

          case "VOID_LINE":
            res = await voidLineAction(mutation.payload as any);
            break;

          case "SETTLE_ORDER":
            res = await settleOrderAction(mutation.payload as any);
            break;

          case "SETTLE_TABLE":
            res = await settleTableAction(mutation.payload as any);
            break;

          default:
            res = { success: true };
        }

        if (res?.success) {
          synced++;
          successfullySyncedIds.push(mutation.id);
        } else {
          mutation.retryCount += 1;
          failed++;
        }
      } catch (mutationErr) {
        console.error(`Mutation ${mutation.id} (${mutation.actionType}) sync error:`, mutationErr);
        mutation.retryCount += 1;
        failed++;
      }
    }

    // Immediately remove synced mutations from device memory/storage!
    clearSyncedMutations(successfullySyncedIds);

    if (synced > 0) {
      toast.success(`${synced} çevrimdışı işlem sunucuyla eşitlendi`, {
        description: "Lokal cihaz hafızası temizlendi.",
      });
      window.dispatchEvent(
        new CustomEvent("adisyonex:sync-completed", { detail: { synced, failed } }),
      );
    }
  } catch (err) {
    console.error("Global offline sync loop error:", err);
  } finally {
    isSyncInProgress = false;
  }

  return { synced, failed };
}

// --- React Hook: useOfflineSync ---

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const refreshCount = useCallback(() => {
    setPendingCount(getOfflineQueue().length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      toast.warning("İnternet bağlantısı yok", {
        description: "İşlemler cihazda kayıtlı. İnternet geldiğinde otomatik aktarılacak.",
      });
      return;
    }
    setIsSyncing(true);
    try {
      const res = await processOfflineSync();
      setLastSyncAt(new Date());
      refreshCount();
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      toast.info("İnternet bağlantısı sağlandı", {
        description: "Bekleyen çevrimdışı veriler sunucuyla eşitleniyor...",
      });
      void syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("İnternet bağlantısı kesildi", {
        description: "Çevrimdışı mod devrede. İşlemler lokal hafızada tutulacak.",
      });
    };

    const handleQueueChange = () => {
      refreshCount();
    };

    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => {
      setIsSyncing(false);
      refreshCount();
      setLastSyncAt(new Date());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("adisyonex:queue-updated", handleQueueChange);
    window.addEventListener("adisyonex:sync-started", handleSyncStart);
    window.addEventListener("adisyonex:sync-completed", handleSyncEnd);

    if (navigator.onLine && getOfflineQueue().length > 0) {
      void syncNow();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("adisyonex:queue-updated", handleQueueChange);
      window.removeEventListener("adisyonex:sync-started", handleSyncStart);
      window.removeEventListener("adisyonex:sync-completed", handleSyncEnd);
    };
  }, [refreshCount, syncNow]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    syncNow,
  };
}
