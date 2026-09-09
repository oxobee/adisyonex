"use client";

import {
  ClockIcon,
  CreditCardIcon,
  PackageIcon,
  ReceiptIcon,
} from "@/components/ui/icons";

interface HourlyPoint {
  hour: string;
  amount: number;
  isCurrent?: boolean;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: "payment" | "delivery" | "order";
}

interface SalesVelocityCardProps {
  peakHours: string;
  peakAmount: number;
  hourlyData: HourlyPoint[];
  activities: ActivityItem[];
  currency?: string;
}

export function SalesVelocityCard({
  peakHours = "12:00 – 14:00",
  peakAmount = 18400,
  hourlyData,
  activities,
  currency = "₺",
}: SalesVelocityCardProps) {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  const maxAmount = Math.max(...hourlyData.map((h) => h.amount), 1);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
      {/* Üst Kısım: Günlük Satış Hızı */}
      <div className="p-4 sm:p-5">
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
            Pik: {peakHours} (<span className="text-indigo-600 font-bold">{currency}{Math.round(peakAmount / 1000)}k</span>)
          </span>
        </div>

        {/* Mini Bar Chart */}
        <div className="mt-6 flex h-28 items-end justify-between gap-1.5 pt-2">
          {hourlyData.map((h, i) => {
            const heightPercent = Math.max((h.amount / maxAmount) * 100, 8);
            const isNow = h.isCurrent;

            return (
              <div
                key={h.hour}
                className="group relative flex flex-1 flex-col items-center justify-end h-full"
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-md group-hover:block">
                  {currency}{h.amount.toLocaleString("tr-TR")}
                </div>

                {/* Sütun Çubuğu */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    isNow
                      ? "bg-indigo-600 ring-2 ring-indigo-300 ring-offset-1"
                      : "bg-slate-200 group-hover:bg-indigo-400"
                  }`}
                />

                {/* Saat Etiketi */}
                <div className="mt-2 flex flex-col items-center">
                  <span
                    className={`text-[9px] font-bold ${
                      isNow ? "text-indigo-600 font-extrabold" : "text-slate-400"
                    }`}
                  >
                    {h.hour}
                  </span>
                  {isNow && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* İnce Ayırıcı */}
      <div className="border-t border-slate-100" />

      {/* Alt Kısım: Son Hareketler */}
      <div className="p-4 sm:p-5">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          SON HAREKETLER
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    act.type === "payment"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {act.type === "payment" ? (
                    <CreditCardIcon size={18} weight="duotone" />
                  ) : (
                    <PackageIcon size={18} weight="duotone" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {act.title}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {act.subtitle}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {act.timeAgo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
