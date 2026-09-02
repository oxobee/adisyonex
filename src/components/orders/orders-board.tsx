"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { TableActionMenu } from "@/components/orders/table-action-menu";
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
    () => tables.find((t) => t.id === selectedTableId) ?? null,
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

  const selectedTableHasBill = useMemo(
    () => selectedTableOrders.some((o) => o.billRequestedAt !== null),
    [selectedTableOrders],
  );

  const selectedTableFirstOrderAt = useMemo(
    () =>
      selectedTableOrders.length > 0 ? selectedTableOrders[0].createdAt : null,
    [selectedTableOrders],
  );

  const selectedTableStatus: TableStatus =
    selectedTableOrders.length > 0 ? "OCCUPIED" : "EMPTY";

  // Handlers for selected table actions
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
    try {
      const res = await deliverTableOrdersAction({ tableId });
      if (res.success) {
        toast.success("Siparişler teslim edildi olarak işaretlendi!");
        setSelectedTableId(null);
        router.refresh();
      } else {
        toast.error(res.error || "İşlem başarısız oldu");
      }
    } catch (e) {
      toast.error("Bir hata oluştu");
    }
  };

  return (
    <div className="relative flex flex-col gap-6 p-4 lg:p-6">
      {/* SPOTLIGHT GLASSMORPHISM BACKDROP & CRISP ACTION MODAL */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Glass Blur Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setSelectedTableId(null)}
          />

          {/* Centered Spotlight Card & Crisp Action Menu */}
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-center gap-4 sm:gap-6 w-full max-w-2xl my-auto animate-in zoom-in-95 fade-in duration-200">
            {/* Live Table Card Highlight */}
            <div className="w-64 max-w-full shrink-0 shadow-2xl">
              <TableCard
                table={selectedTable}
                status={selectedTableStatus}
                total={selectedTableTotal}
                orders={selectedTableOrders}
                firstOrderAt={selectedTableFirstOrderAt}
                hasBillRequest={selectedTableHasBill}
                isSelected={true}
                onClick={() => setSelectedTableId(null)}
                onDeliver={() => handleDeliverTable(selectedTable.id)}
              />
            </div>

            {/* Crisp Action Menu (Above blur, 100% sharp) */}
            <div className="w-full max-w-sm shrink-0 shadow-2xl">
              <TableActionMenu
                table={selectedTable}
                orders={selectedTableOrders}
                onClose={() => setSelectedTableId(null)}
                onPrintBill={() => handlePrintBill(selectedTable, selectedTableOrders)}
                onAddProduct={() => handleAddProduct(selectedTable, selectedTableOrders)}
                onSettleBill={() => handleSettle(selectedTable, selectedTableOrders)}
                onTransferTable={() => handleTransfer(selectedTable)}
                onMergeTable={() => handleMerge(selectedTable)}
                onViewDetails={() => handleViewDetails(selectedTable, selectedTableOrders)}
                onVoidTable={() => handleVoid(selectedTable)}
                onDeliverTable={() => handleDeliverTable(selectedTable.id)}
              />
            </div>
          </div>
        </div>
      )}

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
      {/* 1. MASA PLANI (VISUAL TABLE GRID WITH SPOTLIGHT)     */}
      {/* ---------------------------------------------------- */}
      {viewMode === "TABLE_GRID" && (
        <div className="flex flex-col gap-4">
          {/* Salon / Section Tabs & Status Pill Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Salon / Bölüm Chips */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedSection("ALL")}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all select-none cursor-pointer",
                  selectedSection === "ALL"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs scale-102"
                    : "border-border/70 bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <span>🏢</span>
                <span>Tüm Masalar</span>
                <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px]">
                  {tables.length}
                </span>
              </button>

              {sections.map((sec) => {
                const count = tables.filter((t) => t.section === sec).length;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all select-none cursor-pointer",
                      selectedSection === sec
                        ? "border-primary bg-primary text-primary-foreground shadow-xs scale-102"
                        : "border-border/70 bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span>{sec}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Status Legend / Counters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>{tableStats.empty} Boş</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 text-rose-700 dark:text-rose-400 font-bold">
                <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                <span>{tableStats.occupied} Dolu</span>
              </div>
              {tableStats.billCount > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-amber-800 dark:text-amber-300 font-black animate-bounce">
                  <span>🚨</span>
                  <span>{tableStats.billCount} Hesap İstendi</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar & Subtle Sorting Filter */}
          <div className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masa adı veya salon ile ara…"
                className="h-10 rounded-xl pl-9 text-xs"
              />
            </div>

            {/* Discreet Sort Filter Icon Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((prev) => !prev)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 shadow-2xs cursor-pointer",
                  sortMode !== "NAME_ASC" && "border-primary/50 text-primary bg-primary/10",
                )}
                title="Sıralama Seçenekleri"
                aria-label="Masaları Sırala"
              >
                <ArrowUpDownIcon className="size-4" />
              </button>

              {isSortMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-52 z-30 overflow-hidden rounded-2xl border border-border bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
                  onMouseLeave={() => setIsSortMenuOpen(false)}
                >
                  <p className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    Masa Sıralama
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSortMode("NAME_ASC");
                      setIsSortMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-left",
                      sortMode === "NAME_ASC" && "text-primary font-black bg-primary/10",
                    )}
                  >
                    <span>Masa Numarası (1 → 9)</span>
                    {sortMode === "NAME_ASC" && <CheckIcon className="size-3.5 text-primary" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortMode("NAME_DESC");
                      setIsSortMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-left",
                      sortMode === "NAME_DESC" && "text-primary font-black bg-primary/10",
                    )}
                  >
                    <span>Masa Numarası (9 → 1)</span>
                    {sortMode === "NAME_DESC" && <CheckIcon className="size-3.5 text-primary" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortMode("OCCUPIED_FIRST");
                      setIsSortMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-left",
                      sortMode === "OCCUPIED_FIRST" && "text-primary font-black bg-primary/10",
                    )}
                  >
                    <span>Önce Dolu Masalar</span>
                    {sortMode === "OCCUPIED_FIRST" && <CheckIcon className="size-3.5 text-primary" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortMode("EMPTY_FIRST");
                      setIsSortMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer text-left",
                      sortMode === "EMPTY_FIRST" && "text-primary font-black bg-primary/10",
                    )}
                  >
                    <span>Önce Boş Masalar</span>
                    {sortMode === "EMPTY_FIRST" && <CheckIcon className="size-3.5 text-primary" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TABLE GRID */}
          {filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center">
              <UtensilsIcon className="size-10 text-muted-foreground/50 mb-2" />
              <p className="font-bold text-foreground text-sm">Masa bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lütfen filtrelerinizi kontrol edin veya yeni masa tanımlayın.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {filteredTables.map((table) => {
                const tableOrders = ordersByTableId.get(table.id) ?? [];
                const isOccupied = tableOrders.length > 0;
                const total = round2(
                  tableOrders.reduce((sum, o) => sum + orderRunningTotal(o), 0),
                );
                const hasBill = tableOrders.some((o) => o.billRequestedAt !== null);
                const firstOrderAt =
                  tableOrders.length > 0 ? tableOrders[0].createdAt : null;

                const status: TableStatus = isOccupied ? "OCCUPIED" : "EMPTY";

                return (
                  <div key={table.id} className="relative">
                    <TableCard
                      table={table}
                      status={status}
                      total={total}
                      orders={tableOrders}
                      firstOrderAt={firstOrderAt}
                      hasBillRequest={hasBill}
                      isSelected={false}
                      onClick={() => {
                        setSelectedTableId(table.id);
                      }}
                      onDeliver={() => handleDeliverTable(table.id)}
                    />
                  </div>
                );
              })}
            </div>
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

  return (
    <li
      className={cn(
        "rounded-2xl border p-4 transition-all duration-300 bg-card shadow-xs",
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
          {hasBillRequest ? (
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
