"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeftIcon,
  ArrowUpDownIcon,
  BellRingIcon,
  CheckCircle2Icon,
  CheckIcon,
  CreditCardIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  MergeIcon,
  PlusCircleIcon,
  PrinterIcon,
  ReceiptIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  UtensilsIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { deliverTableOrdersAction, voidOrderAction } from "@/actions/order.actions";
import { PackagedDeliveryDialog } from "@/components/waiter/packaged-delivery-dialog";
import { TableActionMenu } from "@/components/orders/table-action-menu";
import { MaterialTableCard } from "@/components/orders/material-table-card";
import { TableActionModal } from "@/components/orders/table-action-modal";
import { TableBillModal } from "@/components/orders/table-bill-modal";
import { TableCard, type TableStatus } from "@/components/orders/table-card";
import { TableDetailModal } from "@/components/orders/table-detail-modal";
import { TablePosModal } from "@/components/orders/table-pos-modal";
import { TableSettleDialog } from "@/components/orders/table-settle-dialog";
import { TransferMergeDialog } from "@/components/orders/transfer-merge-dialog";
import { orderRunningTotal } from "@/components/pos/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KitchenStatusBadge } from "@/components/shared/kitchen-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { SelfOrderBadge } from "@/components/shared/self-order-badge";
import { SoundToggle } from "@/components/shared/sound-toggle";
import { useAnnouncer } from "@/hooks/use-announcer";
import { useServerAction } from "@/hooks/use-server-action";
import {
  alertSignatureMap,
  newOrderAlerts,
  newOrderPhrase,
  selfOrderAlertPhrase,
} from "@/lib/announce";
import { dismissWaiterCallAction } from "@/actions/guest-order.actions";
import { formatCurrency, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuDTO } from "@/types/menu";
import type { OrderDTO, TodaySalesDTO } from "@/types/order";
import type { TableDTO } from "@/types/table";

type ViewMode = "TABLE_GRID" | "ORDER_LIST" | "COMPLETED";

const activeCount = (lines: OrderDTO["lines"]) =>
  lines.filter((l) => l.state !== "VOID").reduce((s, l) => s + l.quantity, 0);

const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

interface TableGroup {
  readonly key: string;
  readonly tableLabel: string | null;
  readonly orders: readonly OrderDTO[];
  readonly total: number;
}

const groupByTable = (orders: readonly OrderDTO[]): TableGroup[] => {
  const map = new Map<string, OrderDTO[]>();
  for (const order of orders) {
    const key =
      order.tableId ??
      (order.tableLabel ? `label:${order.tableLabel}` : `solo:${order.id}`);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(order);
    } else {
      map.set(key, [order]);
    }
  }
  return [...map.entries()].map(([key, group]) => ({
    key,
    tableLabel: group[0]?.tableLabel ?? null,
    orders: group,
    total: round2(group.reduce((s, o) => s + orderRunningTotal(o), 0)),
  }));
};

/** Pleasant 3-tone chime for bill request notifications */
const playBillAlertSound = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);

    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1046.5, now + 0.3);
    gain3.gain.setValueAtTime(0.4, now + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.3);
    osc3.stop(now + 0.8);
  } catch {}
};

import { getCachedSnapshot, setCachedSnapshot } from "@/lib/offline-sync";

