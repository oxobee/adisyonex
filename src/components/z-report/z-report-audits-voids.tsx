"use client";

import {
  AlertOctagonIcon,
  ClockIcon,
  GiftIcon,
  PercentIcon,
  ShieldAlertIcon,
  UserIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditItemDTO, DiscountSummary } from "@/types/z-report";

export function ZReportAuditsVoidsCard({
  audits,
  discounts,
}: {
  readonly audits: readonly AuditItemDTO[];
  readonly discounts: DiscountSummary;
}) {
  const voidItems = audits.filter((a) => a.type === "VOID");
  const compItems = audits.filter((a) => a.type === "COMP");

  const totalVoid = voidItems.reduce((s, a) => s + a.amount, 0);
  const totalComp = compItems.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. ÜST ÖZET KARTLARI (İPTAL, İKRAM & İNDİRİMLER) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* İptaller */}
        <div className="flex flex-col p-4.5 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Toplam İptal (Void)
            </span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertOctagonIcon className="size-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-rose-700 tabular-nums">
              {formatCurrency(totalVoid)}
            </span>
          </div>
          <span className="text-xs text-rose-600 font-medium">
            {voidItems.length} Kalem / Sipariş İptal Edildi
          </span>
        </div>

        {/* İkramlar */}
        <div className="flex flex-col p-4.5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              İkram & Zayi (Comp)
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <GiftIcon className="size-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-amber-700 tabular-nums">
              {formatCurrency(totalComp)}
            </span>
          </div>
          <span className="text-xs text-amber-700 font-medium">
            {compItems.length} Kalem İkram Olarak Servis Edildi
          </span>
        </div>

        {/* İndirimler */}
        <div className="flex flex-col p-4.5 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Uygulanan İndirimler
            </span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <PercentIcon className="size-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-blue-700 tabular-nums">
              {formatCurrency(discounts.total)}
            </span>
          </div>
          <span className="text-xs text-blue-600 font-medium">
            {discounts.orderCount} Siparişte İndirim Yapıldı
          </span>
        </div>
      </div>

      {/* 2. DENETİM & AUDIT TABLOSU (İPTAL VE İKRAM AYRINTILARI) */}
      <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlertIcon className="size-4.5 text-rose-600" />
              <span>İptal, İade & İkram Denetim Kayıtları (Audit Trail)</span>
            </h3>
            <p className="text-xs text-gray-500">
              Kayıp, kaçak ve suiistimali engellemek için kaydedilen detaylı işlem dökümü
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {audits.length} Kayıt
          </span>
        </div>

        {audits.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Bugün herhangi bir iptal veya ikram işlemi gerçekleşmedi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold">
                  <th className="py-2.5 px-3">Saat</th>
                  <th className="py-2.5 px-3">İşlem Türü</th>
                  <th className="py-2.5 px-3">Adisyon / Masa</th>
                  <th className="py-2.5 px-3">Ürün</th>
                  <th className="py-2.5 px-3 text-center">Adet</th>
                  <th className="py-2.5 px-3 text-right">Tutar</th>
                  <th className="py-2.5 px-3">İşlemi Yapan</th>
                  <th className="py-2.5 px-3">Neden / Sebep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 tabular-nums flex items-center gap-1">
                      <ClockIcon className="size-3 text-gray-400" />
                      <span>{a.time}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border",
                          a.type === "VOID"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : a.type === "COMP"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-100 text-gray-700 border-gray-200",
                        )}
                      >
                        {a.type === "VOID" ? "İPTAL" : a.type === "COMP" ? "İKRAM" : "İADE"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">
                      #{a.orderNumber} {a.tableLabel ? `(${a.tableLabel})` : ""}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{a.itemName}</td>
                    <td className="py-2.5 px-3 text-center font-bold tabular-nums">{a.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900 tabular-nums">
                      {formatCurrency(a.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 flex items-center gap-1">
                      <UserIcon className="size-3 text-gray-400" />
                      <span>{a.staffName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 italic max-w-xs truncate">
                      {a.reason || "Belirtilmedi"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. PERSONEL BAZLI İNDİRİMLER LİSTESİ */}
      <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Personel Bazlı İndirim İstatistikleri</h4>
            <span className="text-xs text-gray-500">
              Hangi personelin ne kadar tutarda indirim gerçekleştirdiği bilgisi
            </span>
          </div>
        </div>

        {discounts.staffDiscounts.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            Bugün personel tarafından uygulanan bir indirim bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {discounts.staffDiscounts.map((sd) => (
              <div
                key={sd.staffName}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80"
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-gray-200 font-bold text-gray-700">
                    {sd.staffName.charAt(0)}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-900">{sd.staffName}</span>
                    <span className="block text-[10px] text-gray-500">{sd.count} Adisyon İndirimi</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 tabular-nums">
                  −{formatCurrency(sd.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
