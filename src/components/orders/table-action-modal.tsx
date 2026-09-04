"use client";

import { useMemo } from "react";
import {
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  CreditCardIcon,
  MergeIcon,
  PlusCircleIcon,
  PrinterIcon,
  ReceiptIcon,
  SparklesIcon,
  Trash2Icon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";
import { MaterialTableCard } from "@/components/orders/material-table-card";

export interface TableActionModalProps {
  table: TableDTO;
  orders: readonly OrderDTO[];
  isOpen: boolean;
  onClose: () => void;
  onPrintBill: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onAddProduct: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onSettleBill: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onTransferTable: (table: TableDTO) => void;
  onMergeTable: (table: TableDTO) => void;
  onViewDetails: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onVoidTable: (table: TableDTO) => void;
  onDeliverTable?: (tableId: string) => void;
}

export function TableActionModal({
  table,
  orders,
  isOpen,
  onClose,
  onPrintBill,
  onAddProduct,
  onSettleBill,
  onTransferTable,
  onMergeTable,
  onViewDetails,
  onVoidTable,
  onDeliverTable,
}: TableActionModalProps) {
  const isOccupied = orders.length > 0;

  const activeLines = useMemo(
    () => orders.flatMap((o) => o.lines.filter((l) => l.state !== "VOID")),
    [orders],
  );

  const calculatedTotal = useMemo(
    () => activeLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [activeLines],
  );

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 1. BACKDROP FOR CLICK-AWAY CLOSING */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 2. RESPONSIVE CONTAINER:
          - MOBILE: Elastic Bottom Sheet (slides up from bottom)
          - DESKTOP: Centered Popup Modal
      */}
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4 text-center sm:text-left pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto relative w-full bg-card text-card-foreground border border-border/80 shadow-2xl flex flex-col",
            // Mobile: Bottom sheet with elastic slide-in
            "max-h-[92vh] rounded-t-[32px] sm:rounded-3xl border-b-0 sm:border-b",
            "animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 ease-out",
            // Desktop: Centered Popup (max-w-2xl)
            "sm:max-w-2xl sm:max-h-[88vh] overflow-hidden",
          )}
        >
          {/* Mobile Top Grabber Indicator */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <span className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Close Button Top-Right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute top-3.5 right-3.5 z-20 size-8 sm:size-9 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <XIcon className="size-4.5" />
          </button>

          {/* HEADER AREA: CENTERED SELECTED TABLE CARD */}
          <div className="w-full px-4 sm:px-6 pt-3 sm:pt-6 pb-2 shrink-0">
            <div className="w-full max-w-md mx-auto">
              <MaterialTableCard
                table={table}
                orders={orders}
                isCompact={true}
                className="shadow-lg pointer-events-none"
              />
            </div>
          </div>

          {/* SCROLLABLE WORKBENCH BODY */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 flex flex-col gap-4">
            {/* Kitchen Ready / Deliver Notice */}
            {isDeliverable && onDeliverTable ? (
              <button
                type="button"
                onClick={() => onDeliverTable(table.id)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer shrink-0"
              >
                <CheckCircle2Icon className="size-5 shrink-0" />
                <span>
                  {canDeliverPackaged && hasCooking
                    ? "Paketli Ürünleri Teslim Et"
                    : "Hazır Siparişleri Teslim Et"}
                </span>
              </button>
            ) : isOnlyPreparing ? (
              <div className="flex items-center justify-between rounded-2xl px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <ChefHatIcon className="size-4 text-orange-500 animate-pulse" />
                  <span>Mutfakta Hazırlanıyor</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-500/20">
                  Mutfak
                </span>
              </div>
            ) : null}

            {/* Primary Action Buttons Row */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Ürün Ekle / Sipariş Başlat */}
              <button
                type="button"
                onClick={() => onAddProduct(table, orders)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 px-4 text-xs sm:text-sm font-black transition-all active:scale-[0.98] cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PlusCircleIcon className="size-4.5 shrink-0" />
                <span>{isOccupied ? "Ürün Ekle" : "+ Sipariş Başlat"}</span>
              </button>

              {/* Hesap Al */}
              {isOccupied && (
                <button
                  type="button"
                  onClick={() => onSettleBill(table, orders)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl h-12 px-4 text-xs sm:text-sm font-black transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
                >
                  <CreditCardIcon className="size-4.5 shrink-0" />
                  <span>Hesap Al</span>
                </button>
              )}

              {/* Fiş Yazdır */}
              <button
                type="button"
                onClick={() => onPrintBill(table, orders)}
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer shadow-xs"
                title="Fiş / Adisyon Yazdır"
              >
                <PrinterIcon className="size-5 text-primary" />
              </button>
            </div>

            {/* Order Items List (Adisyon Kalemleri) */}
            <div className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <UtensilsCrossedIcon className="size-3.5" />
                  <span>Adisyon Kalemleri</span>
                </span>
                {isOccupied && <span>{activeLines.length} Kalem</span>}
              </div>

              {isOccupied ? (
                <div className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/80 bg-muted/15 overflow-hidden max-h-[260px] overflow-y-auto">
                  {activeLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-start justify-between gap-2.5 p-2.5 text-xs hover:bg-muted/30 transition-colors"
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
                <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 my-auto">
                  <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                    <SparklesIcon className="size-5" />
                  </div>
                  <p className="font-bold text-foreground text-xs">Masa Boş</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    Sipariş girmek için &quot;+ Sipariş Başlat&quot; butonuna dokunun.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER: 4-BUTTON MANAGEMENT TOOLBAR */}
          <div className="p-3 sm:px-6 sm:py-3.5 border-t border-border/80 bg-card shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                disabled={!isOccupied}
                onClick={() => onTransferTable(table)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground shadow-2xs"
                title="Masayı Taşı"
              >
                <ArrowRightLeftIcon className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="truncate">Taşı</span>
              </button>

              <button
                type="button"
                disabled={!isOccupied}
                onClick={() => onMergeTable(table)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground shadow-2xs"
                title="Masaları Birleştir"
              >
                <MergeIcon className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">Birleştir</span>
              </button>

              <button
                type="button"
                onClick={() => onViewDetails(table, orders)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer text-foreground shadow-2xs"
                title="Adisyon Detayı"
              >
                <ReceiptIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="truncate">Detay</span>
              </button>

              <button
                type="button"
                disabled={!isOccupied}
                onClick={() => onVoidTable(table)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-2 text-xs font-bold border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                title="Masayı Boşalt"
              >
                <Trash2Icon className="size-4 shrink-0" />
                <span className="truncate">Boşalt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
