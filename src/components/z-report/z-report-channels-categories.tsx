"use client";

import {
  ClockIcon,
  FlameIcon,
  LayersIcon,
  PackageIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CategorySalesItem,
  ChannelSalesItem,
  HourlySalesPoint,
  TopItemSalesItem,
} from "@/types/z-report";

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  DINE_IN: UtensilsIcon,
  TAKEAWAY: ShoppingBagIcon,
  DELIVERY: PackageIcon,
};

export function ZReportChannelsCategoriesCard({
  channels,
  categories,
  topItems,
  hourlySales,
}: {
  readonly channels: readonly ChannelSalesItem[];
  readonly categories: readonly CategorySalesItem[];
  readonly topItems: readonly TopItemSalesItem[];
  readonly hourlySales: readonly HourlySalesPoint[];
}) {
  const maxHourlySales = Math.max(...hourlySales.map((h) => h.sales), 1);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. ÜST SATIR: SATIŞ KANALLARI & KATEGORİ DAĞILIMI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Satış Kanalları */}
        <div className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <LayersIcon className="size-4.5 text-blue-600" />
                  <span>Satış Kanalları</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Hizmet türüne göre sipariş ve ciro dağılımı
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {channels.length} Kanal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {channels.map((ch) => {
                const Icon = CHANNEL_ICONS[ch.channel] || UtensilsIcon;

                return (
                  <div
                    key={ch.channel}
                    className="flex flex-col justify-between p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/80"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-primary shadow-2xs">
                        <Icon className="size-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                        %{ch.percentage}
                      </span>
                    </div>

                    <div className="my-2">
                      <span className="block text-xs font-bold text-gray-900">{ch.label}</span>
                      <span className="text-base font-black text-gray-900 tabular-nums">
                        {formatCurrency(ch.netSales)}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 font-medium">
                      {ch.orderCount} Sipariş
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kategori Satışları */}
        <div className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FlameIcon className="size-4.5 text-amber-500" />
                  <span>Kategori Satışları</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Menü kategorilerine göre satılan adet ve ciro payı
                </p>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                Bugün kategorilendirilmiş sipariş satışı bulunmuyor.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-200/80"
                  >
                    <div>
                      <span className="block text-xs font-bold text-gray-900">
                        {cat.categoryName}
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        {cat.itemCount} Adet Satıldı
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-gray-900 tabular-nums">
                        {formatCurrency(cat.netSales)}
                      </span>
                      <span className="block text-[10px] font-semibold text-emerald-600">
                        %{cat.percentage} Pay
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. EN ÇOK SATAN ÜRÜNLER (TOP 10) */}
      <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="size-4.5 text-amber-500" />
              <span>Günün En Çok Satan 10 Ürünü</span>
            </h3>
            <p className="text-xs text-gray-500">
              Bugün en yüksek adet ve ciroya ulaşan menü kalemleri
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            Top 10 Liderlik
          </span>
        </div>

        {topItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Bugün henüz sipariş satışı gerçekleşmedi.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5">
            {topItems.map((item, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-2xs",
                        rank === 1
                          ? "bg-amber-100 text-amber-800 border border-amber-200 font-black"
                          : rank === 2
                            ? "bg-gray-200 text-gray-800 border border-gray-300 font-black"
                            : rank === 3
                              ? "bg-orange-100 text-orange-800 border border-orange-200 font-black"
                              : "bg-white text-gray-600 border border-gray-200",
                      )}
                    >
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </span>

                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-gray-900 truncate">
                        {item.name}
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        {item.quantity} Adet Satıldı
                      </span>
                    </div>
                  </div>

                  <div className="text-right pl-2 shrink-0">
                    <span className="block text-xs font-bold text-gray-900 tabular-nums">
                      {formatCurrency(item.netSales)}
                    </span>
                    <span className="block text-[10px] font-semibold text-emerald-600">
                      %{item.percentage}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SAATLİK SATIŞ ANALİZİ */}
      <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ClockIcon className="size-4.5 text-blue-600" />
              <span>Saatlik Sipariş Yoğunluğu & Peak Hours</span>
            </h3>
            <p className="text-xs text-gray-500">
              Günün hangi saatlerinde yoğun sipariş ve ciro oluştuğunu inceleyin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-1.5">
          {hourlySales.map((h) => {
            const heightPct = maxHourlySales > 0 ? Math.round((h.sales / maxHourlySales) * 100) : 0;

            return (
              <div
                key={h.hour}
                className="flex flex-col items-center justify-end p-2 rounded-xl bg-gray-50/80 border border-gray-200/80 min-h-[110px]"
                title={`${h.hour}: ${h.orders} sipariş, ${formatCurrency(h.sales)}`}
              >
                <div className="w-full flex items-end justify-center h-14 mb-2">
                  <div
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                    className={cn(
                      "w-4 rounded-t transition-all duration-300",
                      h.sales > 0 ? "bg-amber-500 hover:bg-amber-600" : "bg-gray-200",
                    )}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-900">{h.hour}</span>
                <span className="text-[9px] text-gray-500 font-semibold">{h.orders} sip</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
