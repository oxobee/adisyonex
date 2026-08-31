"use client";

import { useMemo, useRef } from "react";
import {
  CheckCircle2Icon,
  PrinterIcon,
  ReceiptIcon,
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
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export function TableBillModal({
  table,
  orders,
  restaurantName = "Elitale Restoran",
  open,
  onOpenChange,
  onAddProduct,
}: {
  table: TableDTO | null;
  orders: readonly OrderDTO[];
  restaurantName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct?: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === "OPEN"),
    [orders],
  );

  // Flatten all active items across orders
  const items = useMemo(() => {
    const list: {
      name: string;
      variantName?: string | null;
      modifiers: string[];
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      isComp: boolean;
    }[] = [];

    for (const order of activeOrders) {
      for (const line of order.lines) {
        if (line.state === "VOID") continue;
        const mods = line.modifiers.map((m) => m.name);
        const unit = Number(line.unitPrice) + line.modifiers.reduce((s, m) => s + Number(m.priceDelta), 0);
        const total = line.isComp ? 0 : unit * line.quantity;
        list.push({
          name: line.name,
          variantName: line.variantName,
          modifiers: mods,
          quantity: line.quantity,
          unitPrice: unit,
          totalPrice: total,
          isComp: line.isComp,
        });
      }
    }
    return list;
  }, [activeOrders]);

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

  const taxAmount = useMemo(
    () =>
      round2(
        activeOrders.reduce(
          (sum, o) => sum + Number(o.taxTotal || 0),
          0,
        ),
      ),
    [activeOrders],
  );

  const discountAmount = useMemo(
    () =>
      round2(
        activeOrders.reduce(
          (sum, o) => sum + Number(o.discountTotal || 0),
          0,
        ),
      ),
    [activeOrders],
  );

  const subtotal = useMemo(
    () => Math.max(0, round2(totalAmount - taxAmount + discountAmount)),
    [totalAmount, taxAmount, discountAmount],
  );

  const handlePrint = () => {
    window.print();
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PrinterIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Fiş / Adisyon Çıkar
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {table.label} {table.section ? `(${table.section})` : ""} · Termal Çıktı Önizleme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/20 flex flex-col items-center">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center my-auto">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <ReceiptIcon className="size-7" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Açık Adisyon Bulunmuyor</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {table.label} masasında henüz sipariş bulunmamaktadır.
              </p>
              {onAddProduct && (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onAddProduct();
                  }}
                  className="mt-4 rounded-xl font-bold cursor-pointer"
                >
                  <UtensilsIcon className="size-3.5 mr-1.5" />
                  Masaya Ürün Ekle
                </Button>
              )}
            </div>
          ) : (
            /* THERMAL RECEIPT SLIP (80mm representation) */
            <div
              ref={receiptRef}
              id="printable-thermal-receipt"
              className="w-full max-w-[340px] bg-white text-zinc-900 shadow-lg border border-zinc-200 rounded-xl p-5 font-mono text-xs leading-relaxed transition-all"
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-zinc-400">
                <h2 className="font-black text-sm uppercase tracking-wide text-zinc-950">
                  {restaurantName}
                </h2>
                <p className="text-[11px] text-zinc-600 font-sans mt-0.5">
                  Adisyon / Hesap Fişi
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600 font-sans">
                  <span>Masa: <strong className="text-zinc-950 font-bold">{table.label}</strong></span>
                  <span>{formatDate(new Date().toISOString())} {formatTime(new Date().toISOString())}</span>
                </div>
                {activeOrders.length > 0 && (
                  <div className="text-left text-[10px] text-zinc-500 font-sans mt-1">
                    Sipariş No: #{activeOrders.map((o) => o.orderNumber).join(", #")}
                  </div>
                )}
              </div>

              {/* Receipt Items List */}
              <div className="py-3 border-b border-dashed border-zinc-400">
                <div className="flex justify-between font-bold text-[11px] pb-1.5 text-zinc-700">
                  <span>ÜRÜN</span>
                  <span className="text-right">TUTAR</span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="font-bold text-zinc-950 text-[11px]">
                          {item.quantity}x {item.name}
                          {item.variantName ? ` (${item.variantName})` : ""}
                        </div>
                        {item.modifiers.length > 0 && (
                          <div className="text-[10px] text-zinc-500 pl-3">
                            + {item.modifiers.join(", ")}
                          </div>
                        )}
                        {item.isComp && (
                          <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-100 px-1 rounded">
                            İkram
                          </span>
                        )}
                      </div>
                      <div className="text-right font-bold text-zinc-950 tabular-nums">
                        {item.isComp ? "0.00 ₺" : formatCurrency(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Totals Breakdown */}
              <div className="py-3 flex flex-col gap-1 border-b border-dashed border-zinc-400 text-[11px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Ara Toplam:</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>KDV (%10 Dahil):</span>
                    <span className="tabular-nums font-semibold">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>İndirim:</span>
                    <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1.5 mt-1 border-t border-zinc-300 font-black text-sm text-zinc-950">
                  <span>ÖDENECEK:</span>
                  <span className="text-base tabular-nums text-emerald-700">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-3 text-[10px] text-zinc-500 font-sans">
                <p className="font-semibold text-zinc-700">Afiyet Olsun!</p>
                <p className="mt-0.5">Mali değeri yoktur, adisyon fişidir.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 p-4 bg-card shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold cursor-pointer"
          >
            Pencereyi Kapat
          </Button>

          {items.length > 0 && (
            <Button
              type="button"
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl shadow-md cursor-pointer gap-2"
            >
              <PrinterIcon className="size-4" />
              Termal Yazıcıdan Çıkar (Yazdır)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
