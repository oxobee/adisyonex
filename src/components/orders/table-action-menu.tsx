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
        // Desktop: Left slide-over drawer (380px golden ratio)
        "sm:w-[380px] sm:h-full sm:border-r sm:border-l-0 sm:max-h-none sm:rounded-none sm:shadow-[10px_0_30px_rgba(0,0,0,0.12)]",
        // Mobile: Bottom sheet
        "max-h-[88vh] rounded-t-[32px] border-t sm:border-t-0 overflow-hidden",
        "animate-in fade-in duration-200",
      )}
    >
      {/* Mobile Top Grabber Indicator */}
      <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
        <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>

      {/* 1. COMPACT UNIFIED HEADER */}
      <div className="flex items-center justify-between border-b border-border/70 p-4 sm:px-5 sm:py-4 bg-muted/25">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none">
              {table.label}
            </h2>
            {table.section && (
              <span className="rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-bold">
                {table.section}
              </span>
            )}
            {table.seats && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                <UsersIcon className="size-3" />
                <span>{table.seats}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isOccupied ? (
              <>
                <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 text-xs">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Dolu ({itemCount} Ürün)</span>
                </span>
                {elapsed && (
                  <span className="inline-flex items-center gap-1 font-bold tabular-nums text-muted-foreground text-xs">
                    <ClockIcon className="size-3" />
                    <span>{elapsed}</span>
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Masa Müsait</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Header: Total Amount & Close */}
        <div className="flex items-center gap-3 shrink-0">
          {isOccupied && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Toplam</span>
              <span className="text-lg sm:text-xl font-black text-foreground tabular-nums leading-tight">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Kapat"
          >
            <XIcon className="size-4.5" />
          </button>
        </div>
      </div>

      {/* 2. PRIMARY ACTIONS BAR (UNIFIED, AIRY) */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 border-b border-border/60 bg-muted/10 flex flex-col gap-2">
        {/* Status / Deliver notification if cooking or ready */}
        {isDeliverable && onDeliverTable ? (
          <button
            type="button"
            onClick={onDeliverTable}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle2Icon className="size-4 shrink-0" />
            <span>{canDeliverPackaged && hasCooking ? "Paketli Ürünleri Teslim Et" : "Hazır Siparişleri Teslim Et"}</span>
          </button>
        ) : isOnlyPreparing ? (
          <div className="flex items-center justify-between rounded-xl px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
            <div className="flex items-center gap-2 text-xs font-bold">
              <ChefHatIcon className="size-3.5 text-orange-500 animate-pulse" />
              <span>Mutfakta Hazırlanıyor</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-orange-500/20">Mutfak</span>
          </div>
        ) : null}

        {/* Main Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Ürün Ekle */}
          <button
            type="button"
            onClick={onAddProduct}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black transition-all active:scale-[0.98] cursor-pointer shadow-xs",
              "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            <PlusCircleIcon className="size-4 shrink-0" />
            <span>{isOccupied ? "Ürün Ekle" : "+ Sipariş Başlat"}</span>
          </button>

          {/* Hesap Kapat (if occupied) */}
          {isOccupied && (
            <button
              type="button"
              onClick={onSettleBill}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
            >
              <CreditCardIcon className="size-4 shrink-0" />
              <span>Hesap Al</span>
            </button>
          )}

          {/* Fiş Yazdır */}
          <button
            type="button"
            onClick={onPrintBill}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Fiş / Adisyon Yazdır"
          >
            <PrinterIcon className="size-4 text-primary" />
          </button>
        </div>
      </div>

      {/* 3. ORDER ITEMS LIST (SPACIOUS, SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:px-5 sm:py-3.5 flex flex-col gap-2 min-h-40">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <UtensilsCrossedIcon className="size-3" />
            <span>Adisyon Kalemleri</span>
          </span>
          {isOccupied && (
            <span>{activeLines.length} Kalem</span>
          )}
        </div>

        {isOccupied ? (
          <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/80 bg-muted/15 overflow-hidden">
            {activeLines.map((line) => (
              <div
                key={line.id}
                className="flex items-start justify-between gap-2 p-2.5 text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="size-5.5 rounded-md bg-foreground/10 text-foreground flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                    {line.quantity}×
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-foreground truncate leading-tight">
                      {line.name}
                    </span>
                    {line.variantName && (
                      <span className="text-[11px] text-muted-foreground">
                        {line.variantName}
                      </span>
                    )}
                    {line.modifiers && line.modifiers.length > 0 && (
                      <span className="text-[10px] text-muted-foreground/80">
                        {line.modifiers.map((m) => m.name).join(", ")}
                      </span>
                    )}
                    {line.lineNote && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                        &ldquo;{line.lineNote}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  <span className="font-black text-foreground tabular-nums text-xs">
                    {formatCurrency(line.unitPrice * line.quantity)}
                  </span>
                  {line.state === "SERVED" ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                      Teslim
                    </span>
                  ) : line.state === "PREPARED" ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Hazır
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400">
                      Mutfakta
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/10 my-auto">
            <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
              <SparklesIcon className="size-5" />
            </div>
            <p className="font-extrabold text-foreground text-xs">Masa Boş</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
              Sipariş girmek için &quot;+ Sipariş Başlat&quot; butonuna dokunun.
            </p>
          </div>
        )}
      </div>

      {/* 4. MANAGEMENT ACTIONS (CLEAN 4-BUTTON GRID AT BOTTOM) */}
      <div className="p-3 sm:px-5 sm:py-3 border-t border-border/70 bg-card">
        <div className="grid grid-cols-4 gap-1.5">
          {/* Transfer Table */}
          <button
            type="button"
            disabled={!isOccupied}
            onClick={onTransferTable}
            className="flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-[10px] font-bold border border-border/70 bg-muted/20 hover:bg-muted transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
            title="Masayı Taşı (Transfer)"
          >
            <ArrowRightLeftIcon className="size-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="truncate">Taşı</span>
          </button>

          {/* Merge Tables */}
          <button
            type="button"
            disabled={!isOccupied}
            onClick={onMergeTable}
            className="flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-[10px] font-bold border border-border/70 bg-muted/20 hover:bg-muted transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
            title="Masaları Birleştir"
          >
            <MergeIcon className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">Birleştir</span>
          </button>

          {/* View Details */}
          <button
            type="button"
            onClick={onViewDetails}
            className="flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-[10px] font-bold border border-border/70 bg-muted/20 hover:bg-muted transition-colors active:scale-[0.98] cursor-pointer text-foreground"
            title="Adisyon Detayı"
          >
            <ReceiptIcon className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Detay</span>
          </button>

          {/* Void / Clear Table */}
          {isOccupied ? (
            <button
              type="button"
              onClick={onVoidTable}
              className="flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-[10px] font-bold border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive transition-colors active:scale-[0.98] cursor-pointer"
              title="Masayı Boşalt / İptal Et"
            >
              <Trash2Icon className="size-3.5 shrink-0" />
              <span className="truncate">Boşalt</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-[10px] font-bold border border-border/70 hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
            >
              <XIcon className="size-3.5 shrink-0" />
              <span>Kapat</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
