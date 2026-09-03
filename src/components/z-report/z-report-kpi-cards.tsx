"use client";

import {
  AlertTriangleIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  DollarSignIcon,
  ReceiptIcon,
  TrendingUpIcon,
  UtensilsIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ZReportKpis } from "@/types/z-report";

export function ZReportKpiCards({
  kpis,
}: {
  readonly kpis: ZReportKpis;
}) {
  const hasCashDiff = kpis.cashDifference !== 0;
  const isCashSurplus = kpis.cashDifference > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 w-full">
      {/* 1. BRÜT SATIŞ */}
      <div className="flex flex-col justify-between p-4.5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Brüt Satış</span>
          <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
            <DollarSignIcon className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
            {formatCurrency(kpis.grossSales)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>{kpis.orderCount} Sipariş</span>
          <span>KDV Dahil</span>
        </div>
      </div>

      {/* 2. NET SATIŞ */}
      <div className="flex flex-col justify-between p-4.5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Net Satış</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUpIcon className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
            {formatCurrency(kpis.netSales)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
          <span className="text-rose-600 font-medium">
            −{formatCurrency(kpis.discountTotal + kpis.voidTotal + kpis.compTotal)}
          </span>
          <span className="text-gray-400">indirim/iptal</span>
        </div>
      </div>

      {/* 3. TOPLAM TAHSİLAT */}
      <div className="flex flex-col justify-between p-4.5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Toplam Tahsilat</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <CreditCardIcon className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
            {formatCurrency(kpis.totalCollections)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Kasaya Giren</span>
          <span className="text-emerald-700 font-semibold">Tahsilli</span>
        </div>
      </div>

      {/* 4. ORTALAMA ADİSYON */}
      <div className="flex flex-col justify-between p-4.5 rounded-2xl border border-gray-200 bg-white shadow-xs hover:border-gray-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Ortalama Adisyon</span>
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
            <ReceiptIcon className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
            {formatCurrency(kpis.avgOrderAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Adisyon Başına</span>
          <span>AOV</span>
        </div>
      </div>

      {/* 5. AÇIK ADİSYON */}
      <div
        className={cn(
          "flex flex-col justify-between p-4.5 rounded-2xl border transition-all shadow-xs",
          kpis.openOrdersCount > 0
            ? "bg-amber-50/50 border-amber-200 ring-1 ring-amber-400/30"
            : "bg-white border-gray-200",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Açık Adisyon</span>
          <div
            className={cn(
              "p-1.5 rounded-lg border",
              kpis.openOrdersCount > 0
                ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                : "bg-gray-100 text-gray-600 border-gray-200",
            )}
          >
            <UtensilsIcon className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <span
            className={cn(
              "text-2xl font-bold tracking-tight tabular-nums",
              kpis.openOrdersCount > 0 ? "text-amber-700" : "text-gray-900",
            )}
          >
            {formatCurrency(kpis.openOrdersTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
          <span className={cn("font-semibold", kpis.openOrdersCount > 0 ? "text-amber-800" : "text-gray-500")}>
            {kpis.openOrdersCount > 0 ? `⚠️ ${kpis.openOrdersCount} Açık Masa` : "Açık Masa Yok"}
          </span>
          <span className="text-gray-400">Bekleyen</span>
        </div>
      </div>

      {/* 6. KASA FARKI */}
      <div
        className={cn(
          "flex flex-col justify-between p-4.5 rounded-2xl border transition-all shadow-xs",
          !hasCashDiff
            ? "bg-emerald-50/40 border-emerald-200"
            : isCashSurplus
              ? "bg-blue-50/40 border-blue-200"
              : "bg-rose-50/50 border-rose-200 ring-1 ring-rose-400/30",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Kasa Farkı</span>
          <div
            className={cn(
              "p-1.5 rounded-lg border",
              !hasCashDiff
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : isCashSurplus
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-rose-100 text-rose-800 border-rose-200 animate-pulse",
            )}
          >
            <BanknoteIcon className="size-4" />
          </div>
        </div>
        <div className="my-2">
          <span
            className={cn(
              "text-2xl font-bold tracking-tight tabular-nums",
              !hasCashDiff
                ? "text-emerald-700"
                : isCashSurplus
                  ? "text-blue-700"
                  : "text-rose-700",
            )}
          >
            {hasCashDiff ? `${isCashSurplus ? "+" : ""}${formatCurrency(kpis.cashDifference)}` : "0,00 ₺"}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
          {!hasCashDiff ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2Icon className="size-3.5" />
              <span>Kasa Eşleşiyor</span>
            </span>
          ) : isCashSurplus ? (
            <span className="text-blue-800 font-bold">Kasa Fazlası</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
              <AlertTriangleIcon className="size-3.5" />
              <span>Kasa Açığı</span>
            </span>
          )}
          <span className="text-gray-400">Mutabakat</span>
        </div>
      </div>
    </div>
  );
}
