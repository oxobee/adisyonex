"use client";

import { useEffect, useRef, useTransition, useMemo, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LogOutIcon, PlusIcon, PackageCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { PackagedDeliveryDialog } from "./packaged-delivery-dialog";
import { markPickedUpAction } from "@/actions/kitchen.actions";
import { staffLogoutAction } from "@/actions/staff-auth.actions";
import { dismissWaiterCallAction } from "@/actions/guest-order.actions";
import { orderRunningTotal } from "@/components/pos/types";
import { KitchenStatusBadge } from "@/components/shared/kitchen-status-badge";
import { SelfOrderBadge } from "@/components/shared/self-order-badge";
import { SoundToggle } from "@/components/shared/sound-toggle";
import { Button } from "@/components/ui/button";
import { useAnnouncer } from "@/hooks/use-announcer";
import { useServerAction } from "@/hooks/use-server-action";
import { newIds, orderReadyPhrase } from "@/lib/announce";
import { deriveKitchenStatus } from "@/lib/kitchen";
import { cn } from "@/lib/utils";
import type { OrderDTO } from "@/types/order";

const minutesAgo = (iso: string): string => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return `${mins} dk önce`;
};

const orderTitle = (order: OrderDTO): string =>
  order.orderType === "DINE_IN"
    ? order.tableLabel ?? "Masada Servis"
    : `Paket #${order.orderNumber}`;

const itemCount = (order: OrderDTO): number =>
  order.lines.filter((l) => l.state !== "VOID").reduce((s, l) => s + l.quantity, 0);

const isReady = (order: OrderDTO): boolean =>
  deriveKitchenStatus(order.lines.map((l) => l.state)) === "READY";

const hasSelfOrder = (order: OrderDTO): boolean =>
  order.lines.some((l) => l.state !== "VOID" && l.source === "SELF_ORDER");

const AUTH_ERRORS: Record<string, string> = {
  STAFF_FORBIDDEN: "Bu işlemi yapmak için yetkiniz yok.",
  NO_STAFF_SESSION: "Oturum süresi doldu. Lütfen tekrar giriş yapın.",
  ORDER_NOT_OPEN: "Bu sipariş artık açık değil.",
};
const toMessage = (m: string) => AUTH_ERRORS[m] ?? m;

