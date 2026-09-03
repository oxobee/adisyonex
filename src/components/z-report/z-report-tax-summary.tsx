"use client";

import { CalculatorIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { TaxSummaryItem } from "@/types/z-report";

export function ZReportTaxSummaryCard({
  taxes,
}: {
  readonly taxes: readonly TaxSummaryItem[];
}) {
  const totalMatrah = taxes.reduce((s, t) => s + t.matrah, 0);
  const totalTax = taxes.reduce((s, t) => s + t.taxAmount, 0);
  const totalGrand = taxes.reduce((s, t) => s + t.total, 0);

  return (
    <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CalculatorIcon className="size-4.5 text-primary" />
            <span>KDV & Vergi Dağılım Özeti</span>
          </h3>
          <p className="text-xs text-gray-500">
            Sistemde tanımlı tüm dinamik KDV dilimleri, matrah ve vergi dökümü
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          {taxes.length} Vergi Dilimi
        </span>
      </div>

      {taxes.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Bugün için vergilendirilebilir işlem kaydı bulunamadı.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold">
                <th className="py-2.5 px-3">KDV Oranı</th>
                <th className="py-2.5 px-3 text-right">Matrah (Vergisiz Tutar)</th>
                <th className="py-2.5 px-3 text-right">Hesaplanan KDV</th>
                <th className="py-2.5 px-3 text-right">Vergi Dahil Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {taxes.map((t) => (
                <tr key={t.taxRate} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3 font-sans font-bold text-gray-900">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-xs">
                      %{t.taxRate} KDV
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-gray-700 tabular-nums">
                    {formatCurrency(t.matrah)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-600 tabular-nums">
                    {formatCurrency(t.taxAmount)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900 tabular-nums">
                    {formatCurrency(t.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold font-mono text-gray-900">
                <td className="py-3 px-3 font-sans">GENEL TOPLAM</td>
                <td className="py-3 px-3 text-right tabular-nums text-gray-800">
                  {formatCurrency(totalMatrah)}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-emerald-700">
                  {formatCurrency(totalTax)}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-base text-gray-950">
                  {formatCurrency(totalGrand)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-3 pt-2 text-[11px] text-gray-400">
        * Vergi tutarları, ürünlerdeki vergi dahil/hariç parametrelerine göre satır bazlı hesaplanmıştır.
      </div>
    </div>
  );
}
