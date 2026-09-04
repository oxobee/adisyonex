"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeftIcon,
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
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

export interface TableActionWorkbenchProps {
  table: TableDTO;
  orders: readonly OrderDTO[];
  total?: number;
  firstOrderAt?: string | null;
  onPrintBill: () => void;
  onAddProduct: () => void;
  onSettleBill: () => void;
  onTransferTable: () => void;
  onMergeTable: () => void;
  onViewDetails: () => void;
  onVoidTable: () => void;
  onDeliverTable?: () => void;
}

export function TableActionWorkbench({
  table,
  orders,
  total,
  firstOrderAt,
  onPrintBill,
  onAddProduct,
  onSettleBill,
  onTransferTable,
  onMergeTable,
  onViewDetails,
  onVoidTable,
  onDeliverTable,
}: TableActionWorkbenchProps) {
  const isOccupied = orders.length > 0;

  const activeLines = useMemo(
    () => orders.flatMap((o) => o.lines.filter((l) => l.state !== "VOID")),
    [orders],
  );

  const calculatedTotal = useMemo(() => {
    if (typeof total === "number") return total;
    return activeLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
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
    <div className="w-full max-w-6xl mx-auto rounded-3xl border border-border/80 bg-card/90 dark:bg-card/75 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300">
      {/* 1. WORKBENCH HEADER: Active Table Info & Total Amount */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6 sm:py-4.5 border-b border-border/70 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {table.label}
              </h2>
              {table.section && (
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
                  {table.section}
                </span>
              )}
              {table.seats && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <UsersIcon className="size-3" />
                  <span>{table.seats} Kişi</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs">
              {isOccupied ? (
                <>
                  <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Dolu ({itemCount} Ürün)</span>
                  </span>
                  {elapsed && (
                    <span className="inline-flex items-center gap-1 font-bold tabular-nums text-muted-foreground">
                      <ClockIcon className="size-3" />
                      <span>{elapsed}</span>
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Masa Müsait</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Total Display */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">
              Masa Toplamı
            </span>
            <span className="text-2xl sm:text-3xl font-black text-foreground tabular-nums leading-tight">
              {formatCurrency(calculatedTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN TWO-COLUMN BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/70">
        {/* LEFT COLUMN: Actions & Management (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between gap-6 bg-muted/5">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Masa İşlemleri
            </h3>

            {/* Kitchen Ready / Deliver Notice */}
            {isDeliverable && onDeliverTable ? (
              <button
                type="button"
                onClick={onDeliverTable}
                className="w-full flex items-center justify-center gap-2 rounded-2xl h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2Icon className="size-5 shrink-0" />
                <span>
                  {canDeliverPackaged && hasCooking
                    ? "Paketli Ürünleri Teslim Et"
                    : "Hazır Siparişleri Teslim Et"}
                </span>
              </button>
            ) : isOnlyPreparing ? (
              <div className="flex items-center justify-between rounded-2xl px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <ChefHatIcon className="size-4 text-orange-500 animate-pulse" />
                  <span>Mutfakta Hazırlanıyor</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-500/20">
                  Mutfak
                </span>
              </div>
            ) : null}

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {/* Ürün Ekle / Sipariş Başlat */}
              <button
                type="button"
                onClick={onAddProduct}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl h-12 sm:h-13 px-5 text-sm font-black transition-all active:scale-[0.98] cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PlusCircleIcon className="size-5 shrink-0" />
                <span>{isOccupied ? "Ürün Ekle" : "+ Sipariş Başlat"}</span>
              </button>

              {/* Hesap Al */}
              {isOccupied && (
                <button
                  type="button"
                  onClick={onSettleBill}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl h-12 sm:h-13 px-5 text-sm font-black transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
                >
                  <CreditCardIcon className="size-5 shrink-0" />
                  <span>Hesap Al & Tahsil Et</span>
                </button>
              )}

              {/* Fiş Yazdır */}
              <button
                type="button"
                onClick={onPrintBill}
                className="w-full flex items-center justify-center gap-2 rounded-2xl h-11 px-4 border border-border bg-card hover:bg-muted text-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
              >
                <PrinterIcon className="size-4 text-primary shrink-0" />
                <span>Fiş / Adisyon Yazdır</span>
              </button>
            </div>
          </div>

          {/* Table Management 4-Button Grid */}
          <div className="flex flex-col gap-2 pt-4 border-t border-border/70">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Masa Yönetimi
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {/* Transfer */}
              <button
                type="button"
                disabled={!isOccupied}
                onClick={onTransferTable}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground shadow-2xs"
                title="Masayı Taşı"
              >
                <ArrowRightLeftIcon className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="truncate">Taşı</span>
              </button>

              {/* Merge */}
              <button
                type="button"
                disabled={!isOccupied}
                onClick={onMergeTable}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground shadow-2xs"
                title="Masaları Birleştir"
              >
                <MergeIcon className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">Birleştir</span>
              </button>

              {/* Details */}
              <button
                type="button"
                onClick={onViewDetails}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer text-foreground shadow-2xs"
                title="Adisyon Detayı"
              >
                <ReceiptIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="truncate">Detay</span>
              </button>

              {/* Void */}
              <button
                type="button"
                disabled={!isOccupied}
                onClick={onVoidTable}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-2 text-xs font-bold border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                title="Masayı Boşalt"
              >
                <Trash2Icon className="size-4 shrink-0" />
                <span className="truncate">Boşalt</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Order Lines List (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col gap-3 min-h-[300px]">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <UtensilsCrossedIcon className="size-3.5" />
              <span>Adisyon Kalemleri</span>
            </span>
            {isOccupied && <span>{activeLines.length} Kalem</span>}
          </div>

          {isOccupied ? (
            <div className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/80 bg-muted/15 overflow-hidden max-h-[380px] overflow-y-auto">
              {activeLines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-start justify-between gap-3 p-3 text-xs sm:text-sm hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="size-6 rounded-lg bg-foreground/10 text-foreground flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Teslim
                      </span>
                    ) : line.state === "PREPARED" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Hazır
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
                        Mutfakta
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 my-auto">
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <SparklesIcon className="size-6" />
              </div>
              <p className="font-black text-foreground text-sm">Masa Şu Anda Boş</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Yeni sipariş başlatmak için sol taraftaki &quot;+ Sipariş Başlat&quot; butonuna dokunun.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
