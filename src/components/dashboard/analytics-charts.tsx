"use client";

import {
  CreditCardIcon,
  DollarSignIcon,
  LandmarkIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  UtensilsIcon,
  WalletIcon,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DashboardOrderTypeSlice,
  DashboardPaymentSlice,
  DashboardTopItem,
} from "@/types/dashboard";

const MODE_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  CASH: {
    label: "Nakit",
    icon: DollarSignIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500",
  },
  CARD: {
    label: "Kredi Kartı",
    icon: CreditCardIcon,
    color: "text-sky-500",
    bg: "bg-sky-500",
  },
  UPI: {
    label: "Havale / EFT",
    icon: LandmarkIcon,
    color: "text-purple-500",
    bg: "bg-purple-500",
  },
  OTHER: {
    label: "Diğer",
    icon: WalletIcon,
    color: "text-amber-500",
    bg: "bg-amber-500",
  },
};

const TYPE_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  DINE_IN: {
    label: "Masada Servis",
    icon: UtensilsIcon,
    color: "text-amber-500",
    bg: "bg-amber-500",
  },
  TAKEAWAY: {
    label: "Gel-Al",
    icon: ShoppingBagIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-500",
  },
  DELIVERY: {
    label: "Paket Servis",
    icon: PackageIcon,
    color: "text-sky-500",
    bg: "bg-sky-500",
  },
};

export function PaymentBreakdownCard({
  payments,
}: {
  readonly payments: readonly DashboardPaymentSlice[];
}) {
  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Toplam Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60">
        {payments.map((p) => {
          const meta = MODE_META[p.mode] ?? MODE_META.OTHER;
          const pct = total > 0 ? (p.amount / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={p.mode}
              style={{ width: `${pct}%` }}
              className={cn("h-full transition-all duration-500", meta.bg)}
              title={`${meta.label}: ${formatCurrency(p.amount)} (%${pct.toFixed(0)})`}
            />
          );
        })}
      </div>

      {/* Kalemler Listesi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {payments.length === 0 ? (
          <span className="text-xs text-muted-foreground">Henüz tahsilat kaydedilmedi.</span>
        ) : (
          payments.map((p) => {
            const meta = MODE_META[p.mode] ?? MODE_META.OTHER;
            const Icon = meta.icon;
            const pct = total > 0 ? ((p.amount / total) * 100).toFixed(0) : "0";

            return (
              <div
                key={p.mode}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/30 border border-border/40"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-xl bg-background border border-border/50 shadow-xs", meta.color)}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-foreground">
                      {meta.label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground font-semibold">
                      %{pct} Pay
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-foreground tabular-nums">
                  {formatCurrency(p.amount)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function ChannelBreakdownCard({
  channels,
}: {
  readonly channels: readonly DashboardOrderTypeSlice[];
}) {
  const total = channels.reduce((s, c) => s + c.orders, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Toplam Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60">
        {channels.map((c) => {
          const meta = TYPE_META[c.type] ?? TYPE_META.DINE_IN;
          const pct = total > 0 ? (c.orders / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={c.type}
              style={{ width: `${pct}%` }}
              className={cn("h-full transition-all duration-500", meta.bg)}
              title={`${meta.label}: ${c.orders} sipariş (%${pct.toFixed(0)})`}
            />
          );
        })}
      </div>

      {/* Kanal Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {channels.map((c) => {
          const meta = TYPE_META[c.type] ?? TYPE_META.DINE_IN;
          const Icon = meta.icon;
          const pct = total > 0 ? ((c.orders / total) * 100).toFixed(0) : "0";

          return (
            <div
              key={c.type}
              className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/30 border border-border/40"
            >
              <div className="flex items-center justify-between">
                <div className={cn("p-1.5 rounded-xl bg-background border border-border/50 shadow-xs", meta.color)}>
                  <Icon className="size-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-background border border-border/50">
                  %{pct}
                </span>
              </div>
              <span className="text-xs font-bold text-foreground mt-1">
                {meta.label}
              </span>
              <span className="text-sm font-black text-foreground tabular-nums">
                {c.orders} Sipariş
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopItemsLeaderboard({
  items,
}: {
  readonly items: readonly DashboardTopItem[];
}) {
  const maxQty = Math.max(...items.map((i) => i.quantity), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 ? (
        <span className="text-xs text-muted-foreground p-3">Bugün henüz sipariş satışı gerçekleşmedi.</span>
      ) : (
        items.map((item, idx) => {
          const rank = idx + 1;
          const pct = Math.round((item.quantity / maxQty) * 100);

          return (
            <div
              key={item.name}
              className="group relative flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Derece Rozeti */}
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-xs",
                    rank === 1
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
                      : rank === 2
                        ? "bg-zinc-400/20 text-zinc-300 border border-zinc-400/40"
                        : rank === 3
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                          : "bg-muted text-muted-foreground border border-border/40",
                  )}
                >
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between pr-3">
                    <span className="truncate text-xs sm:text-sm font-bold text-foreground">
                      {item.name}
                    </span>
                    <span className="text-xs font-black text-foreground tabular-nums">
                      {item.quantity} adet
                    </span>
                  </div>

                  {/* Görsel İlerleme Çubuğu */}
                  <div className="h-1.5 w-full bg-muted/70 rounded-full mt-1.5 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-zinc-400" : "bg-emerald-500",
                      )}
                    />
                  </div>
                </div>
              </div>

              {item.revenue ? (
                <span className="text-xs font-black text-emerald-500 tabular-nums ml-2 shrink-0">
                  {formatCurrency(item.revenue)}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
