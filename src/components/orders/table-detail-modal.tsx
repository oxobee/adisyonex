"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  CreditCardIcon,
  Loader2Icon,
  PlusCircleIcon,
  PrinterIcon,
  ReceiptIcon,
  SendIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  advanceOrderStateAction,
  deliverTableOrdersAction,
} from "@/actions/order.actions";
import { PackagedDeliveryDialog } from "@/components/waiter/packaged-delivery-dialog";
import { dismissWaiterCallAction } from "@/actions/guest-order.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatTime } from "@/lib/format";
import { orderRunningTotal } from "@/components/pos/types";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO, OrderLineState } from "@/types/order";

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
  const router = useRouter();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [packagedOrder, setPackagedOrder] = useState<OrderDTO | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "VOID"),
    [orders],
  );

  const isOccupied = activeOrders.length > 0;

  const handleAdvance = async (
    orderId: string,
    fromState: OrderLineState,
    toState: OrderLineState,
    successMsg: string,
  ) => {
    setLoadingActionId(orderId);
    try {
      const res = await advanceOrderStateAction({
        orderId,
        fromState,
        toState,
      });
      if (res.success) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(res.error || "İşlem gerçekleştirilemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDeliverTable = async () => {
    if (!table) return;
    if (activeOrders.length > 0) {
      setPackagedOrder(activeOrders[0]);
      return;
    }
    setLoadingActionId(`table-${table.id}`);
    try {
      const res = await deliverTableOrdersAction({ tableId: table.id });
      if (res.success) {
        toast.success(`${table.label} siparişleri teslim edildi olarak işaretlendi.`);
        router.refresh();
      } else {
        toast.error(res.error || "İşlem başarısız oldu");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoadingActionId(null);
    }
  };

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
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <ReceiptIcon className="size-8" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Açık Sipariş Yok</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {table.label} masası şu anda boş ve kayıtlı bir sipariş bulunmuyor.
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
            activeOrders.map((order) => {
              const orderTotal = orderRunningTotal(order);
              const isSelfOrder = order.lines.some((l) => l.source === "SELF_ORDER");

              // Kitchen status check for order
              const nonVoid = order.lines.filter((l) => l.state !== "VOID");
              const hasFired = nonVoid.some((l) => l.state === "FIRED" || l.state === "UNSENT");
              const hasPreparing = !hasFired && nonVoid.some((l) => l.state === "PREPARING");
              const hasPrepared = !hasFired && nonVoid.some((l) => l.state === "PREPARED");
              const isAllServed = nonVoid.length > 0 && nonVoid.every((l) => l.state === "SERVED");

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20 shadow-xs"
                >
                  {/* Order Top Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {order.note?.includes("GARSON") && (
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-red-600 text-white font-black px-2 py-0.5 text-[10px] animate-bounce shadow-xs">
                            🛎️ Garson Çağrıldı
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await dismissWaiterCallAction({ orderId: order.id });
                                toast.success("Garson çağrısı kapatıldı ✓");
                                router.refresh();
                              } catch {
                                toast.error("Çağrı kapatılamadı.");
                              }
                            }}
                            className="text-[10px] underline font-bold text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            Çağrıyı Kapat
                          </button>
                        </div>
                      )}
                      {order.billRequestedAt && (
                        <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 text-[10px] animate-pulse">
                          🧾 Hesap İstendi
                        </span>
                      )}

                      {/* Live Lifecycle Stage Badge */}
                      {hasFired ? (
                        <span className="rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black animate-pulse">
                          ⚡ Yeni Sipariş
                        </span>
                      ) : hasPreparing ? (
                        <span className="rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 px-2 py-0.5 text-[10px] font-black">
                          🍳 Hazırlanıyor
                        </span>
                      ) : hasPrepared ? (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black">
                          ✨ Hazır
                        </span>
                      ) : isAllServed ? (
                        <span className="rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold">
                          ✅ Teslim Edildi
                        </span>
                      ) : null}
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
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 text-[9px] font-black uppercase",
                                  line.itemType === "PACKAGED_GOODS"
                                    ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-500/20"
                                    : "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-500/20",
                                )}
                              >
                                {line.itemType === "PACKAGED_GOODS" ? "📦 Paketli Ürün" : "🍳 Hazırlanan Yemek"}
                              </span>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase",
                                  line.state === "FIRED" || line.state === "UNSENT"
                                    ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                                    : line.state === "PREPARING"
                                      ? "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400"
                                      : line.state === "PREPARED"
                                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                                        : "bg-muted text-muted-foreground",
                                )}
                              >
                                {line.state === "FIRED" || line.state === "UNSENT"
                                  ? "Sırada"
                                  : line.state === "PREPARING"
                                    ? "Hazırlanıyor"
                                    : line.state === "PREPARED"
                                      ? "Hazır"
                                      : "Teslim Edildi"}
                              </span>
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

                  {/* Kitchen & Delivery Progression Action Bar for this Order */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/30 px-4 py-2 text-xs">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Mutfak & Servis İşlemi:
                    </span>

                    <div className="flex items-center gap-2">
                      {hasFired && (
                        <Button
                          size="sm"
                          disabled={loadingActionId === order.id}
                          onClick={() =>
                            handleAdvance(
                              order.id,
                              "FIRED",
                              "PREPARING",
                              `Sipariş #${order.orderNumber} hazırlanmaya başladı!`,
                            )
                          }
                          className="h-7 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold gap-1 cursor-pointer"
                        >
                          {loadingActionId === order.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <ChefHatIcon className="size-3" />
                          )}
                          Hazırlamaya Başla
                        </Button>
                      )}

                      {hasPreparing && (
                        <Button
                          size="sm"
                          disabled={loadingActionId === order.id}
                          onClick={() =>
                            handleAdvance(
                              order.id,
                              "PREPARING",
                              "PREPARED",
                              `Sipariş #${order.orderNumber} hazırlandı!`,
                            )
                          }
                          className="h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 cursor-pointer"
                        >
                          {loadingActionId === order.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <SparklesIcon className="size-3" />
                          )}
                          Hazırlandı Olarak İşaretle
                        </Button>
                      )}

                      {hasPrepared && (
                        <Button
                          size="sm"
                          disabled={loadingActionId === order.id}
                          onClick={() =>
                            handleAdvance(
                              order.id,
                              "PREPARED",
                              "SERVED",
                              `Sipariş #${order.orderNumber} masaya teslim edildi.`,
                            )
                          }
                          className="h-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black gap-1 cursor-pointer"
                        >
                          {loadingActionId === order.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <CheckCircle2Icon className="size-3" />
                          )}
                          Teslim Et
                        </Button>
                      )}

                      {isAllServed && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2Icon className="size-3.5" />
                          Tüm ürünler teslim edildi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Info if present */}
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

      <PackagedDeliveryDialog
        order={packagedOrder}
        open={Boolean(packagedOrder)}
        onOpenChange={(open) => !open && setPackagedOrder(null)}
        onDelivered={() => router.refresh()}
      />
    </Dialog>
  );
}