export function OrdersBoard({
  open,
  completed,
  sales,
  tables = [],
  menu,
  restaurantName = "Restoran",
  restaurantTagline,
}: {
  readonly open: readonly OrderDTO[];
  readonly completed: readonly OrderDTO[];
  readonly sales: TodaySalesDTO;
  readonly tables?: readonly TableDTO[];
  readonly menu?: MenuDTO | null;
  readonly restaurantName?: string;
  readonly restaurantTagline?: string | null;
}) {
  const router = useRouter();
  const [openOrders, setOpenOrders] = useState<readonly OrderDTO[]>(() => {
    return open.length > 0 ? open : (getCachedSnapshot<OrderDTO[]>("open_orders") || []);
  });
  const [completedOrders, setCompletedOrders] = useState<readonly OrderDTO[]>(() => {
    return completed.length > 0 ? completed : (getCachedSnapshot<OrderDTO[]>("completed_orders") || []);
  });

  const [viewMode, setViewMode] = useState<ViewMode>("TABLE_GRID");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<
    "NAME_ASC" | "NAME_DESC" | "OCCUPIED_FIRST" | "EMPTY_FIRST"
  >("NAME_ASC");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Sync server props and cache snapshots to device storage
  useEffect(() => {
    if (open && open.length >= 0) {
      setOpenOrders(open);
      setCachedSnapshot("open_orders", open);
    }
    if (completed && completed.length >= 0) {
      setCompletedOrders(completed);
      setCachedSnapshot("completed_orders", completed);
    }
    if (tables && tables.length > 0) {
      setCachedSnapshot("tables", tables);
    }
    if (menu) {
      setCachedSnapshot("menu", menu);
    }
  }, [open, completed, tables, menu]);

  // Listen for optimistic offline mutations (instant UI reaction)
  useEffect(() => {
    const handleOrdersUpdated = () => {
      const cachedOpen = getCachedSnapshot<OrderDTO[]>("open_orders");
      const cachedCompleted = getCachedSnapshot<OrderDTO[]>("completed_orders");
      if (cachedOpen) setOpenOrders(cachedOpen);
      if (cachedCompleted) setCompletedOrders(cachedCompleted);
    };

    window.addEventListener("adisyonex:orders-updated", handleOrdersUpdated);
    return () => {
      window.removeEventListener("adisyonex:orders-updated", handleOrdersUpdated);
    };
  }, []);

  // Spotlight State
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Dialog States
  const [printBillTable, setPrintBillTable] = useState<{
    table: TableDTO;
    orders: readonly OrderDTO[];
  } | null>(null);
  const [posModalTable, setPosModalTable] = useState<{
    table: TableDTO;
    orders: readonly OrderDTO[];
  } | null>(null);
  const [settleTableModal, setSettleTableModal] = useState<{
    table: TableDTO;
    orders: readonly OrderDTO[];
  } | null>(null);
  const [settleGroup, setSettleGroup] = useState<TableGroup | null>(null);
  const [transferDialog, setTransferDialog] = useState<{
    table: TableDTO;
    mode: "TRANSFER" | "MERGE";
  } | null>(null);
  const [detailModalTable, setDetailModalTable] = useState<{
    table: TableDTO;
    orders: readonly OrderDTO[];
  } | null>(null);
  const [detailGroup, setDetailGroup] = useState<TableGroup | null>(null);
  const [voidConfirmTable, setVoidConfirmTable] = useState<TableDTO | null>(null);
  const [selectedPackagedOrder, setSelectedPackagedOrder] = useState<OrderDTO | null>(null);

  const { supported, enabled, toggle, announce } = useAnnouncer();
  const prevMapRef = useRef<Map<string, number> | null>(null);
  const prevBillRequestsRef = useRef<Set<string>>(new Set());

  // Group open orders by tableId / tableLabel
  const groups = useMemo(() => groupByTable(openOrders), [openOrders]);

  const ordersByTableId = useMemo(() => {
    const map = new Map<string, OrderDTO[]>();
    for (const order of openOrders) {
      if (order.tableId) {
        const bucket = map.get(order.tableId);
        if (bucket) bucket.push(order);
        else map.set(order.tableId, [order]);
      }
    }
    return map;
  }, [openOrders]);

  // Extract unique Salon / Sections from tables
  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const t of tables) {
      if (t.section && t.section.trim()) {
        set.add(t.section.trim());
      }
    }
    return Array.from(set);
  }, [tables]);

  const occupiedTablesCount = useMemo(() => {
    return tables.filter((t) => (ordersByTableId.get(t.id) ?? []).length > 0).length;
  }, [tables, ordersByTableId]);

  const emptyTablesCount = Math.max(0, tables.length - occupiedTablesCount);

  const totalActiveRevenue = useMemo(() => {
    return openOrders.reduce((sum, o) => sum + orderRunningTotal(o), 0);
  }, [openOrders]);

  // Track bill requests & announce new orders
  useEffect(() => {
    const toSignatures = (ords: readonly OrderDTO[]) =>
      ords.map((o) => ({
        id: o.id,
        selfOrderLines: o.lines.filter(
          (l) => l.source === "SELF_ORDER" && l.state !== "VOID",
        ).length,
      }));

    const sigs = toSignatures(open);
    const nextMap = alertSignatureMap(sigs);
    if (prevMapRef.current === null) {
      prevMapRef.current = nextMap;
      return;
    }
    const alerts = newOrderAlerts(prevMapRef.current, sigs);
    prevMapRef.current = nextMap;
    for (const a of alerts) {
      const order = openOrders.find((o) => o.id === a.id);
      if (!order) continue;
      const phrase =
        a.isSelfOrder
          ? selfOrderAlertPhrase(order)
          : newOrderPhrase(order);
      announce(phrase, "beep");
    }
  }, [openOrders, announce]);

  // Active bill requests
  const activeBillRequests = useMemo(
    () => openOrders.filter((o) => o.billRequestedAt !== null),
    [openOrders],
  );

  useEffect(() => {
    const currentBillIds = new Set(activeBillRequests.map((o) => o.id));
    const isNewRequest = activeBillRequests.some(
      (o) => !prevBillRequestsRef.current.has(o.id),
    );

    if (isNewRequest && activeBillRequests.length > 0) {
      playBillAlertSound();
      const latestReq = activeBillRequests[activeBillRequests.length - 1];
      announce(
        `Masa ${latestReq.tableLabel ?? latestReq.orderNumber} hesap talep etti.`,
        "boop",
      );
      toast.warning(
        `🧾 ${latestReq.tableLabel ?? `#${latestReq.orderNumber}`} Masası Hesap İstedi!`,
        {
          description: "Müşteri QR menüden hesap istedi.",
          duration: 8000,
        },
      );
    }
    prevBillRequestsRef.current = currentBillIds;
  }, [activeBillRequests, announce]);

  // Auto-refresh orders board hands-free with visibility awareness
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(() => {
      if (!document.hidden) {
        router.refresh();
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  // Active waiter calls
  const activeWaiterCalls = useMemo(
    () => openOrders.filter((o) => o.note?.includes("GARSON")),
    [openOrders],
  );
  const prevWaiterCallsRef = useRef<Set<string>>(new Set());

  const handleDismissWaiterCall = useCallback(
    async (orderId: string) => {
      const previousOrders = openOrders;
      setOpenOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, note: (o.note || "").replace(/\[GARSON_CAGIRILDI\]/g, "").trim() || null }
            : o,
        ),
      );

      try {
        const res = await dismissWaiterCallAction({ orderId });
        if (res.success) {
          toast.success("Garson çağrısı kapatıldı ✓");
          router.refresh();
        } else {
          setOpenOrders(previousOrders);
          toast.error(res.error || "Çağrı kapatılamadı.");
        }
      } catch {
        setOpenOrders(previousOrders);
        toast.error("Çağrı kapatılamadı.");
      }
    },
    [openOrders, router],
  );

  useEffect(() => {
    const currentCallIds = new Set(activeWaiterCalls.map((o) => o.id));
    const isNewCall = activeWaiterCalls.some(
      (o) => !prevWaiterCallsRef.current.has(o.id),
    );

    if (isNewCall && activeWaiterCalls.length > 0) {
      playBillAlertSound();
      const latestCall = activeWaiterCalls[activeWaiterCalls.length - 1];
      announce(
        `Masa ${latestCall.tableLabel ?? latestCall.orderNumber} garson çağırıyor.`,
        "beep",
      );
      toast.error(
        `🛎️ ${latestCall.tableLabel ?? `#${latestCall.orderNumber}`} Masası Garson Çağırdı!`,
        {
          description: "Müşteri masaya servis personeli talep etti.",
          duration: 10000,
          action: {
            label: "Çağrıyı Kapat",
            onClick: () => handleDismissWaiterCall(latestCall.id),
          },
        },
      );
    }
    prevWaiterCallsRef.current = currentCallIds;
  }, [activeWaiterCalls, announce, handleDismissWaiterCall]);

  // Server action for voiding an order
  const voidAction = useServerAction(voidOrderAction, {
    onSuccess: () => {
      toast.success("Masa adisyonu başarıyla iptal edildi.");
      setVoidConfirmTable(null);
      setSelectedTableId(null);
      router.refresh();
    },
    onError: (err) => toast.error(err || "İptal işlemi başarısız."),
  });

  // Filtered & Sorted Tables
  const filteredTables = useMemo(() => {
    const list = tables.filter((t) => {
      if (!t.isActive) return false;
      if (selectedSection !== "ALL" && t.section !== selectedSection) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          t.label.toLowerCase().includes(q) ||
          (t.section && t.section.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortMode === "OCCUPIED_FIRST" || sortMode === "EMPTY_FIRST") {
        const aOcc = (ordersByTableId.get(a.id) ?? []).length > 0;
        const bOcc = (ordersByTableId.get(b.id) ?? []).length > 0;
        if (aOcc !== bOcc) {
          return sortMode === "OCCUPIED_FIRST" ? (bOcc ? 1 : -1) : (aOcc ? 1 : -1);
        }
      }
      if (sortMode === "NAME_DESC") {
        return b.label.localeCompare(a.label, "tr", { numeric: true, sensitivity: "base" });
      }
      // Default: Natural numeric comparison (e.g. Masa 1, Masa 2 ... Masa 15)
      return a.label.localeCompare(b.label, "tr", { numeric: true, sensitivity: "base" });
    });
  }, [tables, selectedSection, searchQuery, sortMode, ordersByTableId]);

  // Calculate Table Stats
  const tableStats = useMemo(() => {
    let empty = 0;
    let occupied = 0;
    let billCount = 0;

    for (const t of tables) {
      if (!t.isActive) continue;
      const tableOrders = ordersByTableId.get(t.id) ?? [];
      if (tableOrders.length > 0) {
        occupied += 1;
        if (tableOrders.some((o) => o.billRequestedAt !== null)) {
          billCount += 1;
        }
      } else {
        empty += 1;
      }
    }
    return { empty, occupied, total: tables.length, billCount };
  }, [tables, ordersByTableId]);

  const selectedTable = useMemo(
    () => (selectedTableId ? tables.find((t) => t.id === selectedTableId) ?? null : null),
    [tables, selectedTableId],
  );

  const selectedTableOrders = useMemo(
    () => (selectedTableId ? ordersByTableId.get(selectedTableId) ?? [] : []),
    [ordersByTableId, selectedTableId],
  );

  const selectedTableTotal = useMemo(
    () =>
      round2(
        selectedTableOrders.reduce(
          (sum, o) => sum + orderRunningTotal(o),
          0,
        ),
      ),
    [selectedTableOrders],
  );

  const selectedTableFirstOrderAt = useMemo(
    () =>
      selectedTableOrders.length > 0 ? selectedTableOrders[0].createdAt : null,
    [selectedTableOrders],
  );

  const selectedTableStatus: TableStatus =
    selectedTableOrders.length > 0 ? "OCCUPIED" : "EMPTY";

  // Handlers for table actions (close table action modal and open target dialog)
  const handlePrintBill = (t: TableDTO, ords: readonly OrderDTO[]) => {
    setSelectedTableId(null);
    setPrintBillTable({ table: t, orders: ords });
  };

  const handleAddProduct = (t: TableDTO, ords: readonly OrderDTO[]) => {
    setSelectedTableId(null);
    setPosModalTable({ table: t, orders: ords });
  };

  const handleSettle = (t: TableDTO, ords: readonly OrderDTO[]) => {
    if (ords.length === 0) return;
    setSelectedTableId(null);
    setSettleTableModal({ table: t, orders: ords });
  };

  const handleTransfer = (t: TableDTO) => {
    setSelectedTableId(null);
    setTransferDialog({ table: t, mode: "TRANSFER" });
  };

  const handleMerge = (t: TableDTO) => {
    setSelectedTableId(null);
    setTransferDialog({ table: t, mode: "MERGE" });
  };

  const handleViewDetails = (t: TableDTO, ords: readonly OrderDTO[]) => {
    setSelectedTableId(null);
    setDetailModalTable({ table: t, orders: ords });
  };

  const handleVoid = (t: TableDTO) => {
    setSelectedTableId(null);
    setVoidConfirmTable(t);
  };

  const handleDeliverTable = async (tableId: string) => {
    const tableOrder = openOrders.find((o) => o.tableId === tableId);
    if (tableOrder) {
      setSelectedPackagedOrder(tableOrder);
      return;
    }
    try {
      const res = await deliverTableOrdersAction({ tableId });
      if (res.success) {
        toast.success("Siparişler teslim edildi olarak işaretlendi!");
        setSelectedTableId(null);
        router.refresh();
      } else {
        toast.error(res.error || "İşlem başarısız oldu");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <div className="relative flex flex-col gap-6 p-4 lg:p-6">
      <style jsx global>{`
        @keyframes tableCardElasticIn {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.86);
          }
          60% {
            opacity: 1;
            transform: translateY(-4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-table-card-elastic {
          animation: tableCardElasticIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes elasticSlideInRight {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.96);
          }
          60% {
            opacity: 1;
            transform: translateX(-10px) scale(1.008);
          }
          85% {
            transform: translateX(2px) scale(0.998);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-drawer-elastic-right {
          animation: elasticSlideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* TOP HEADER & ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Anlık Durum & Masalar"
          description="Canlı masa doluluğu, salon adisyonları ve anlık hesap yönetimi."
        />

        <div className="flex items-center gap-2">
          {viewMode === "COMPLETED" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("TABLE_GRID")}
              className="rounded-2xl text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
            >
              <GridIcon className="size-3.5 text-primary" />
              <span>Canlı Masalara Dön</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("COMPLETED")}
              className="rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 border-border/80 bg-background/80 shadow-2xs hover:bg-muted cursor-pointer"
              title="Kapanan & Geçmiş Adisyonlar"
            >
              <ReceiptIcon className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Kapanan Adisyonlar</span>
              <span className="text-[11px] font-bold tabular-nums text-foreground/80">({completedOrders.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* TOP DROP-DOWN ALERT BANNER FOR BILL REQUESTS */}
      {activeBillRequests.length > 0 ? (
        <div className="flex flex-col gap-2 animate-in slide-in-from-top-4 duration-300">
          {activeBillRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 p-4 text-foreground shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/30 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-2xl text-black shadow-md">
                  🧾
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-base text-foreground">
                      {req.tableLabel ?? `#${req.orderNumber}`} Masası Hesap İstedi!
                    </p>
                    <span className="rounded-full bg-amber-500 text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Hesap İste
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Müşteri QR menüden hesap talep etti. Lütfen adisyonu masaya götürün veya tahsil edin.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black font-black shadow-sm cursor-pointer rounded-xl"
                render={<Link href={`/dashboard/orders/${req.id}`} />}
              >
                Adisyona Git & Tahsil Et
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {/* ---------------------------------------------------- */}
      {/* 1. MASA PLANI (MATERIAL CARDS GRID & MODAL / BOTTOM SHEET) */}
      {/* ---------------------------------------------------- */}
      {viewMode === "TABLE_GRID" && (
        <div className="flex flex-col gap-5 w-full">
          {/* Top Search & Filter Bar across full width */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 w-full">
            {/* Left: Search Input & Quick Live Indicators */}
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masa adı veya salon ara…"
                  className="w-full h-11 pl-10 pr-9 rounded-full bg-card/90 dark:bg-card/70 border border-border/80 text-foreground text-xs sm:text-sm font-medium placeholder:text-muted-foreground shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Live Indicators (SaaS Style) */}
              <div className="flex items-center gap-2 shrink-0 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>{emptyTablesCount} Boş</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 shadow-2xs">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>{occupiedTablesCount} Dolu</span>
                </span>
                {totalActiveRevenue > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-2xs font-bold tabular-nums">
                    <span>Açık Masa Cirosu: {formatCurrency(totalActiveRevenue)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right: Salon Segmented Pills */}
            <div className="no-scrollbar flex items-center p-1 bg-muted/70 dark:bg-muted/30 rounded-full border border-border/70 overflow-x-auto shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSection("ALL")}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer select-none",
                  selectedSection === "ALL"
                    ? "bg-[#34495e] dark:bg-primary text-white shadow-sm font-black"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Tümü</span>
                <span className="text-[10px] opacity-75">({tables.length})</span>
              </button>

              {sections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSection(sec)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer select-none",
                    selectedSection === sec
                      ? "bg-[#34495e] dark:bg-primary text-white shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{sec}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MATERIAL TABLE CARDS GRID (FULL-WIDTH SPATIAL CANVAS WITH COMFORTABLE RESPONSIVE COLUMNS) */}
          {filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/80 bg-muted/10 w-full max-w-md mx-auto my-8">
              <SparklesIcon className="size-8 text-muted-foreground/60 mb-2" />
              <p className="font-bold text-foreground text-sm">Masa Bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lütfen arama terimini veya salon filtresini kontrol edin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4.5 lg:gap-5 w-full">
              {filteredTables.map((table, idx) => {
                const tableOrders = ordersByTableId.get(table.id) ?? [];
                return (
                  <div
                    key={table.id}
                    className="animate-in fade-in-0 zoom-in-95 duration-200"
                    style={{ animationDelay: `${idx * 15}ms` }}
                  >
                    <MaterialTableCard
                      table={table}
                      orders={tableOrders}
                      onClick={() => setSelectedTableId(table.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE ACTION MODAL (MOBILE ELASTIC BOTTOM SHEET & DESKTOP POPUP) */}
          {selectedTable && (
            <TableActionModal
              table={selectedTable}
              orders={selectedTableOrders}
              isOpen={Boolean(selectedTableId)}
              onClose={() => setSelectedTableId(null)}
              onPrintBill={handlePrintBill}
              onAddProduct={handleAddProduct}
              onSettleBill={handleSettle}
              onTransferTable={handleTransfer}
              onMergeTable={handleMerge}
              onViewDetails={handleViewDetails}
              onVoidTable={handleVoid}
              onDeliverTable={handleDeliverTable}
            />
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. ORDER LIST (OPEN ORDERS)                          */}
      {/* ---------------------------------------------------- */}
      {viewMode === "ORDER_LIST" && (
        <div className="flex flex-col gap-4">
          {openOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">
              Açık adisyon bulunmuyor.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map((group) => {
                const hasBill = group.orders.some((o) => o.billRequestedAt !== null);

                return (
                  <div
                    key={group.key}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300 bg-card shadow-xs",
                      hasBill && "border-2 border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">
                          {group.tableLabel ?? "Masa"} · {group.orders.length} sipariş ·{" "}
                          <span className="tabular-nums font-black text-primary">
                            {formatCurrency(group.total)}
                          </span>
                        </span>
                        {hasBill ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-black text-black shadow-sm">
                            <span>🧾</span> HESAP İSTENDİ
                          </span>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        className="rounded-xl font-bold"
                        onClick={() => setSettleGroup(group)}
                      >
                        Hesap Al / Masayı Kapat
                      </Button>
                    </div>

                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.orders.map((order) => (
                        <OrderCard key={order.id} order={order} tab="OPEN" />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. COMPLETED ORDERS                                  */}
      {/* ---------------------------------------------------- */}
      {viewMode === "COMPLETED" && (
        <div className="flex flex-col gap-4">
          {/* Today's Sales Summary Banner */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Net Satış" value={formatCurrency(sales.gross)} />
            <Stat label="Toplanan KDV" value={formatCurrency(sales.tax)} />
            <Stat label="Sipariş Sayısı" value={String(sales.orders)} />
            <Stat label="İptaller" value={String(sales.voids)} />
          </div>

          {completedOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">
              Bugün tamamlanmış sipariş bulunmuyor.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} tab="COMPLETED" />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 1. BILL / RECEIPT THERMAL PRINT MODAL */}
      <TableBillModal
        table={printBillTable?.table ?? null}
        orders={printBillTable?.orders ?? []}
        restaurantName={restaurantName}
        restaurantTagline={restaurantTagline}
        open={Boolean(printBillTable)}
        onOpenChange={(op) => !op && setPrintBillTable(null)}
        onAddProduct={() => {
          if (printBillTable) {
            const currentTable = printBillTable.table;
            const currentOrders = printBillTable.orders;
            setPrintBillTable(null);
            setPosModalTable({
              table: currentTable,
              orders: currentOrders,
            });
          }
        }}
      />

      {/* 2. ADD PRODUCT POS MODAL */}
      <TablePosModal
        table={posModalTable?.table ?? null}
        orders={posModalTable?.orders ?? []}
        menu={menu ?? null}
        open={Boolean(posModalTable)}
        onOpenChange={(op) => !op && setPosModalTable(null)}
        onAdded={() => {
          setPosModalTable(null);
          router.refresh();
        }}
      />

      {/* 3. TABLE SETTLE DIALOG */}
      {settleTableModal ? (
        <TableSettleDialog
          tableLabel={settleTableModal.table.label}
          orders={settleTableModal.orders}
          onOpenChange={(op) => !op && setSettleTableModal(null)}
          onSettled={() => {
            setSettleTableModal(null);
            router.refresh();
          }}
        />
      ) : settleGroup ? (
        <TableSettleDialog
          tableLabel={settleGroup.tableLabel ?? "Masa"}
          orders={settleGroup.orders}
          onOpenChange={(op) => !op && setSettleGroup(null)}
          onSettled={() => {
            setSettleGroup(null);
            router.refresh();
          }}
        />
      ) : null}

      {/* 4 & 5. TRANSFER / MERGE DIALOG */}
      {transferDialog ? (
        <TransferMergeDialog
          sourceTable={transferDialog.table}
          orders={ordersByTableId.get(transferDialog.table.id) ?? []}
          allTables={tables}
          mode={transferDialog.mode}
          open
          onOpenChange={(op) => !op && setTransferDialog(null)}
        />
      ) : null}

      {/* 6. TABLE DETAIL & ALL ORDERS MODAL */}
      <TableDetailModal
        table={detailModalTable?.table ?? null}
        orders={detailModalTable?.orders ?? []}
        open={Boolean(detailModalTable)}
        onOpenChange={(op) => !op && setDetailModalTable(null)}
        onPrintBill={() => {
          if (detailModalTable) {
            const currentTable = detailModalTable.table;
            const currentOrders = detailModalTable.orders;
            setDetailModalTable(null);
            setPrintBillTable({
              table: currentTable,
              orders: currentOrders,
            });
          }
        }}
        onAddProduct={() => {
          if (detailModalTable) {
            const currentTable = detailModalTable.table;
            const currentOrders = detailModalTable.orders;
            setDetailModalTable(null);
            setPosModalTable({
              table: currentTable,
              orders: currentOrders,
            });
          }
        }}
        onSettleBill={() => {
          if (detailModalTable) {
            const currentTable = detailModalTable.table;
            const currentOrders = detailModalTable.orders;
            setDetailModalTable(null);
            setSettleTableModal({
              table: currentTable,
              orders: currentOrders,
            });
          }
        }}
      />

      {/* VOID / CLEAR TABLE CONFIRMATION DIALOG */}
      {voidConfirmTable ? (
        <Dialog open onOpenChange={(op) => !op && setVoidConfirmTable(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-destructive font-black">
                Masa Siparişini İptal Et / Boşalt
              </DialogTitle>
              <DialogDescription className="text-xs">
                <strong>{voidConfirmTable.label}</strong> masasındaki tüm açık siparişler iptal edilecek ve masa boşaltılacaktır. Bu işlemi onaylıyor musunuz?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                className="rounded-xl cursor-pointer"
                onClick={() => setVoidConfirmTable(null)}
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl font-bold cursor-pointer"
                disabled={voidAction.isPending}
                onClick={async () => {
                  const ords = ordersByTableId.get(voidConfirmTable.id) ?? [];
                  for (const o of ords) {
                    await voidAction.execute({
                      orderId: o.id,
                      reason: "Masa boşaltıldı / İptal edildi",
                    });
                  }
                  setVoidConfirmTable(null);
                  setSelectedTableId(null);
                  router.refresh();
                }}
              >
                {voidAction.isPending ? "İptal Ediliyor…" : "Evet, Masayı Boşalt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <PackagedDeliveryDialog
        order={selectedPackagedOrder}
        open={Boolean(selectedPackagedOrder)}
        onOpenChange={(open) => !open && setSelectedPackagedOrder(null)}
        onDelivered={() => router.refresh()}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3.5 shadow-2xs">
      <p className="text-muted-foreground text-xs font-semibold">{label}</p>
      <p className="text-lg font-black text-foreground tabular-nums tracking-tight mt-0.5">
        {value}
      </p>
    </div>
  );
}

function OrderCard({
  order,
  tab,
}: {
  order: OrderDTO;
  tab: "OPEN" | "COMPLETED";
}) {
  const lineCount = activeCount(order.lines);
  const isGuest = order.lines.some((l) => l.source === "SELF_ORDER");
  const hasBillRequest = order.billRequestedAt !== null;
  const hasWaiterCall = order.note?.includes("GARSON");

  return (
    <li
      className={cn(
        "rounded-2xl border p-4 transition-all duration-300 bg-card shadow-xs",
        hasWaiterCall &&
          "border-2 border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20 ring-2 ring-red-500/40 animate-pulse",
        !hasWaiterCall &&
          hasBillRequest &&
          "border-2 border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 animate-pulse",
      )}
    >
      <Link href={`/dashboard/orders/${order.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-foreground">
                #{order.orderNumber}
              </span>
              {order.tableLabel ? (
                <Badge variant="outline" className="font-bold">
                  {order.tableLabel}
                </Badge>
              ) : null}
              {isGuest ? <SelfOrderBadge /> : null}
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              {formatTime(order.createdAt)} · {lineCount} ürün
            </p>
          </div>
          <span className="text-base font-black text-foreground tabular-nums">
            {formatCurrency(order.grandTotal)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
          <KitchenStatusBadge states={order.lines.map((l) => l.state)} />
          {hasWaiterCall ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-black animate-bounce shadow-xs">
              <span>🛎️</span> Garson Çağrıldı
            </span>
          ) : hasBillRequest ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-black px-2 py-0.5 text-[10px] font-black animate-pulse">
              <span>🧾</span> Hesap İstendi
            </span>
          ) : (
            <span className="text-muted-foreground font-medium">Detay →</span>
          )}
        </div>
      </Link>
    </li>
  );
}
