"use client";

import {
  CreditCardIcon,
  DollarSignIcon,
  HelpCircleIcon,
  LandmarkIcon,
  ReceiptIcon,
  WalletIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  PaymentMixItem,
  ZReportFinancialSummary,
} from "@/types/z-report";

const MODE_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  CASH: {
    label: "Nakit",
    icon: DollarSignIcon,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    bg: "bg-emerald-500",
  },
  CARD: {
    label: "Kredi Kartı",
    icon: CreditCardIcon,
    color: "text-blue-700 bg-blue-50 border-blue-200",
    bg: "bg-blue-500",
  },
  UPI: {
    label: "Havale / EFT",
    icon: LandmarkIcon,
    color: "text-purple-700 bg-purple-50 border-purple-200",
    bg: "bg-purple-500",
  },
  OTHER: {
    label: "Diğer",
    icon: WalletIcon,
    color: "text-amber-700 bg-amber-50 border-amber-200",
    bg: "bg-amber-500",
  },
};

export function ZReportFinancialSummaryCard({
  financial,
  payments,
}: {
  readonly financial: ZReportFinancialSummary;
  readonly payments: readonly PaymentMixItem[];
}) {
  const totalCollections = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
      {/* 1. SATIŞ ÖZETİ (FİNANSAL AKIŞ) */}
      <div className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ReceiptIcon className="size-4.5 text-primary" />
                <span>Satış Özeti & Finansal Akış</span>
              </h3>
              <p className="text-xs text-gray-500">
                Günlük operasyonun brütten nete gelir tablosu
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {financial.orderCount} Adisyon
            </span>
          </div>

          {/* Finansal Akış Satırları */}
          <div className="flex flex-col gap-2 font-mono text-sm">
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100">
              <span className="text-gray-700 font-sans font-semibold text-xs">Brüt Satış (KDV Dahil)</span>
              <span className="font-bold text-gray-900 tabular-nums">
                {formatCurrency(financial.grossSales)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/40 border border-rose-100">
              <span className="text-rose-800 font-sans text-xs font-semibold">Toplam İndirimler (−)</span>
              <span className="font-bold text-rose-700 tabular-nums">
                −{formatCurrency(financial.discountTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/40 border border-rose-100">
              <span className="text-rose-800 font-sans text-xs font-semibold">İptal Tutarı (−)</span>
              <span className="font-bold text-rose-700 tabular-nums">
                −{formatCurrency(financial.voidTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/40 border border-amber-100">
              <span className="text-amber-800 font-sans text-xs font-semibold">İkram / Zayi Tutarı (−)</span>
              <span className="font-bold text-amber-700 tabular-nums">
                −{formatCurrency(financial.compTotal)}
              </span>
            </div>

            {/* Ayırıcı ve Net Satış */}
            <div className="my-1 border-t-2 border-dashed border-gray-200" />

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <div>
                <span className="block font-sans font-bold text-sm text-emerald-900">NET SATIŞ</span>
                <span className="block font-sans text-[11px] text-emerald-700 font-medium">
                  Fiili tahakkuk eden işletme cirosu
                </span>
              </div>
              <span className="text-xl font-black text-emerald-700 tabular-nums">
                {formatCurrency(financial.netSales)}
              </span>
            </div>
          </div>
        </div>

        {/* Alt İstatistikler (AOV, Ürün, Min/Max) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Satılan Ürün</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">{financial.itemCount} Adet</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Ort. Ürün/Adisyon</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">{financial.avgItemPerOrder} Kalem</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">En Yüksek Adisyon</span>
            <span className="text-sm font-bold text-emerald-600 tabular-nums">{formatCurrency(financial.maxOrderAmount)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">En Düşük Adisyon</span>
            <span className="text-sm font-bold text-gray-700 tabular-nums">{formatCurrency(financial.minOrderAmount)}</span>
          </div>
        </div>
      </div>

      {/* 2. ÖDEME DAĞILIMI & POS / BANKA KIRILIMI */}
      <div className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCardIcon className="size-4.5 text-blue-600" />
                <span>Ödeme Dağılımı & POS / Banka</span>
              </h3>
              <p className="text-xs text-gray-500">
                Tahsilat yöntemleri ve kredi kartı slip dökümü
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              Toplam: {formatCurrency(totalCollections)}
            </span>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 mb-4">
            {payments.map((p) => {
              const meta = MODE_META[p.mode] ?? MODE_META.OTHER;
              if (p.percentage === 0) return null;
              return (
                <div
                  key={p.mode}
                  style={{ width: `${p.percentage}%` }}
                  className={cn("h-full transition-all duration-500", meta.bg)}
                  title={`${meta.label}: ${formatCurrency(p.amount)} (%${p.percentage})`}
                />
              );
            })}
          </div>

          {/* Ana Ödeme Yöntemleri Listesi */}
          <div className="flex flex-col gap-2.5">
            {payments.map((p) => {
              const meta = MODE_META[p.mode] ?? MODE_META.OTHER;
              const Icon = meta.icon;

              return (
                <div key={p.mode} className="flex flex-col p-3 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-1.5 rounded-lg border shadow-2xs", meta.color)}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-gray-900">{meta.label}</span>
                        <span className="block text-[10px] text-gray-500 font-medium">
                          {p.count} İşlem · %{p.percentage} Pay
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>

                  {/* Varsa POS / Banka Alt Kırılımı (Kredi Kartı) */}
                  {p.subBreakdown && p.subBreakdown.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-200/80 flex flex-col gap-1.5 pl-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Banka & Terminal Kırılımı:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {p.subBreakdown.map((sub) => (
                          <div
                            key={sub.name}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                          >
                            <span className="text-gray-700 font-medium truncate max-w-[140px]">
                              {sub.name} ({sub.count})
                            </span>
                            <span className="font-bold text-gray-900 tabular-nums">
                              {formatCurrency(sub.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="flex items-center justify-between pt-3 mt-4 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <HelpCircleIcon className="size-3.5 text-gray-400" />
            <span>Nakit ve POS toplamları kasayla mutabakat edilmelidir.</span>
          </span>
          <span className="font-semibold text-gray-700">{payments.length} Ödeme Türü</span>
        </div>
      </div>
    </div>
  );
}
