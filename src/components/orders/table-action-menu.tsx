"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeftIcon,
  BellRingIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  CreditCardIcon,
  MergeIcon,
  PlusCircleIcon,
  PrinterIcon,
  ReceiptIcon,
  SparklesIcon,
  Trash2Icon,
  UsersIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";
import type { TableStatus } from "@/components/orders/table-card";

export interface TableActionMenuProps {
  table: TableDTO;
  orders: readonly OrderDTO[];
  total?: number;
  status?: TableStatus;
  firstOrderAt?: string | null;
  hasBillRequest?: boolean;
  hasWaiterCall?: boolean;
  onClose: () => void;
  onPrintBill: () => void;
  onAddProduct: () => void;
  onSettleBill: () => void;
  onTransferTable: () => void;
  onMergeTable: () => void;
  onViewDetails: () => void;
  onVoidTable: () => void;
  onDeliverTable?: () => void;
}

export function TableActionMenu({
  table,
  orders,
  total,
  firstOrderAt,
  hasBillRequest,
  hasWaiterCall,
  onClose,
  onPrintBill,
  onAddProduct,
  onSettleBill,
  onTransferTable,
  onMergeTable,
  onViewDetails,
  onVoidTable,
  onDeliverTable,
}: TableActionMenuProps) {
  const isOccupied = orders.length > 0;

  const activeLines = useMemo(
    () => orders.flatMap((o) => o.lines.filter((l) => l.state !== "VOID")),
    [orders],
  );

  const calculatedTotal = useMemo(() => {
    if (typeof total === "number") return total;
    return activeLines.reduce(
      (sum, l) => sum + l.unitPrice * l.quantity,
      0,
    );
  }, [total, activeLines]);

  const itemCount = useMemo(
    () => activeLines.reduce((sum, l) => sum + l.quantity, 0),
    [activeLines],
  );

  // Live Elapsed Timer
  const [elapsed, setElapsed] = useState<string>("");
  const orderStart = firstOrderAt || (orders.length > 0 ? orders[0].createdAt : null);

  useEffect(() => {
    if (!orderStart || !isOccupied) {
      setElapsed("");
      return;
    }
    const update = () => {
      const diffSec = Math.max(0, Math.floor((Date.now() - new Date(orderStart).getTime()) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      setElapsed(hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [orderStart, isOccupied]);

  const unservedLines = useMemo(
    () => activeLines.filter((l) => l.state !== "SERVED"),
    [activeLines],
  );

  const unservedCooked = useMemo(
    () =>
      unservedLines.filter(
        (l) => l.itemType !== "PACKAGED_GOODS" && l.itemType !== "OTHER",
      ),
    [unservedLines],
  );

  const unservedPackaged = useMemo(
    () =>
      unservedLines.filter(
        (l) => l.itemType === "PACKAGED_GOODS" || l.itemType === "OTHER",
      ),
    [unservedLines],
  );

  const hasCooking = useMemo(
    () =>
      unservedCooked.some(
        (l) => l.state === "FIRED" || l.state === "UNSENT" || l.state === "PREPARING",
      ),
    [unservedCooked],
  );

  const hasCookedReady = useMemo(
    () =>
      unservedCooked.length > 0 &&
      unservedCooked.every((l) => l.state === "PREPARED"),
    [unservedCooked],
  );

  const canDeliverPackaged = unservedPackaged.length > 0;
  const isDeliverable = canDeliverPackaged || hasCookedReady;
  const isOnlyPreparing = !canDeliverPackaged && hasCooking;

  return (
    <aside
      aria-label={`${table.label} İşlemleri`}
      className={cn(
        "relative flex w-full flex-col bg-card text-card-foreground border-border shadow-2xl",
        // Desktop: Right slide-over drawer
        "sm:w-[420px] sm:h-full sm:border-l sm:max-h-none sm:rounded-none",
        // Mobile: Bottom sheet
        "max-h-[88vh] rounded-t-[32px] border-t overflow-hidden",
        "animate-in fade-in duration-300",
      )}
    >
      {/* Mobile Top Grabber Indicator */}
      <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
        <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>

      {/* HEADER SECTION */}
      <div className="flex items-start justify-between border-b border-border/70 p-4 sm:p-5 bg-muted/20">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none">
              {table.label}
            </h2>
            {table.section && (
              <span className="rounded-lg bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-bold">
                {table.section}
              </span>
            )}
            {table.seats && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                <UsersIcon className="size-3.5" />
                <span>{table.seats} Kişi</span>
              </span>
            )}
          </div>

          {/* Status & Live Indicators */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {isOccupied ? (
              <>
                <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Dolu ({itemCount} Ürün)</span>
                </span>
                {elapsed && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 font-black tabular-nums text-foreground/80">
                    <ClockIcon className="size-3" />
                    <span>{elapsed}</span>
                  </span>
                )}
                {hasWaiterCall && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 text-red-600 px-1.5 py-0.5 font-bold animate-bounce">
                    <BellRingIcon className="size-3" />
                    <span>Garson Çağrısı</span>
                  </span>
                )}
                {hasBillRequest && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 text-amber-600 px-1.5 py-0.5 font-bold animate-pulse">
                    <ReceiptIcon className="size-3" />
                    <span>Hesap İstendi</span>
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Masa Müsait / Temiz</span>
              </span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="size-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Paneli Kapat"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      {/* PRIMARY FAST ACTION BUTTONS (TOP PROMINENT) */}
      <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/10 flex flex-col gap-2.5">
        {/* Deliver Button if meals are ready */}
        {isDeliverable && onDeliverTable ? (
          <button
            type="button"
            onClick={onDeliverTable}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle2Icon className="size-5" />
            <span>
              {canDeliverPackaged && hasCooking
                ? "Paketli Ürünleri Teslim Et"
                : "Hazır Siparişleri Masaya Teslim Et"}
            </span>
          </button>
        ) : isOnlyPreparing ? (
          <div className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 font-bold">
            <div className="flex items-center gap-2.5">
              <ChefHatIcon className="size-5 text-orange-500 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-black">Yemekler Hazırlanıyor</span>
                <span className="text-[10px] text-muted-foreground">Mutfak siparişleri pişiriyor</span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-orange-500/20">
              Mutfakta
            </span>
          </div>
        ) : null}

        {/* Action Buttons: Add Product & Settle Bill */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Ürün Ekle (Primary) */}
          <button
            type="button"
            onClick={onAddProduct}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl px-3.5 py-3 text-sm font-black transition-all active:scale-[0.98] cursor-pointer shadow-xs",
              isOccupied
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base py-3.5 shadow-md",
            )}
          >
            <PlusCircleIcon className="size-5 shrink-0" />
            <span>{isOccupied ? "Ürün Ekle" : "+ Sipariş Başlat / Ürün Ekle"}</span>
          </button>

          {/* 2. Hesap Al / Kapat (Primary if occupied) */}
          {isOccupied && (
            <button
              type="button"
              onClick={onSettleBill}
              className="flex items-center justify-center gap-2 rounded-2xl px-3.5 py-3 text-sm font-black transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
            >
              <CreditCardIcon className="size-5 shrink-0" />
              <span>Hesap Al / Kapat</span>
            </button>
          )}
        </div>

        {/* Print Bill Button */}
        <button
          type="button"
          onClick={onPrintBill}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted py-2 px-3 text-xs font-bold text-foreground transition-colors cursor-pointer"
        >
          <PrinterIcon className="size-4 text-primary" />
          <span>Adisyon / Fiş Yazdır</span>
        </button>
      </div>

      {/* LIVE TICKET / ORDER SUMMARY PREVIEW (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 min-h-40">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <UtensilsCrossedIcon className="size-3.5" />
            <span>Açık Adisyon Detayı</span>
          </span>
          {isOccupied && (
            <span className="text-foreground font-semibold">{activeLines.length} Kalem</span>
          )}
        </div>

        {isOccupied ? (
          <div className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/80 bg-muted/20 overflow-hidden">
            {activeLines.map((line) => (
              <div
                key={line.id}
                className="flex items-start justify-between gap-2.5 p-3 text-sm hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="size-6 rounded-md bg-foreground/10 text-foreground flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {line.quantity}×
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-foreground truncate leading-tight">
                      {line.name}
                    </span>
                    {line.variantName && (
                      <span className="text-xs text-muted-foreground">
                        {line.variantName}
                      </span>
                    )}
                    {line.modifiers && line.modifiers.length > 0 && (
                      <span className="text-[11px] text-muted-foreground/80">
                        {line.modifiers.map((m) => m.name).join(", ")}
                      </span>
                    )}
                    {line.lineNote && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                        &ldquo;{line.lineNote}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="font-black text-foreground tabular-nums text-xs sm:text-sm">
                    {formatCurrency(line.unitPrice * line.quantity)}
                  </span>
                  {line.state === "SERVED" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                      Teslim
                    </span>
                  ) : line.state === "PREPARED" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Hazır
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400">
                      Mutfakta
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 my-auto">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <SparklesIcon className="size-6" />
            </div>
            <p className="font-extrabold text-foreground text-sm">Masa Boş & Temiz</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Bu masada açık bir sipariş bulunmuyor. Yeni sipariş başlatmak için yukarıdaki butona dokunun.
            </p>
          </div>
        )}
      </div>

      {/* TOTAL BAR (IF OCCUPIED) */}
      {isOccupied && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Masa Toplamı
          </span>
          <span className="text-xl font-black text-foreground tabular-nums">
            {formatCurrency(calculatedTotal)}
          </span>
        </div>
      )}

      {/* SECONDARY MANAGEMENT ACTIONS (BOTTOM GRID) */}
      <div className="p-4 sm:p-5 border-t border-border/70 bg-card flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Transfer Table */}
          <button
            type="button"
            disabled={!isOccupied}
            onClick={onTransferTable}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-left border border-border/80 bg-muted/20 hover:bg-muted transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          >
            <ArrowRightLeftIcon className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="truncate">Masayı Taşı</span>
          </button>

          {/* Merge Tables */}
          <button
            type="button"
            disabled={!isOccupied}
            onClick={onMergeTable}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-left border border-border/80 bg-muted/20 hover:bg-muted transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          >
            <MergeIcon className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">Masayı Birleştir</span>
          </button>

          {/* View Details */}
          <button
            type="button"
            onClick={onViewDetails}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-left border border-border/80 bg-muted/20 hover:bg-muted transition-colors active:scale-[0.98] cursor-pointer text-foreground"
          >
            <ReceiptIcon className="size-4 text-muted-foreground shrink-0" />
            <span className="truncate">Adisyon Detayı</span>
          </button>

          {/* Void / Clear Table */}
          {isOccupied ? (
            <button
              type="button"
              onClick={onVoidTable}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-left border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive transition-colors active:scale-[0.98] cursor-pointer"
            >
              <Trash2Icon className="size-4 shrink-0" />
              <span className="truncate">Masayı Boşalt</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
