"use client";

import { CoinsIcon } from "@/components/ui/icons";

interface RevenueHeroCardProps {
  todayNetSales: number;
  growthPercent: number;
  yesterdaySameHourSales: number;
  totalOrders: number;
  maxOrderValue: number;
  currency?: string;
  sparkline?: number[];
}

export function RevenueHeroCard({
  todayNetSales,
  growthPercent,
  yesterdaySameHourSales,
  totalOrders,
  maxOrderValue,
  currency = "₺",
  sparkline = [20, 32, 28, 45, 42, 60, 55, 78, 85, 95],
}: RevenueHeroCardProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  // Sparkline path generator
  const max = Math.max(...sparkline, 1);
  const min = Math.min(...sparkline, 0);
  const width = 110;
  const height = 44;
  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / (max - min || 1)) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  const isPositiveGrowth = growthPercent >= 0;

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-5 text-white shadow-lg shadow-indigo-600/20 sm:p-6">
      {/* Arka plan parlama halkası */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-indigo-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-purple-500/20 blur-2xl" />

      <div className="relative z-10">
        {/* Üst Satır: Başlık + Yüzdelik Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-indigo-100/90">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <CoinsIcon size={14} weight="duotone" className="text-amber-300" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">
              BUGÜNKÜ NET CİRO
            </span>
          </div>

          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-sm border ${
              isPositiveGrowth
                ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/20"
                : "bg-rose-400/15 text-rose-300 border-rose-400/20"
            }`}
          >
            <span>{isPositiveGrowth ? "↑" : "↓"}</span>
            <span>{isPositiveGrowth ? "+" : ""}{growthPercent.toFixed(1)}%</span>
          </div>
        </div>

        {/* Orta Bölüm: Ana Değer + Sparkline Grafiği */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-3xl sm:text-[34px] font-black tracking-tight leading-none text-white">
              {currency}{formatCurrency(todayNetSales)}
            </div>
            <p className="mt-1.5 text-xs font-medium text-indigo-200/90">
              Dünkü aynı saate göre:{" "}
              <span className="font-bold text-white">
                {currency}{formatCurrency(yesterdaySameHourSales)}
              </span>
            </p>
          </div>

          {/* Minimalist Sparkline SVG */}
          <div className="shrink-0 pb-1">
            <svg
              width={width}
              height={height}
              className="overflow-visible"
              viewBox={`0 0 ${width} ${height}`}
            >
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        </div>

        {/* İnce Ayırıcı Çizgi */}
        <div className="my-4 h-px w-full bg-white/10" />

        {/* Alt Satır: Bugünkü Toplam Sipariş · En Yüksek Sipariş */}
        <div className="flex items-center justify-between text-xs text-indigo-100">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white">{totalOrders}</span>
            <span className="text-indigo-200">Toplam Sipariş</span>
            <span className="text-[10px] text-indigo-300">(Masa + Paket)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-indigo-200">En Yüksek Sipariş:</span>
            <span className="font-bold text-white">
              {currency}{formatCurrency(maxOrderValue)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
