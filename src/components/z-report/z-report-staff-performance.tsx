"use client";

import { AwardIcon, UserCheckIcon, UsersIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { StaffPerformanceItem } from "@/types/z-report";

export function ZReportStaffPerformanceCard({
  staffPerformance,
}: {
  readonly staffPerformance: readonly StaffPerformanceItem[];
}) {
  const sorted = [...staffPerformance].sort((a, b) => b.netSales - a.netSales);

  return (
    <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="size-4.5 text-primary" />
            <span>Personel Satış & Operasyon Performansı</span>
          </h3>
          <p className="text-xs text-gray-500">
            Garson ve kasiyerlerin adisyon sayısı, ciro katkısı ve indirim/iptal analizleri
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          {staffPerformance.length} Çalışan
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Bugün personel tarafından kaydedilen bir sipariş bulunmuyor.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold">
                <th className="py-2.5 px-3">Personel</th>
                <th className="py-2.5 px-3">Görevi / Rolü</th>
                <th className="py-2.5 px-3 text-center">Sipariş Sayısı</th>
                <th className="py-2.5 px-3 text-right">Net Satış (Ciro)</th>
                <th className="py-2.5 px-3 text-right">Ort. Adisyon</th>
                <th className="py-2.5 px-3 text-right">İndirim</th>
                <th className="py-2.5 px-3 text-right">İptal / İkram</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((s, idx) => (
                <tr key={s.staffId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 font-bold text-gray-700 text-xs shrink-0">
                        {idx === 0 ? <AwardIcon className="size-4 text-amber-500" /> : s.staffName.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{s.staffName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 border border-gray-200 text-gray-700">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold tabular-nums text-gray-900">
                    {s.orderCount}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 tabular-nums">
                    {formatCurrency(s.netSales)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-gray-700 tabular-nums">
                    {formatCurrency(s.avgOrderAmount)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-rose-600 tabular-nums">
                    {s.discountTotal > 0 ? `−${formatCurrency(s.discountTotal)}` : "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-amber-600 tabular-nums">
                    {s.voidTotal + s.compTotal > 0
                      ? `−${formatCurrency(s.voidTotal + s.compTotal)}`
                      : "—"}
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
