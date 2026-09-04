"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  ClockIcon,
  CreditCardIcon,
  DollarSignIcon,
  LayersIcon,
  ReceiptIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  UtensilsIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";

import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import {
  ChannelBreakdownCard,
  PaymentBreakdownCard,
  TopItemsLeaderboard,
} from "@/components/dashboard/analytics-charts";
import { HourlyTrafficChart } from "@/components/dashboard/hourly-traffic-chart";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardDTO } from "@/types/dashboard";

const deltaPct = (current: number, previous: number): number | null =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

export function DashboardView({
  data,
  lowStock,
}: {
  readonly data: DashboardDTO;
  readonly lowStock: number;
}) {
  const [activePeriod, setActivePeriod] = useState<"today" | "month">("today");

  const todayDelta = deltaPct(data.today.sales, data.yesterdaySales);
  const monthDelta = deltaPct(data.month.sales, data.lastMonthSales);
  const paymentsTotal = data.paymentMixToday.reduce((s, m) => s + m.amount, 0);

  const occupancyPct =
    data.occupancy.total > 0
      ? Math.round((data.occupancy.occupied / data.occupancy.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1750px] mx-auto w-full bg-gray-50/50 min-h-screen">
      <AutoRefresh />

      {/* 
        ========================================================================
        UNTITLED UI APPLICATION HEADER
        ========================================================================
      */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in duration-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Canlı Veri Senkronizasyonu Aktif
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 mt-1 flex items-center gap-2.5">
            <BarChart3Icon className="size-6 text-primary" />
            <span>Genel Bakış & İşletme Analitiği</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Untitled UI Segmented Control */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200/80">
            <button
              type="button"
              onClick={() => setActivePeriod("today")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none active:scale-95",
                activePeriod === "today"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod("month")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none active:scale-95",
                activePeriod === "month"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              Bu Ay
            </button>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        KRİTİK STOK BİLDİRİMİ
        ========================================================================
      */}
      {lowStock > 0 && (
        <Link
          href="/dashboard/inventory"
          className="group flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/80 text-amber-900 transition-all duration-150 shadow-xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangleIcon className="size-4.5" />
            </div>
            <div>
              <span className="block text-sm font-bold">
                {lowStock} adet stok kalemi kritik seviyede!
              </span>
              <span className="block text-xs text-amber-700">
                Tükenmek üzere olan ürünleri incelemek ve giriş yapmak için tıklayın.
              </span>
            </div>
          </div>
          <span className="shrink-0 text-xs font-bold underline group-hover:translate-x-0.5 transition-transform">
            Stoğu İncele →
          </span>
        </Link>
      )}

      {/* 
        ========================================================================
        KATEGORİ 1: UNTITLED UI METRIC CARDS (KPIs)
        ========================================================================
      */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <TrendingUpIcon className="size-3.5 text-primary" />
          <span>Finansal Özet & Temel Göstergeler ({activePeriod === "today" ? "Bugün" : "Bu Ay"})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Bugünkü / Aylık Ciro */}
          <div
            className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-150 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "20ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {activePeriod === "today" ? "Bugünkü Ciro" : "Bu Ayki Toplam Ciro"}
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <DollarSignIcon className="size-4" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                {formatCurrency(activePeriod === "today" ? data.today.sales : data.month.sales)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              {(activePeriod === "today" ? todayDelta : monthDelta) !== null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
                    (activePeriod === "today" ? todayDelta : monthDelta)! >= 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200",
                  )}
                >
                  {(activePeriod === "today" ? todayDelta : monthDelta)! >= 0 ? (
                    <ArrowUpRightIcon className="size-3" />
                  ) : (
                    <ArrowDownRightIcon className="size-3" />
                  )}
                  <span>%{Math.abs((activePeriod === "today" ? todayDelta : monthDelta)!)}</span>
                  <span className="font-normal opacity-80">
                    {activePeriod === "today" ? "düne göre" : "geçen aya göre"}
                  </span>
                </span>
              ) : (
                <span className="text-gray-400">Önceki veri yok</span>
              )}

              <span className="text-xs text-gray-500 font-medium">
                KDV: {formatCurrency(activePeriod === "today" ? data.today.tax : data.month.tax)}
              </span>
            </div>
          </div>

          {/* 2. Sipariş Hacmi & Sepet Ortalaması */}
          <div
            className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-150 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "50ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {activePeriod === "today" ? "Bugünkü Siparişler" : "Bu Ayki Siparişler"}
              </span>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                <ReceiptIcon className="size-4" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                {activePeriod === "today" ? data.today.orders : data.month.orders}
              </span>
              <span className="text-xs text-gray-500 font-medium ml-1.5">Adisyon</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              <span className="text-gray-500">Ort. Adisyon (AOV):</span>
              <span className="font-bold text-gray-900 tabular-nums">
                {formatCurrency(activePeriod === "today" ? data.today.aov : data.month.aov)}
              </span>
            </div>
          </div>

          {/* 3. Açık Masalar & Bekleyen Ciro */}
          <div
            className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-150 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "80ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Şu An Masada (Açık Adisyon)
              </span>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                <UtensilsIcon className="size-4" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                {formatCurrency(data.openNow.value)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              <span className="font-semibold text-gray-800">
                {data.openNow.count} açık masa
              </span>
              {data.openNow.oldestMinutes !== null && (
                <span className="text-amber-700 font-bold">
                  En eski: {data.openNow.oldestMinutes} dk
                </span>
              )}
            </div>
          </div>

          {/* 4. Tahsil Edilen Ödemeler */}
          <div
            className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-150 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "110ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Bugün Kasaya Giren (Tahsilat)
              </span>
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                <CreditCardIcon className="size-4" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 tabular-nums">
                {formatCurrency(paymentsTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
              <span className="text-gray-500">İptal/Fire:</span>
              <span className="font-bold text-rose-600">
                {data.voidsToday} Kalem
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        KATEGORİ 2: İNTERAKTİF GRAFİK PANELLERİ
        ========================================================================
      */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sol Panel: Günlük Satış Trendi */}
        <div
          className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "140ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUpIcon className="size-4.5 text-emerald-600" />
                <span>Günlük Ciro & Satış Trendi</span>
              </h3>
              <p className="text-xs text-gray-500">
                Aylık performans ve dönemsel dalgalanma analizi
              </p>
            </div>
          </div>

          <SalesTrendChart data={data.trend} />
        </div>

        {/* Sağ Panel: Saatlik Sipariş Yoğunluğu */}
        <div
          className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "170ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ClockIcon className="size-4.5 text-amber-500" />
                <span>Saatlik Yoğunluk & Zirve Saatler (Peak Hours)</span>
              </h3>
              <p className="text-xs text-gray-500">
                Hangi saat diliminde daha çok sipariş geldiğini takip edin
              </p>
            </div>
          </div>

          {data.hourlyTraffic && data.hourlyTraffic.length > 0 ? (
            <HourlyTrafficChart data={data.hourlyTraffic} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 text-xs">
              Bugün için saatlik sipariş verisi henüz oluşmadı.
            </div>
          )}
        </div>
      </section>

      {/* 
        ========================================================================
        KATEGORİ 3 & 4: SALON KAPASİTESİ, ÖDEME VE HİZMET KANALLARI
        ========================================================================
      */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* 1. Masa & Salon Doluluk Oranı */}
        <div
          className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "200ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                <UtensilsCrossedIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Masa & Kapasite Durumu
                </h3>
                <span className="text-xs text-gray-500">
                  Canlı salon doluluk metriği
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/tables"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Masalar →
            </Link>
          </div>

          <div className="my-4 flex items-center justify-between gap-4">
            <div>
              <span className="block text-3xl font-bold text-gray-900 tabular-nums">
                {data.occupancy.occupied} / {data.occupancy.total}
              </span>
              <span className="block text-xs text-gray-500 font-medium mt-0.5">
                {data.occupancy.total - data.occupancy.occupied} masa müsait
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-amber-600 tabular-nums">
                %{occupancyPct}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                Doluluk
              </span>
            </div>
          </div>

          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${occupancyPct}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                occupancyPct > 80 ? "bg-rose-500" : occupancyPct > 40 ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
          </div>
        </div>

        {/* 2. Ödeme Yöntemleri Dağılımı */}
        <div
          className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "230ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
                <CreditCardIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Ödeme Yöntemleri
                </h3>
                <span className="text-xs text-gray-500">
                  Nakit vs Kredi Kartı vs Havale
                </span>
              </div>
            </div>
          </div>

          <div className="my-3">
            <PaymentBreakdownCard payments={data.paymentMixToday} />
          </div>
        </div>

        {/* 3. Sipariş Kanalları */}
        <div
          className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "260ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                <LayersIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Sipariş Kanalları
                </h3>
                <span className="text-xs text-gray-500">
                  Hizmet türüne göre dağılım
                </span>
              </div>
            </div>
          </div>

          <div className="my-3">
            <ChannelBreakdownCard channels={data.orderTypeToday} />
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        KATEGORİ 5: MENÜ & ŞAMPİYON ÜRÜNLER (EN ÇOK SATANLAR)
        ========================================================================
      */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className="lg:col-span-2 flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "290ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                <SparklesIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  Bugün En Çok Satan Ürünler (Liderlik Tablosu)
                </h3>
                <span className="text-xs text-gray-500">
                  En çok talep gören ve ciro getiren menü kalemleri
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/menu"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Menü Yönetimi →
            </Link>
          </div>

          <TopItemsLeaderboard items={data.topItemsToday} />
        </div>

        {/* Sağ Panel: Müşteri & Sistem Durumu */}
        <div
          className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "320ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <UsersIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Müşteri & Sistem Durumu
                </h3>
                <span className="text-xs text-gray-500">
                  CRM ve operasyonel sağlık
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/customers"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Müşteriler →
            </Link>
          </div>

          <div className="flex flex-col gap-2.5 my-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-primary" />
                <span className="text-xs font-semibold text-gray-800">Kayıtlı Müşteri</span>
              </div>
              <span className="text-sm font-bold text-gray-900 tabular-nums">
                {data.customerCount ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <XCircleIcon className="size-4 text-rose-500" />
                <span className="text-xs font-semibold text-gray-800">Bugünkü İptaller</span>
              </div>
              <span className="text-sm font-bold text-rose-600 tabular-nums">
                {data.voidsToday} Kalem
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="size-4 text-amber-500" />
                <span className="text-xs font-semibold text-gray-800">Kritik Stok Uyarısı</span>
              </div>
              <span className="text-sm font-bold text-amber-700 tabular-nums">
                {lowStock} Ürün
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
            AdisyonEx bulut raporlama otomatik güncellenir.
          </div>
        </div>
      </section>
    </div>
  );
}
