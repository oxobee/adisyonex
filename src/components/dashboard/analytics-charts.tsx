"use client";

import {
  CreditCardIcon,
  DollarSignIcon,
  LandmarkIcon,
  PackageIcon,
  ShoppingBagIcon,
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
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    bg: "bg-emerald-500",
  },
  CARD: {
    label: "Kredi Kartı",
    icon: CreditCardIcon,
    color: "text-sky-600 bg-sky-50 border-sky-200",
    bg: "bg-sky-500",
  },
  UPI: {
    label: "Havale / EFT",
    icon: LandmarkIcon,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    bg: "bg-purple-500",
  },
  OTHER: {
    label: "Diğer",
    icon: WalletIcon,
    color: "text-amber-600 bg-amber-50 border-amber-200",
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
    color: "text-amber-600 bg-amber-50 border-amber-200",
    bg: "bg-amber-500",
  },
  TAKEAWAY: {
    label: "Gel-Al",
    icon: ShoppingBagIcon,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    bg: "bg-emerald-500",
  },
  DELIVERY: {
    label: "Paket Servis",
    icon: PackageIcon,
    color: "text-sky-600 bg-sky-50 border-sky-200",
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
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
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
          <span className="text-xs text-gray-500">Henüz tahsilat kaydedilmedi.</span>
        ) : (
          payments.map((p) => {
            const meta = MODE_META[p.mode] ?? MODE_META.OTHER;
            const Icon = meta.icon;
            const pct = total > 0 ? ((p.amount / total) * 100).toFixed(0) : "0";

            return (
              <div
                key={p.mode}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-2 rounded-lg border shadow-2xs", meta.color)}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-900">
                      {meta.label}
                    </span>
                    <span className="block text-[10px] text-gray-500 font-medium">
                      %{pct} Pay
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-900 tabular-nums">
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
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
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
              className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className={cn("p-1.5 rounded-lg border shadow-2xs", meta.color)}>
                  <Icon className="size-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                  %{pct}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-800 mt-1">
                {meta.label}
              </span>
              <span className="text-sm font-bold text-gray-900 tabular-nums">
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
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <span className="text-xs text-gray-500 p-3">Bugün henüz sipariş satışı gerçekleşmedi.</span>
      ) : (
        items.map((item, idx) => {
          const rank = idx + 1;
          const pct = Math.round((item.quantity / maxQty) * 100);

          return (
            <div
              key={item.name}
              className="group relative flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:bg-gray-50 transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-2xs",
                    rank === 1
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : rank === 2
                        ? "bg-gray-100 text-gray-700 border border-gray-200"
                        : rank === 3
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : "bg-white text-gray-500 border border-gray-200",
                  )}
                >
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between pr-3">
                    <span className="truncate text-xs sm:text-sm font-semibold text-gray-900">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">
                      {item.quantity} adet
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-gray-200/80 rounded-full mt-1.5 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-gray-400" : "bg-emerald-500",
                      )}
                    />
                  </div>
                </div>
              </div>

              {item.revenue ? (
                <span className="text-xs font-bold text-emerald-600 tabular-nums ml-2 shrink-0">
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