export function WaiterHome({
  username,
  restaurantName,
  staffName,
  openOrders,
}: {
  readonly username: string;
  readonly restaurantName: string;
  readonly staffName: string;
  readonly openOrders: readonly OrderDTO[];
}) {
  const router = useRouter();
  const { supported, enabled, toggle, announce } = useAnnouncer();
  const [pending, startTransition] = useTransition();
  const [selectedPackagedOrder, setSelectedPackagedOrder] = useState<OrderDTO | null>(null);
  const readyRef = useRef<ReadonlySet<string> | null>(null);
  const pickup = useServerAction(markPickedUpAction, {
    refresh: true,
    onSuccess: () => {
      toast.success("Sipariş teslim alındı ✓");
    },
    onError: (m) => toast.error(toMessage(m)),
  });

  // Auto-refresh so kitchen status (Preparing / Ready) and waiter calls stay current hands-free.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  // Active waiter calls
  const activeWaiterCalls = useMemo(
    () => openOrders.filter((o) => o.note?.includes("GARSON")),
    [openOrders],
  );
  const prevWaiterCallsRef = useRef<Set<string>>(new Set());

  const handleDismissWaiterCall = useCallback(
    async (orderId: string) => {
      try {
        await dismissWaiterCallAction({ orderId });
        toast.success("Garson çağrısı kapatıldı ✓");
        router.refresh();
      } catch {
        toast.error("Çağrı kapatılamadı.");
      }
    },
    [router],
  );

  useEffect(() => {
    const currentIds = new Set(activeWaiterCalls.map((o) => o.id));
    const isNew = activeWaiterCalls.some((o) => !prevWaiterCallsRef.current.has(o.id));
    if (isNew && activeWaiterCalls.length > 0) {
      const latest = activeWaiterCalls[activeWaiterCalls.length - 1];
      announce(`Masa ${latest.tableLabel ?? latest.orderNumber} garson çağırıyor.`, "beep");
      toast.error(`🛎️ Masa ${latest.tableLabel ?? `#${latest.orderNumber}`} Garson Çağırdı!`, {
        duration: 10000,
        action: {
          label: "Çağrıyı Kapat",
          onClick: () => handleDismissWaiterCall(latest.id),
        },
      });
    }
    prevWaiterCallsRef.current = currentIds;
  }, [activeWaiterCalls, announce, handleDismissWaiterCall]);

  useEffect(() => {
    const ready = openOrders.filter(isReady);
    const ids = ready.map((o) => o.id);
    if (readyRef.current === null) {
      readyRef.current = new Set(ids);
      return;
    }
    const fresh = newIds(readyRef.current, ids);
    readyRef.current = new Set(ids);
    const readyOrder =
      fresh.length > 0 ? ready.find((o) => o.id === fresh[0]) : undefined;
    if (readyOrder) {
      announce(orderReadyPhrase(readyOrder), "boop");
    }
  }, [openOrders, announce]);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{restaurantName}</p>
          <h1 className="text-xl font-bold">Merhaba, {staffName}</h1>
        </div>
        <div className="flex items-center gap-1">
          <SoundToggle
            supported={supported}
            enabled={enabled}
            onToggle={toggle}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => staffLogoutAction(username))}
          >
            <LogOutIcon className="size-4" />
            Çıkış
          </Button>
        </div>
      </div>

      <Button size="lg" className="h-14 w-full text-base" render={<Link href={`/u/${username}/order/new`} />}>
        <PlusIcon className="size-5" />
        Yeni Sipariş
      </Button>

      {/* 🛎️ CANLI GARSON ÇAĞRILARI BİLDİRİM KARTI */}
      {activeWaiterCalls.length > 0 && (
        <div className="flex flex-col gap-2 animate-in fade-in-50 duration-300">
          {activeWaiterCalls.map((call) => (
            <div
              key={call.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xl ring-2 ring-red-400/50 animate-pulse"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl animate-bounce shrink-0">🛎️</span>
                <div className="min-w-0">
                  <h4 className="font-black text-sm tracking-tight truncate">
                    {call.tableLabel ? `${call.tableLabel} Masası` : `Sipariş #${call.orderNumber}`}
                  </h4>
                  <p className="text-[11px] opacity-95 font-semibold">Müşteri Garson Çağırdı!</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDismissWaiterCall(call.id)}
                className="h-8 rounded-xl font-black text-xs bg-white text-red-600 hover:bg-zinc-100 shadow-md cursor-pointer shrink-0 ml-2"
              >
                Çağrıyı Kapat
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-sm font-medium">
          Açık Siparişler {openOrders.length > 0 ? `(${openOrders.length})` : ""}
        </h2>
        {openOrders.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            Açık sipariş yok. Başlamak için &quot;Yeni Sipariş&quot;e dokunun.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {openOrders.map((order) => (
              <li
                key={order.id}
                className={cn(
                  "overflow-hidden rounded-xl border transition-all",
                  order.note?.includes("GARSON") &&
                    "border-red-500 bg-red-500/10 ring-2 ring-red-500/40 animate-pulse",
                )}
              >
                <Link
                  href={`/u/${username}/order/${order.id}`}
                  className="hover:bg-accent flex items-center justify-between gap-3 p-4 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">
                        {orderTitle(order)}
                      </span>
                      <KitchenStatusBadge
                        states={order.lines.map((l) => l.state)}
                      />
                      {hasSelfOrder(order) ? <SelfOrderBadge /> : null}
                      {order.note?.includes("GARSON") ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-black animate-bounce">
                          🛎️ Garson Çağrıldı
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {itemCount(order)} ürün · {minutesAgo(order.createdAt)}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-sm tabular-nums font-medium">
                    {orderRunningTotal(order).toFixed(0)} ₺
                  </span>
                </Link>
                {(() => {
                  const hasUnservedPackaged = order.lines.some(
                    (l) =>
                      l.itemType === "PACKAGED_GOODS" &&
                      l.state !== "SERVED" &&
                      l.state !== "VOID",
                  );
                  const ready = isReady(order);
                  if (!hasUnservedPackaged && !ready) return null;

                  return (
                    <div className="border-t p-2 flex flex-col gap-1.5 bg-muted/20">
                      {hasUnservedPackaged ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-full text-xs font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedPackagedOrder(order);
                          }}
                        >
                          <PackageCheckIcon className="size-4 text-emerald-600" />
                          <span>Paketli Ürünleri Teslim Et</span>
                        </Button>
                      ) : null}
                      {ready ? (
                        <Button
                          className="h-11 w-full text-base font-bold"
                          disabled={pickup.isPending}
                          onClick={() => pickup.execute({ orderId: order.id })}
                        >
                          Teslim Al
                        </Button>
                      ) : null}
                    </div>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <PackagedDeliveryDialog
        order={selectedPackagedOrder}
        open={Boolean(selectedPackagedOrder)}
        onOpenChange={(open) => !open && setSelectedPackagedOrder(null)}
      />
    </div>
  );
}
