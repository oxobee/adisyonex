"use client";

import { useMemo } from "react";

import { toast } from "sonner";

import { settleTableAction } from "@/actions/order.actions";
import {
  PaymentEntryFields,
  usePaymentEntry,
} from "@/components/pos/payment-entry";
import { orderRunningTotal } from "@/components/pos/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerAction } from "@/hooks/use-server-action";
import { formatCurrency } from "@/lib/format";
import type { OrderDTO } from "@/types/order";

import { enqueueOfflineAction } from "@/lib/offline-sync";

const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/** Settle every open order on one table with a single combined payment. */
export function TableSettleDialog({
  tableLabel,
  orders,
  onOpenChange,
  onSettled,
}: {
  readonly tableLabel: string;
  readonly orders: readonly OrderDTO[];
  readonly onOpenChange: (open: boolean) => void;
  readonly onSettled: () => void;
}) {
  const rows = useMemo(
    () => orders.map((order) => ({ order, total: orderRunningTotal(order) })),
    [orders],
  );
  const combined = round2(rows.reduce((s, r) => s + r.total, 0));

  const pay = usePaymentEntry(combined);

  const settle = useServerAction(settleTableAction, {
    refresh: true,
    onSuccess: () => {
      toast.success(`${tableLabel} masasındaki ${orders.length} siparişin hesabı kapatıldı`);
      onOpenChange(false);
      onSettled();
    },
    onError: (message) => {
      if (
        message.toLowerCase().includes("fetch") ||
        message.toLowerCase().includes("network") ||
        (typeof navigator !== "undefined" && !navigator.onLine)
      ) {
        // Fallback to offline queue
        enqueueOfflineAction("settleTable", {
          orderIds: orders.map((o) => o.id),
          payments: pay.toPayments(),
        });
        toast.success(
          `Lokal Sunucu: ${tableLabel} masasının ödemesi yerel hafızaya kaydedildi. İnternet bağlandığında otomatik senkronize edilecek.`
        );
        onOpenChange(false);
        onSettled();
      } else {
        toast.error(message);
      }
    },
  });

  const canSettle = pay.covered && !settle.isPending;

  const submit = () => {
    if (!canSettle) {
      return;
    }
    const payload = {
      orderIds: orders.map((o) => o.id),
      payments: pay.toPayments(),
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction("settleTable", payload);
      toast.success(
        `Lokal Sunucu: ${tableLabel} masasının ödemesi yerel hafızaya kaydedildi. İnternet bağlandığında otomatik senkronize edilecek.`
      );
      onOpenChange(false);
      onSettled();
      return;
    }

    settle.execute(payload);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tableLabel} Masasının Hesabını Kapat</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <dl className="bg-muted/50 flex flex-col gap-1 rounded-md p-3 text-sm">
            {rows.map(({ order, total }) => (
              <div key={order.id} className="flex justify-between">
                <dt className="text-muted-foreground">
                  #{order.orderNumber}
                  {order.customerName ? ` · ${order.customerName}` : ""}
                </dt>
                <dd className="tabular-nums">{formatCurrency(total)}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold">
              <dt>Genel Toplam</dt>
              <dd className="tabular-nums">{formatCurrency(combined)}</dd>
            </div>
          </dl>

          <PaymentEntryFields entry={pay} />
        </div>

        <DialogFooter>
          <Button disabled={!canSettle} onClick={submit}>
            {settle.isPending
              ? "Kapatılıyor…"
              : `Hesabı Kapat · ${formatCurrency(combined)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
