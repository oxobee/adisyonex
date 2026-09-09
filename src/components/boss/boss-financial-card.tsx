"use client";

import {
  TrendUpIcon,
  ArrowDownRightIcon,
  ReceiptIcon,
  CreditCardIcon,
  CoinsIcon,
  ClockIcon,
  SparkleIcon,
  ArmchairIcon,
} from "@/components/ui/icons";
import type { DashboardDTO } from "@/types/dashboard";

interface BossFinancialCardProps {
  data: DashboardDTO;
  currency?: string;
}

export function BossFinancialCard({ data, currency = "₺" }: BossFinancialCardProps) {
  const { today, yesterdaySales, openNow, occupancy, paymentMixToday } = data;

  // Dünkü güne göre fark yüzdesi
  const salesDiff = yesterdaySales > 0 ? ((today.sales - yesterdaySales) / yesterdaySales) * 100 : 0;
  const isPositive = salesDiff >= 0;

  // Ödeme dağılımı (Nakit vs Kart vs Diğer)
  const cashTotal = paymentMixToday.find((p) => p.mode.toUpperCase() === "CASH")?.amount || 0;
  const cardTotal = paymentMixToday.find((p) => p.mode.toUpperCase() === "CARD")?.amount || 0;
  const otherTotal = paymentMixToday
    .filter((p) => !["CASH", "CARD"].includes(p.mode.toUpperCase()))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCollected = cashTotal + cardTotal + otherTotal;
  const cashPercent = totalCollected > 0 ? Math.round((cashTotal / totalCollected) * 100) : 0;
  const cardPercent = totalCollected > 0 ? Math.round((cardTotal / totalCollected) * 100) : 0;

  const occupancyRate = occupancy.total > 0 ? Math.round((occupancy.occupied / occupancy.total) * 100) : 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      {/* Arka plan parlama efekti */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10">
        {/* Üst Satır: Başlık & Dün Karşılaştırması */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Günün Finansal Performansı
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Bugün tamamlanan ve kasaya giren net hasılat
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-xs text-slate-400">Dün:</span>
            <span className="text-xs font-bold text-slate-200">
              {currency} {formatMoney(yesterdaySales)}
            </span>
            <span
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              }`}
            >
              {isPositive ? (
                <TrendUpIcon size={13} weight="bold" />
              ) : (
                <ArrowDownRightIcon size={13} weight="bold" />
              )}
              {isPositive ? "+" : ""}
              {salesDiff.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Ana Rakamlar Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Günlük Net Ciro */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300/80">Net Ciro (Bugün)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                <CoinsIcon size={18} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currency} {formatMoney(today.sales)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              İndirim: {currency} {formatMoney(today.discount)} | KDV: {currency} {formatMoney(today.tax)}
            </div>
          </div>

          {/* 2. Sipariş Sayısı & Sepet Ortalaması */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Toplam Adisyon</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                <ReceiptIcon size={18} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {today.orders}
              </span>
              <span className="text-xs font-medium text-slate-400">Adisyon</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-300 font-medium">
              Ort. Sepet (AOV): <span className="text-amber-300 font-bold">{currency} {formatMoney(today.aov)}</span>
            </div>
          </div>

          {/* 3. Açık Masalar / Bekleyen Hesap */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Açık Masadaki Tutar</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
                <ClockIcon size={18} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-purple-300">
                {currency} {formatMoney(openNow.value)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {openNow.count} açık adisyon {openNow.oldestMinutes ? `(En eski: ${openNow.oldestMinutes} dk)` : ""}
            </div>
          </div>

          {/* 4. Masa Doluluk Oranı */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Masa Doluluk</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <ArmchairIcon size={18} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                %{occupancyRate}
              </span>
              <span className="text-xs font-medium text-slate-400">
                ({occupancy.occupied}/{occupancy.total} masa)
              </span>
            </div>
            {/* Doluluk Çubuğu */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Alt Kısım: Ödeme Dağılım Çubuğu */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-black/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-300">Kasa Tahsilat Dağılımı:</span>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-slate-400">Nakit:</span>
                <span className="font-bold text-slate-200">
                  {currency} {formatMoney(cashTotal)} (%{cashPercent})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-slate-400">Kart:</span>
                <span className="font-bold text-slate-200">
                  {currency} {formatMoney(cardTotal)} (%{cardPercent})
                </span>
              </div>
              {otherTotal > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-400">Diğer:</span>
                  <span className="font-bold text-slate-200">
                    {currency} {formatMoney(otherTotal)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${cashPercent}%` }}
              title={`Nakit %${cashPercent}`}
            />
            <div
              className="bg-blue-400 transition-all duration-500"
              style={{ width: `${cardPercent}%` }}
              title={`Kart %${cardPercent}`}
            />
            <div
              className="bg-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - cashPercent - cardPercent)}%` }}
              title="Diğer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
