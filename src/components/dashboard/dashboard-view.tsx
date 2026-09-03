"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  CalendarIcon,
  ChefHatIcon,
  ClockIcon,
  CreditCardIcon,
  DollarSignIcon,
  EyeIcon,
  LayersIcon,
  PackageIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  UtensilsIcon,
  XCircleIcon,
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

  // Düne göre büyüme yüzdesi
  const todayDelta = deltaPct(data.today.sales, data.yesterdaySales);
  // Geçen aya göre büyüme yüzdesi
  const monthDelta = deltaPct(data.month.sales, data.lastMonthSales);

  // Toplam tahsil edilen ödeme
  const paymentsTotal = data.paymentMixToday.reduce((s, m) => s + m.amount, 0);

  // Salon Doluluk Oranı (%)
  const occupancyPct =
    data.occupancy.total > 0
      ? Math.round((data.occupancy.occupied / data.occupancy.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-3.5 sm:p-5 lg:p-7 max-w-[1750px] mx-auto w-full">
      <AutoRefresh />

      {/* 
        ========================================================================
        ÜST BAŞLIK & CANLI ANALİZ DURUMU
        ========================================================================
      */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-xs animate-in fade-in duration-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Canlı Veri Senkronizasyonu Aktif
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-1 flex items-center gap-2">
            <BarChart3Icon className="size-6 text-primary" />
            <span>Genel Bakış & İşletme Analitiği</span>
          </h1>
        </div>

        {/* Dönem Seçici (Bugün vs Bu Ay) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActivePeriod("today")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none active:scale-95",
              activePeriod === "today"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => setActivePeriod("month")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer select-none active:scale-95",
              activePeriod === "month"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Bu Ay
          </button>
        </div>
      </header>

      {/* 
        ========================================================================
        KRİTİK STOK BİLDİRİMİ (VARSA)
        ========================================================================
      */}
      {lowStock > 0 && (
        <Link
          href="/dashboard/inventory"
          className="group flex items-center justify-between gap-3 p-4 rounded-3xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 text-amber-900 dark:text-amber-300 transition-all duration-150 shadow-xs active:scale-[0.99] animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangleIcon className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-black">
                {lowStock} adet stok kalemi kritik seviyede!
              </span>
              <span className="block text-xs opacity-80">
                Tükenmek üzere olan ürünleri incelemek ve giriş yapmak için tıklayın.
              </span>
            </div>
          </div>
          <span className="shrink-0 text-xs font-black underline group-hover:translate-x-0.5 transition-transform">
            Stoğu İncele →
          </span>
        </Link>
      )}

      {/* 
        ========================================================================
        KATEGORİ 1: FİNANSAL ÖZET & TEMEL METRİKLER (KPIs)
        Sıralı Elastik Giriş Animasyonu
        ========================================================================
      */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <TrendingUpIcon className="size-3.5 text-primary" />
            <span>Finansal Özet & Ana Göstergeler ({activePeriod === "today" ? "Bugün" : "Bu Ay"})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-4.5">
          {/* 1. Bugünkü / Aylık Ciro */}
          <div
            className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-md shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-200 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "20ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {activePeriod === "today" ? "Bugünkü Ciro" : "Bu Ayki Toplam Ciro"}
              </span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <DollarSignIcon className="size-4.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                {formatCurrency(activePeriod === "today" ? data.today.sales : data.month.sales)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              {(activePeriod === "today" ? todayDelta : monthDelta) !== null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-extrabold",
                    (activePeriod === "today" ? todayDelta : monthDelta)! >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {(activePeriod === "today" ? todayDelta : monthDelta)! >= 0 ? (
                    <ArrowUpRightIcon className="size-3.5" />
                  ) : (
                    <ArrowDownRightIcon className="size-3.5" />
                  )}
                  <span>%{Math.abs((activePeriod === "today" ? todayDelta : monthDelta)!)}</span>
                  <span className="text-muted-foreground font-normal">
                    {activePeriod === "today" ? "düne göre" : "geçen aya göre"}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground font-medium">Önceki dönem verisi yok</span>
              )}

              <span className="text-[11px] font-semibold text-muted-foreground">
                KDV: {formatCurrency(activePeriod === "today" ? data.today.tax : data.month.tax)}
              </span>
            </div>
          </div>

          {/* 2. Sipariş Hacmi & Sepet Ortalaması */}
          <div
            className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-md shadow-sm hover:shadow-md hover:border-sky-500/40 transition-all duration-200 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "50ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {activePeriod === "today" ? "Bugünkü Siparişler" : "Bu Ayki Siparişler"}
              </span>
              <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
                <ReceiptIcon className="size-4.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                {activePeriod === "today" ? data.today.orders : data.month.orders}
              </span>
              <span className="text-xs text-muted-foreground font-semibold ml-1.5">Adisyon</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">
                Ortalama Adisyon (AOV):
              </span>
              <span className="font-extrabold text-foreground tabular-nums">
                {formatCurrency(activePeriod === "today" ? data.today.aov : data.month.aov)}
              </span>
            </div>
          </div>

          {/* 3. Açık Masalar & Bekleyen Ciro */}
          <div
            className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-md shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all duration-200 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "80ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                Şu An Masada (Açık Adisyonlar)
              </span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <UtensilsIcon className="size-4.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                {formatCurrency(data.openNow.value)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <span className="font-bold text-foreground">
                {data.openNow.count} açık masa
              </span>
              {data.openNow.oldestMinutes !== null && (
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                  En eski: {data.openNow.oldestMinutes} dk
                </span>
              )}
            </div>
          </div>

          {/* 4. Tahsil Edilen Ödemeler */}
          <div
            className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-md shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all duration-200 animate-in fade-in zoom-in-95 fill-mode-both"
            style={{ animationDelay: "110ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                Bugün Kasaya Giren (Tahsilat)
              </span>
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                <CreditCardIcon className="size-4.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="my-2.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                {formatCurrency(paymentsTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">İptal/Fire:</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">
                {data.voidsToday} Kalem
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        KATEGORİ 2: İNTERAKTİF GRAFİK PANELLERİ
        - Günlük Satış Trendi (Area / Bar)
        - Saatlik Mutfak & Kasa Yoğunluğu (Peak Hours)
        ========================================================================
      */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Sol Panel: Günlük Satış Trendi */}
        <div
          className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "140ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <TrendingUpIcon className="size-4.5 text-emerald-500" />
                <span>Günlük Ciro & Satış Trendi</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Aylık performans ve dönemsel dalgalanma analizi
              </p>
            </div>
          </div>

          <SalesTrendChart data={data.trend} />
        </div>

        {/* Sağ Panel: Saatlik Sipariş Yoğunluğu */}
        <div
          className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "170ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <ClockIcon className="size-4.5 text-amber-500" />
                <span>Saatlik Yoğunluk & Zirve Saatler (Peak Hours)</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Hangi saat diliminde daha çok sipariş geldiğini takip edin
              </p>
            </div>
          </div>

          {data.hourlyTraffic && data.hourlyTraffic.length > 0 ? (
            <HourlyTrafficChart data={data.hourlyTraffic} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground text-xs">
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
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {/* 1. Masa & Salon Doluluk Oranı */}
        <div
          className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "200ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UtensilsCrossedIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Masa & Kapasite Durumu
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Canlı salon doluluk metriği
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/tables"
              className="text-xs font-black text-primary hover:underline"
            >
              Masalar →
            </Link>
          </div>

          <div className="my-4 flex items-center justify-between gap-4">
            <div>
              <span className="block text-3xl font-black text-foreground tabular-nums">
                {data.occupancy.occupied} / {data.occupancy.total}
              </span>
              <span className="block text-xs text-muted-foreground font-semibold mt-0.5">
                {data.occupancy.total - data.occupancy.occupied} masa müsait
              </span>
            </div>

            {/* Doluluk Yüzde Rozeti */}
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-amber-500 tabular-nums">
                %{occupancyPct}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Doluluk
              </span>
            </div>
          </div>

          {/* Doluluk Çubuğu */}
          <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden">
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
          className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "230ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <CreditCardIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Ödeme Yöntemleri
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Nakit vs Kredi Kartı vs Havale
                </span>
              </div>
            </div>
          </div>

          <div className="my-3">
            <PaymentBreakdownCard payments={data.paymentMixToday} />
          </div>
        </div>

        {/* 3. Sipariş Kanalları (Masada, Paket, Gel-Al) */}
        <div
          className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "260ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <LayersIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Sipariş Kanalları
                </h3>
                <span className="text-[11px] text-muted-foreground">
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
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Sol 2 Sütun: En Çok Satanlar Liderlik Tablosu */}
        <div
          className="lg:col-span-2 flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "290ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <SparklesIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  Bugün En Çok Satan Ürünler (Liderlik Tablosu)
                </h3>
                <span className="text-xs text-muted-foreground">
                  En çok talep gören ve ciro getiren menü kalemleri
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/menu"
              className="text-xs font-black text-primary hover:underline"
            >
              Menü Yönetimi →
            </Link>
          </div>

          <TopItemsLeaderboard items={data.topItemsToday} />
        </div>

        {/* Sağ 1 Sütun: Müşteri & Ekstra Analitik Özeti */}
        <div
          className="flex flex-col justify-between p-5 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm animate-in fade-in zoom-in-95 fill-mode-both"
          style={{ animationDelay: "320ms", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                <UsersIcon className="size-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Müşteri & Sistem Durumu
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  CRM ve operasyonel sağlık
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/customers"
              className="text-xs font-black text-primary hover:underline"
            >
              Müşteriler →
            </Link>
          </div>

          <div className="flex flex-col gap-3 my-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Kayıtlı Müşteri</span>
              </div>
              <span className="text-sm font-black text-foreground tabular-nums">
                {data.customerCount ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-2">
                <XCircleIcon className="size-4 text-rose-500" />
                <span className="text-xs font-bold text-foreground">Bugünkü İptaller</span>
              </div>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                {data.voidsToday} Kalem
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="size-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground">Kritik Stok Uyarısı</span>
              </div>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {lowStock} Ürün
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            AdisyonEx otomatik raporlama her 10 saniyede bir güncellenir.
          </div>
        </div>
      </section>
    </div>
  );
}
