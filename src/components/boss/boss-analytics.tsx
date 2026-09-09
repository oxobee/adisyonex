"use client";

import {
  ChartBarIcon,
  ChartLineUpIcon,
  ForkKnifeIcon,
  ShoppingBag as BagIcon,
  UsersIcon,
  SparkleIcon,
  DeviceMobileIcon,
  ArmchairIcon,
} from "@phosphor-icons/react";
import type { DashboardDTO } from "@/types/dashboard";

interface BossAnalyticsProps {
  data: DashboardDTO;
  currency?: string;
}

export function BossAnalytics({ data, currency = "₺" }: BossAnalyticsProps) {
  const {
    hourlyTraffic = [],
    topItemsToday = [],
    orderTypeToday = [],
    trend = [],
    month,
    lastMonthSales,
  } = data;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Saatlik grafikteki maksimum satış değeri
  const trafficList = hourlyTraffic.length > 0 ? hourlyTraffic : [];
  const maxHourlySales = Math.max(...trafficList.map((h) => h.sales), 1);

  // Sipariş tipleri toplamı
  const totalOrdersByType = orderTypeToday.reduce((sum, item) => sum + item.orders, 0);

  // Ay başından bugüne büyüme
  const monthlyGrowth = lastMonthSales > 0 ? ((month.sales - lastMonthSales) / lastMonthSales) * 100 : 0;

  // Trend günlerinin maksimumu
  const maxDailyTrend = Math.max(...trend.map((t) => t.sales), 1);

  return (
    <div className="mt-8 space-y-8">
      {/* 1. Satır: Saatlik Trafik & Sipariş Kanalları Dağılımı */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Saatlik Hasılat & Yoğunluk Grafiği */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <ChartBarIcon size={18} weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Günün Saatlik Yoğunluk Analizi</h3>
                <p className="text-xs text-slate-400">24 saatlik ciro ve sipariş akışı</p>
              </div>
            </div>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
              Bugün (00:00 - 23:59)
            </span>
          </div>

          {/* Bar Grafiği */}
          <div className="mt-6">
            <div className="grid h-48 grid-cols-12 sm:grid-cols-24 items-end gap-1 sm:gap-1.5 pt-6 pb-2">
              {trafficList.map((hourData) => {
                const heightPercent = Math.max((hourData.sales / maxHourlySales) * 100, 4);
                const hasSales = hourData.sales > 0;

                return (
                  <div
                    key={hourData.hour}
                    className="group relative flex h-full flex-col items-center justify-end"
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-12 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-slate-950 px-2.5 py-1.5 text-[11px] text-white shadow-xl group-hover:flex group-hover:flex-col group-hover:items-center">
                      <span className="font-bold text-amber-300">
                        {currency} {formatMoney(hourData.sales)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {hourData.hour} • {hourData.orders} Adisyon
                      </span>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        hasSales
                          ? "bg-gradient-to-t from-blue-600 to-amber-400 group-hover:brightness-125"
                          : "bg-white/5"
                      }`}
                    />
                    <span className="mt-2 text-[9px] font-medium text-slate-400 group-hover:text-amber-300">
                      {hourData.hour.split(":")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </div>
        </div>

        {/* Sipariş Kanalları (Masa, Paket, Gel-Al) */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <ForkKnifeIcon size={18} weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sipariş Kanalları Dağılımı</h3>
              <p className="text-xs text-slate-400">Adisyon türlerine göre dağılım</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {orderTypeToday.map((slice) => {
              const percent = totalOrdersByType > 0 ? Math.round((slice.orders / totalOrdersByType) * 100) : 0;
              const typeLabel =
                slice.type === "DINE_IN"
                  ? "Masa (Restoran İçi)"
                  : slice.type === "TAKEAWAY"
                  ? "Gel-Al (Paket)"
                  : "Paket Servis (Teslimat)";

              const icon =
                slice.type === "DINE_IN" ? (
                  <ArmchairIcon size={18} className="text-emerald-400" />
                ) : slice.type === "TAKEAWAY" ? (
                  <BagIcon size={18} className="text-amber-400" />
                ) : (
                  <DeviceMobileIcon size={18} className="text-blue-400" />
                );

              return (
                <div key={slice.type} className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-xs font-semibold text-slate-200">{typeLabel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white">{slice.orders} Adet</span>
                      <span className="ml-1 text-[11px] text-slate-400">(%{percent})</span>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Satır: En Çok Satan Ürünler & Aylık Kümülatif Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* En Çok Satan Ürünler */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <SparkleIcon size={18} weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Günün En Çok Satanları</h3>
                <p className="text-xs text-slate-400">Bugün en yüksek talep gören ürünler</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">İlk 5 Ürün</span>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {topItemsToday.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Bugün henüz tamamlanmış sipariş kalemi bulunmuyor.
              </div>
            ) : (
              topItemsToday.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-amber-400">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-white">{item.name}</span>
                      <span className="block text-[10px] text-slate-400">{item.quantity} porsiyon satıldı</span>
                    </div>
                  </div>
                  {item.revenue !== undefined && (
                    <span className="text-xs font-bold text-slate-200">
                      {currency} {formatMoney(item.revenue)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aylık Performans & Günlük Satış Eğilimi */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <ChartLineUpIcon size={18} weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Aylık Kümülatif Ciro & Trend</h3>
                <p className="text-xs text-slate-400">Bu ayki toplam ciro ve günlük gidişat</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-amber-300">
                {currency} {formatMoney(month.sales)}
              </div>
              <div className="text-[10px] text-slate-400">
                Geçen aya göre:{" "}
                <span className={monthlyGrowth >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {monthlyGrowth >= 0 ? "+" : ""}{monthlyGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Günlük Trend Çubukları */}
          <div className="mt-6">
            <div className="flex h-36 items-end gap-1 pt-4 pb-2">
              {trend.map((t) => {
                const heightPercent = Math.max((t.sales / maxDailyTrend) * 100, 5);
                return (
                  <div
                    key={t.date}
                    className="group relative flex flex-1 h-full flex-col items-center justify-end"
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-10 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-slate-950 px-2 py-1 text-[10px] text-white shadow-xl group-hover:flex group-hover:flex-col group-hover:items-center">
                      <span className="font-bold text-amber-300">
                        {currency} {formatMoney(t.sales)}
                      </span>
                      <span className="text-[8px] text-slate-400">{t.date}</span>
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t bg-gradient-to-t from-purple-600 to-indigo-400 group-hover:brightness-125 transition-all"
                    />
                    <span className="mt-1 text-[8px] text-slate-400 group-hover:text-white">
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
              <span>Ay Başı (1)</span>
              <span>Bugün</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
