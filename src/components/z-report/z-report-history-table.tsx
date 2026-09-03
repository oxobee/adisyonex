"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  LockIcon,
  SearchIcon,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ZReportHistoryItem } from "@/types/z-report";

export function ZReportHistoryTable({
  history,
}: {
  readonly history: readonly ZReportHistoryItem[];
}) {
  const [search, setSearch] = useState("");
  const [filterDiffOnly, setFilterDiffOnly] = useState(false);

  const filtered = history.filter((item) => {
    if (filterDiffOnly && item.cashDifference === 0) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.zNumberFormatted.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q) ||
        item.closedByName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ArchiveIcon className="size-4.5 text-primary" />
            <span>Geçmiş Z Raporları Arşivi</span>
          </h3>
          <p className="text-xs text-gray-500">
            Daha önce kapanmış tüm gün sonu Z raporu kayıtları (Dondurulmuş Snapshot)
          </p>
        </div>

        {/* Filtre & Arama */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Z No, Tarih veya Kapatan ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-52 sm:w-64 rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-900 focus:bg-white focus:border-primary focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterDiffOnly((p) => !p)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none",
              filterDiffOnly
                ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
            )}
          >
            Sadece Kasa Farkı Olanlar
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Kayıtlı geçmiş Z raporu bulunamadı.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold">
                <th className="py-2.5 px-3">Z No</th>
                <th className="py-2.5 px-3">Tarih</th>
                <th className="py-2.5 px-3">Açılış / Kapanış</th>
                <th className="py-2.5 px-3 text-center">Sipariş</th>
                <th className="py-2.5 px-3 text-right">Net Satış (Ciro)</th>
                <th className="py-2.5 px-3 text-right">Nakit</th>
                <th className="py-2.5 px-3 text-right">Kredi Kartı</th>
                <th className="py-2.5 px-3 text-right">Kasa Farkı</th>
                <th className="py-2.5 px-3">Kapatan</th>
                <th className="py-2.5 px-3 text-center">İncele</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-gray-900 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-xs">
                      {item.zNumberFormatted}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans font-bold text-gray-900">{item.date}</td>
                  <td className="py-3 px-3 text-gray-500 text-xs">
                    <div className="flex items-center gap-1 font-sans">
                      <ClockIcon className="size-3 text-gray-400" />
                      <span>{item.openedAt} — {item.closedAt}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-gray-900 tabular-nums">
                    {item.orderCount}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 tabular-nums">
                    {formatCurrency(item.netSales)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-gray-700 tabular-nums">
                    {formatCurrency(item.cashSales)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-gray-700 tabular-nums">
                    {formatCurrency(item.cardSales)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {item.cashDifference === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold font-sans text-xs">
                        <CheckCircle2Icon className="size-3" />
                        <span>0 ₺</span>
                      </span>
                    ) : item.cashDifference > 0 ? (
                      <span className="text-blue-700 font-bold">
                        +{formatCurrency(item.cashDifference)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold font-sans text-xs">
                        <AlertTriangleIcon className="size-3" />
                        <span>−{formatCurrency(Math.abs(item.cashDifference))}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-sans text-xs text-gray-600">
                    {item.closedByName}
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <Link
                      href={`/dashboard/z-report?zId=${item.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                      title="Geçmiş Snapshot'ı İncele"
                    >
                      <LockIcon className="size-3" />
                      <span>Görüntüle</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
