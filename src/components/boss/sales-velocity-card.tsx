"use client";

import { ClockIcon } from "@/components/ui/icons";

export interface HourlySalesPoint {
  hour: string;
  orders: number;
  sales: number;
  isCurrent?: boolean;
}

interface SalesVelocityCardProps {
  hourlyData: HourlySalesPoint[];
  currency?: string;
}

export function SalesVelocityCard({
  hourlyData,
  currency = "₺",
}: SalesVelocityCardProps) {
  // Satışlara göre pik saati bul
  const sorted = [...hourlyData].sort((a, b) => b.sales - a.sales);
  const peak = sorted[0];
  const peakHours = peak && peak.sales > 0 ? `${peak.hour}` : "12:00 – 14:00";
  const peakAmount = peak ? peak.sales : 0;

  const maxAmount = Math.max(...hourlyData.map((h) => h.sales), 1);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
      {/* Üst Kısım: Günlük Satış Hızı Başlığı & Pik Bilgisi */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ClockIcon size={16} weight="duotone" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Günlük Satış Hızı
          </h3>
        </div>

        <span className="text-[11px] font-semibold text-slate-500">
          Pik: {peakHours} {peakAmount > 0 ? `(${currency}${Math.round(peakAmount).toLocaleString("tr-TR")})` : ""}
        </span>
      </div>

      {/* Güncel Saatlik Bar Chart */}
      <div className="mt-6 flex h-32 items-end justify-between gap-1 sm:gap-1.5 pt-2">
        {hourlyData.map((h) => {
          const heightPercent = Math.max((h.sales / maxAmount) * 100, 6);
          const isNow = h.isCurrent;

          return (
            <div
              key={h.hour}
              className="group relative flex flex-1 flex-col items-center justify-end h-full"
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-10 z-10 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-md group-hover:block">
                {currency}{h.sales.toLocaleString("tr-TR")} ({h.orders} Sipariş)
              </div>

              {/* Sütun Çubuğu */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isNow
                    ? "bg-indigo-600 ring-2 ring-indigo-300 ring-offset-1"
                    : h.sales > 0
                    ? "bg-indigo-400 group-hover:bg-indigo-500"
                    : "bg-slate-200 group-hover:bg-slate-300"
                }`}
              />

              {/* Saat Etiketi */}
              <div className="mt-2 flex flex-col items-center">
                <span
                  className={`text-[9px] ${
                    isNow
                      ? "text-indigo-600 font-black"
                      : "text-slate-400 font-semibold"
                  }`}
                >
                  {h.hour.split(":")[0]}
                </span>
                {isNow && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
