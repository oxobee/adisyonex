"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeftIcon,
  BellRingIcon,
  CheckCircle2Icon,
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

import { voidOrderAction } from "@/actions/order.actions";
import { TableActionMenu } from "@/components/orders/table-action-menu";
import { TableCard, type TableStatus } from "@/components/orders/table-card";
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

export function OrdersBoard({
  open,
  completed,
  sales,
  tables = [],
  menu,
}: {
  readonly open: readonly OrderDTO[];
  readonly completed: readonly OrderDTO[];
  readonly sales: TodaySalesDTO;
  readonly tables?: readonly TableDTO[];
  readonly menu?: MenuDTO | null;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("TABLE_GRID");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Spotlight State
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Dialog States
  const [settleGroup, setSettleGroup] = useState<TableGroup | null>(null);
  const [transferDialog, setTransferDialog] = useState<{
    table: TableDTO;
    mode: "TRANSFER" | "MERGE";
  } | null>(null);
  const [detailGroup, setDetailGroup] = useState<TableGroup | null>(null);
  const [voidConfirmTable, setVoidConfirmTable] = useState<TableDTO | null>(null);

  const { supported, enabled, toggle, announce } = useAnnouncer();
  const prevMapRef = useRef<Map<string, number> | null>(null);
  const prevBillRequestsRef = useRef<Set<string>>(new Set());

  // Group open orders by tableId / tableLabel
  const groups = useMemo(() => groupByTable(open), [open]);

  const ordersByTableId = useMemo(() => {
    const map = new Map<string, OrderDTO[]>();
    for (const order of open) {
      if (order.tableId) {
        const bucket = map.get(order.tableId);
        if (bucket) bucket.push(order);
        else map.set(order.tableId, [order]);
      }
    }
    return map;
  }, [open]);

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
      const order = open.find((o) => o.id === a.id);
      if (!order) continue;
      const phrase =
        a.isSelfOrder
          ? selfOrderAlertPhrase(order)
          : newOrderPhrase(order);
      announce(phrase, "beep");
    }
  }, [open, announce]);

  // Active bill requests
  const activeBillRequests = useMemo(
    () => open.filter((o) => o.billRequestedAt !== null),
    [open],
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

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
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
  }, [tables, selectedSection, searchQuery]);

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

  // Handlers for selected table actions
  const handlePrintBill = (t: TableDTO, ords: readonly OrderDTO[]) => {
    if (ords.length === 0) return;
    const targetOrder = ords[0];
    window.open(`/dashboard/orders/${targetOrder.id}/invoice`, "_blank");
  };

  const handleAddProduct = (t: TableDTO) => {
    router.push(`/dashboard/pos?tableId=${t.id}`);
  };

  const handleSettle = (t: TableDTO, ords: readonly OrderDTO[]) => {
    if (ords.length === 0) return;
    const total = round2(ords.reduce((s, o) => s + orderRunningTotal(o), 0));
    setSettleGroup({
      key: t.id,
      tableLabel: t.label,
      orders: ords,
      total,
    });
    setSelectedTableId(null);
  };

  const handleTransfer = (t: TableDTO) => {
    setTransferDialog({ table: t, mode: "TRANSFER" });
    setSelectedTableId(null);
  };

  const handleMerge = (t: TableDTO) => {
    setTransferDialog({ table: t, mode: "MERGE" });
    setSelectedTableId(null);
  };

  const handleViewDetails = (t: TableDTO, ords: readonly OrderDTO[]) => {
    const total = round2(ords.reduce((s, o) => s + orderRunningTotal(o), 0));
    setDetailGroup({
      key: t.id,
      tableLabel: t.label,
      orders: ords,
      total,
    });
    setSelectedTableId(null);
  };

  const handleVoid = (t: TableDTO) => {
    setVoidConfirmTable(t);
  };

  return (
    <div className="relative flex flex-col gap-6 p-4 lg:p-6">
      {/* SPOTLIGHT GLASSMORPHISM BACKDROP OVERLAY */}
      {selectedTable && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-300 cursor-pointer"
          onClick={() => setSelectedTableId(null)}
        />
      )}

      {/* TOP HEADER & ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Siparişler & Masalar"
          description="Canlı masa doluluğu, salon adisyonları ve anlık hesap yönetimi."
        />

        <div className="flex flex-wrap items-center gap-2">
          <SoundToggle supported={supported} enabled={enabled} onToggle={toggle} />

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-2xl border border-border/80 bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setViewMode("TABLE_GRID")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                viewMode === "TABLE_GRID"
                  ? "bg-card text-foreground shadow-xs scale-102"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GridIcon className="size-3.5" />
              <span>Masa Planı</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("ORDER_LIST")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                viewMode === "ORDER_LIST"
                  ? "bg-card text-foreground shadow-xs scale-102"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ListIcon className="size-3.5" />
              <span>Açık Adisyonlar ({open.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("COMPLETED")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                viewMode === "COMPLETED"
                  ? "bg-card text-foreground shadow-xs scale-102"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ReceiptIcon className="size-3.5" />
              <span>Kapananlar ({completed.length})</span>
            </button>
          </div>

          <Button className="rounded-xl font-bold" render={<Link href="/dashboard/pos" />}>
            <PlusCircleIcon className="size-4 mr-1.5" />
            Yeni Sipariş / POS
          </Button>
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

          {/* Search Bar for Tables */}
          <div className="relative max-w-sm">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masa adı veya salon ile ara…"
              className="h-10 rounded-xl pl-9 text-xs"
            />
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
                const isSelected = selectedTableId === table.id;

                return (
                  <div key={table.id} className="relative">
                    <TableCard
                      table={table}
                      status={status}
                      total={total}
                      orders={tableOrders}
                      firstOrderAt={firstOrderAt}
                      hasBillRequest={hasBill}
                      isSelected={isSelected}
                      onClick={() => {
                        if (selectedTableId === table.id) {
                          setSelectedTableId(null);
                        } else {
                          setSelectedTableId(table.id);
                        }
                      }}
                    />

                    {/* SPOTLIGHT FLOATING ACTION MENU ATTACHED TO CARD */}
                    {isSelected && (
                      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:static sm:translate-x-0 sm:translate-y-0 sm:absolute sm:top-0 sm:left-full sm:ml-3">
                        <TableActionMenu
                          table={table}
                          orders={tableOrders}
                          onClose={() => setSelectedTableId(null)}
                          onPrintBill={() => handlePrintBill(table, tableOrders)}
                          onAddProduct={() => handleAddProduct(table)}
                          onSettleBill={() => handleSettle(table, tableOrders)}
                          onTransferTable={() => handleTransfer(table)}
                          onMergeTable={() => handleMerge(table)}
                          onViewDetails={() => handleViewDetails(table, tableOrders)}
                          onVoidTable={() => handleVoid(table)}
                        />
                      </div>
                    )}
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
          {open.length === 0 ? (
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

          {completed.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">
              Bugün tamamlanmış sipariş bulunmuyor.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completed.map((order) => (
                <OrderCard key={order.id} order={order} tab="COMPLETED" />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* TABLE SETTLE DIALOG */}
      {settleGroup ? (
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

      {/* TRANSFER / MERGE DIALOG */}
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

      {/* ORDER DETAILS DIALOG */}
      {detailGroup ? (
        <Dialog open onOpenChange={(op) => !op && setDetailGroup(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-foreground">
                {detailGroup.tableLabel ?? "Masa"} — Adisyon Detayı
              </DialogTitle>
              <DialogDescription className="text-xs">
                {detailGroup.orders.length} Açık Sipariş · Toplam: {formatCurrency(detailGroup.total)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 divide-y">
              {detailGroup.orders.map((order) => (
                <div key={order.id} className="flex flex-col gap-2 pt-3 first:pt-0">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Sipariş #{order.orderNumber}</span>
                    <span className="text-muted-foreground">{formatTime(order.createdAt)}</span>
                  </div>

                  <ul className="flex flex-col gap-1.5 text-xs">
                    {order.lines.map((line) => (
                      <li key={line.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-foreground">
                            {line.quantity}x {line.name}
                          </span>
                          {line.variantName ? (
                            <span className="text-muted-foreground ml-1">({line.variantName})</span>
                          ) : null}
                          {line.modifiers.length > 0 ? (
                            <div className="text-[11px] text-muted-foreground truncate">
                              {line.modifiers.map((m) => m.name).join(", ")}
                            </div>
                          ) : null}
                        </div>
                        <span className="font-bold text-foreground tabular-nums">
                          {formatCurrency((line.unitPrice + line.modifiers.reduce((s, m) => s + m.priceDelta, 0)) * line.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                className="rounded-xl cursor-pointer"
                onClick={() => setDetailGroup(null)}
              >
                Kapat
              </Button>
              <Button
                className="rounded-xl font-bold bg-primary text-primary-foreground cursor-pointer"
                onClick={() => {
                  const ords = detailGroup.orders;
                  setDetailGroup(null);
                  setSettleGroup(detailGroup);
                }}
              >
                Hesap Al / Masayı Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

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
