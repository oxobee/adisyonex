"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  PlusCircleIcon,
  PrinterIcon,
  ReceiptIcon,
  SparklesIcon,
  Trash2Icon,
  UserIcon,
  UtensilsIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { orderRunningTotal } from "@/components/pos/types";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export function TableDetailModal({
  table,
  orders,
  open,
  onOpenChange,
  onPrintBill,
  onAddProduct,
  onSettleBill,
}: {
  table: TableDTO | null;
  orders: readonly OrderDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrintBill: () => void;
  onAddProduct: () => void;
  onSettleBill: () => void;
}) {
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "VOID"),
    [orders],
  );

  const totalAmount = useMemo(
    () =>
      round2(
        activeOrders.reduce(
          (sum, o) => sum + orderRunningTotal(o),
          0,
        ),
      ),
    [activeOrders],
  );

  const isOccupied = activeOrders.length > 0;

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[96vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ReceiptIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                <span>{table.label} Detay & Adisyon</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                    isOccupied
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                  )}
                >
                  {isOccupied ? `${activeOrders.length} Sipariş Açık` : "Boş Masa"}
                </span>
              </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {table.section ? `Salon: ${table.section}` : "Ana Salon"} {table.seats ? `· Kapasite: ${table.seats} Kişi` : ""}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground font-bold uppercase block">Masa Toplamı</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer ml-2"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
              <UtensilsIcon className="size-10 text-muted-foreground/40 mb-3" />
              <h4 className="font-bold text-foreground text-sm">Masa Boş</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Bu masada henüz kayıtlı bir sipariş bulunmuyor. Yeni sipariş başlatmak için ürün ekleyin.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onAddProduct();
                }}
                className="mt-4 rounded-xl font-bold gap-1.5 cursor-pointer"
              >
                <PlusCircleIcon className="size-4" />
                Ürün Ekle
              </Button>
            </div>
          ) : (
            activeOrders.map((order, orderIdx) => {
              const orderTotal = orderRunningTotal(order);
              const isSelfOrder = order.lines.some((l) => l.source === "SELF_ORDER");

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20 shadow-xs"
                >
                  {/* Order Top Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-foreground">
                        Sipariş #{order.orderNumber}
                      </span>
                      {isSelfOrder ? (
                        <span className="rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold">
                          📱 QR Menü
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                          💼 Garson / POS
                        </span>
                      )}
                      {order.billRequestedAt && (
                        <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 text-[10px] animate-pulse">
                          🧾 Hesap İstendi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        {formatTime(order.createdAt)}
                      </span>
                      <span className="font-black text-foreground tabular-nums">
                        {formatCurrency(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Order Line Items List */}
                  <div className="divide-y divide-border/40 px-4 py-2 text-xs">
                    {order.lines.map((line) => {
                      if (line.state === "VOID") return null;

                      const mods = line.modifiers.map((m) => m.name);
                      const unit =
                        Number(line.unitPrice) +
                        line.modifiers.reduce((s, m) => s + Number(m.priceDelta), 0);
                      const total = line.isComp ? 0 : unit * line.quantity;

                      return (
                        <div
                          key={line.id}
                          className="flex items-start justify-between gap-3 py-2"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">
                                {line.quantity}x {line.name}
                              </span>
                              {line.variantName && (
                                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-semibold">
                                  {line.variantName}
                                </span>
                              )}
                              {line.isComp && (
                                <span className="rounded bg-amber-100 dark:bg-amber-950/60 px-1 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                  İkram
                                </span>
                              )}
                            </div>
                            {mods.length > 0 && (
                              <div className="text-[10px] text-muted-foreground pl-3 mt-0.5">
                                + {mods.join(", ")}
                              </div>
                            )}
                            {line.lineNote && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 italic pl-3 mt-0.5">
                                Not: {line.lineNote}
                              </div>
                            )}
                          </div>

                          <div className="text-right tabular-nums font-bold text-foreground shrink-0">
                            {line.isComp ? "0.00 ₺" : formatCurrency(total)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Note or Customer Info if present */}
                  {order.customerName && (
                    <div className="border-t border-border/40 px-4 py-2 bg-muted/10 text-[11px] text-muted-foreground flex items-center gap-2">
                      <UserIcon className="size-3" />
                      <span>Müşteri: {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ""}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 p-4 bg-card shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold cursor-pointer"
          >
            Pencereyi Kapat
          </Button>

          {isOccupied && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onPrintBill();
                }}
                className="rounded-xl font-bold gap-1.5 cursor-pointer"
              >
                <PrinterIcon className="size-4 text-primary" />
                Fiş / Adisyon
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onAddProduct();
                }}
                className="rounded-xl font-bold gap-1.5 cursor-pointer"
              >
                <PlusCircleIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                Ürün Ekle
              </Button>

              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSettleBill();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md gap-1.5 cursor-pointer"
              >
                <CreditCardIcon className="size-4" />
                Hesap Al / Kapat
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
