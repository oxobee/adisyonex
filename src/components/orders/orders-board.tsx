"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TableSettleDialog } from "@/components/orders/table-settle-dialog";
import { orderRunningTotal } from "@/components/pos/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KitchenStatusBadge } from "@/components/shared/kitchen-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { SelfOrderBadge } from "@/components/shared/self-order-badge";
import { SoundToggle } from "@/components/shared/sound-toggle";
import { Toaster } from "@/components/ui/sonner";
import { useAnnouncer } from "@/hooks/use-announcer";
import {
  alertSignatureMap,
  newOrderAlerts,
  newOrderPhrase,
  selfOrderAlertPhrase,
} from "@/lib/announce";
import { formatCurrency, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderDTO, TodaySalesDTO } from "@/types/order";

type Tab = "OPEN" | "COMPLETED";

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

/** Group open orders by table, preserving first-seen order. Orders without a
 *  table stay on their own. */
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

/** Pleasant 3-tone chime for bill request notifications using Web Audio API */
const playBillAlertSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: E5
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

    // Tone 2: G5
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

    // Tone 3: C6
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1046.5, now + 0.3);
    gain3.gain.setValueAtTime(0.4, now + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.3);
    osc3.stop(now + 0.9);
  } catch {}
};

export function OrdersBoard({
  open,
  completed,
  sales,
}: {
  readonly open: readonly OrderDTO[];
  readonly completed: readonly OrderDTO[];
  readonly sales: TodaySalesDTO;
}) {
  const [tab, setTab] = useState<Tab>("OPEN");
  const [settleGroup, setSettleGroup] = useState<TableGroup | null>(null);

  const router = useRouter();
  const { supported, enabled, toggle, announce } = useAnnouncer();
  const seenRef = useRef<Map<string, number> | null>(null);
  const seenBillRef = useRef<Set<string>>(new Set());

  const groups = useMemo(() => groupByTable(open), [open]);

  // Active bill requests
  const activeBillRequests = useMemo(
    () => open.filter((o) => o.billRequestedAt !== null),
    [open],
  );

  // Poll every 5s so new orders & bill requests surface in real-time.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  // Detect bill requests and fire chime & banner
  useEffect(() => {
    const currentBillIds = new Set(
      open.filter((o) => o.billRequestedAt !== null).map((o) => o.id),
    );

    for (const id of currentBillIds) {
      if (!seenBillRef.current.has(id)) {
        const ord = open.find((o) => o.id === id);
        playBillAlertSound();
        const label = ord?.tableLabel ? `Masa ${ord.tableLabel}` : `#${ord?.orderNumber}`;
        toast.warning(`🧾 ${label} Hesap İstedi!`, {
          duration: 10000,
          description: "Müşteri hesap talebinde bulundu. Lütfen adisyonu masaya iletin.",
        });
        if (ord?.tableLabel) {
          announce(`${ord.tableLabel} hesap istedi`, "beep");
        }
      }
    }
    seenBillRef.current = currentBillIds;
  }, [open, announce]);

  // Voice-announce new orders
  useEffect(() => {
    const sigs = open.map((o) => ({
      id: o.id,
      selfOrderLines: o.lines.filter(
        (l) => l.state !== "VOID" && l.source === "SELF_ORDER",
      ).length,
    }));
    if (seenRef.current === null) {
      seenRef.current = alertSignatureMap(sigs);
      return;
    }
    const alerts = newOrderAlerts(seenRef.current, sigs);
    seenRef.current = alertSignatureMap(sigs);
    const alert = alerts[0];
    if (!alert) {
      return;
    }
    const order = open.find((o) => o.id === alert.id);
    if (order) {
      announce(
        alert.isSelfOrder ? selfOrderAlertPhrase(order) : newOrderPhrase(order),
        "beep",
      );
    }
  }, [open, announce]);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Siparişler" description="Canlı adisyonlar ve günün tamamlanan hesapları." />
        <div className="flex items-center gap-2">
          <SoundToggle
            supported={supported}
            enabled={enabled}
            onToggle={toggle}
          />
          <Button render={<Link href="/dashboard/pos" />}>Yeni Sipariş</Button>
        </div>
      </div>

      {/* Top Drop-down Alert Banner for Bill Requests */}
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

      {/* Today's sales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Net Satış" value={formatCurrency(sales.gross)} />
        <Stat label="Toplanan KDV" value={formatCurrency(sales.tax)} />
        <Stat label="Sipariş Sayısı" value={String(sales.orders)} />
        <Stat label="İptaller" value={String(sales.voids)} />
      </div>
      {sales.byMode.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sales.byMode.map((m) => (
            <Badge key={m.mode} variant="secondary">
              {m.mode}: {formatCurrency(m.amount)} · {m.count}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "OPEN" ? "default" : "outline"}
          onClick={() => setTab("OPEN")}
        >
          Açık ({open.length})
        </Button>
        <Button
          size="sm"
          variant={tab === "COMPLETED" ? "default" : "outline"}
          onClick={() => setTab("COMPLETED")}
        >
          Tamamlanan ({completed.length})
        </Button>
      </div>

      {tab === "COMPLETED" ? (
        completed.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Bugün tamamlanmış sipariş bulunmuyor.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((order) => (
              <OrderCard key={order.id} order={order} tab={tab} />
            ))}
          </ul>
        )
      ) : open.length === 0 ? (
        <p className="text-muted-foreground text-sm">Açık adisyon bulunmuyor.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => {
            const hasBill = group.orders.some((o) => o.billRequestedAt !== null);

            return group.orders.length >= 2 && group.tableLabel ? (
              <div
                key={group.key}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300",
                  hasBill
                    ? "border-2 border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40"
                    : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">
                      {group.tableLabel} · {group.orders.length} sipariş ·{" "}
                      <span className="tabular-nums">
                        {formatCurrency(group.total)}
                      </span>
                    </span>
                    {hasBill ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-black text-black shadow-sm">
                        <span>🧾</span> HESAP İSTENDİ
                      </span>
                    ) : null}
                  </div>
                  <Button size="sm" onClick={() => setSettleGroup(group)}>
                    Masayı Kapat
                  </Button>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.orders.map((order) => (
                    <OrderCard key={order.id} order={order} tab={tab} />
                  ))}
                </ul>
              </div>
            ) : (
              <ul
                key={group.key}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {group.orders.map((order) => (
                  <OrderCard key={order.id} order={order} tab={tab} />
                ))}
              </ul>
            );
          })}
        </div>
      )}

      {settleGroup ? (
        <TableSettleDialog
          tableLabel={settleGroup.tableLabel ?? "Masa"}
          orders={settleGroup.orders}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSettleGroup(null);
            }
          }}
          onSettled={() => setSettleGroup(null)}
        />
      ) : null}
      <Toaster position="top-right" />
    </div>
  );
}

function OrderCard({
  order,
  tab,
}: {
  readonly order: OrderDTO;
  readonly tab: Tab;
}) {
  const typeLabels: Record<string, string> = {
    DINE_IN: "Masa",
    TAKEAWAY: "Gel-Al",
    DELIVERY: "Paket",
  };

  const hasBill = order.billRequestedAt !== null;

  return (
    <li>
      <Link
        href={`/dashboard/orders/${order.id}`}
        className={cn(
          "flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md",
          hasBill
            ? "border-2 border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/40"
            : "hover:border-primary border-border",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">
            #{order.orderNumber}
            {order.invoiceNumber ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                · Fatura #{order.invoiceNumber}
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-1.5">
            {hasBill ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-black shadow-xs">
                <span>🧾</span> HESAP İSTENDİ
              </span>
            ) : null}
            <span className="text-muted-foreground text-xs">
              {formatTime(order.createdAt)}
            </span>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {typeLabels[order.orderType] ?? order.orderType}
            {order.tableLabel ? ` · ${order.tableLabel}` : ""}
            {order.customerName ? ` · ${order.customerName}` : ""}
          </span>
          <span className="flex items-center gap-2">
            {tab === "OPEN" ? (
              <KitchenStatusBadge states={order.lines.map((l) => l.state)} />
            ) : null}
            {order.lines.some(
              (l) => l.state !== "VOID" && l.source === "SELF_ORDER",
            ) ? (
              <SelfOrderBadge />
            ) : null}
            <span className="tabular-nums font-semibold text-foreground">
              {tab === "COMPLETED"
                ? formatCurrency(order.grandTotal)
                : `${activeCount(order.lines)} ürün`}
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-2xl border p-4 bg-card shadow-2xs">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
