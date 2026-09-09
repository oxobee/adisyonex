"use client";

import {
  SparkleIcon,
  PlusIcon,
  FileTextIcon,
} from "@/components/ui/icons";

interface AIForecastCardProps {
  confidencePercent: number;
  expectedRevenue: number;
  currency?: string;
  onPairDevice?: () => void;
  onPreviewZReport?: () => void;
}

export function AIForecastCard({
  confidencePercent = 94,
  expectedRevenue = 72000,
  currency = "₺",
  onPairDevice,
  onPreviewZReport,
}: AIForecastCardProps) {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <section className="space-y-3.5">
      {/* AI Gün Sonu Tahmini Kartı */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
        {/* Üst Kısım: AI Başlık + Güven Oranı */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-purple-50/60 via-indigo-50/40 to-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600">
                <SparkleIcon size={16} weight="fill" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                AI Gün Sonu Tahmini
              </h3>
            </div>

            <span className="rounded-full bg-indigo-100/70 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
              GÜVEN: %{confidencePercent}
            </span>
          </div>
        </div>

        {/* İçerik: Beklenen Ciro */}
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">
            Mevcut hıza göre bugün beklenen ciro:
          </p>
          <div className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            {currency}{formatMoney(expectedRevenue)}
          </div>
        </div>
      </div>

      {/* Yan Yana İki Hızlı İşlem Butonu */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPairDevice}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-slate-200/90 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <PlusIcon size={14} weight="bold" className="text-indigo-600" />
          <span>+ Cihaz Eşle</span>
        </button>

        <button
          onClick={onPreviewZReport}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-slate-200/90 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <FileTextIcon size={14} weight="bold" className="text-indigo-600" />
          <span>Z Raporu Önizle</span>
        </button>
      </div>
    </section>
  );
}
