"use client";

import { formatCurrency } from "@/lib/format";
import type { ZReportDTO } from "@/types/z-report";

export function ZReportPrintSheet({
  report,
}: {
  readonly report: ZReportDTO;
}) {
  return (
    <div className="hidden print:block print:w-full print:p-6 print:bg-white print:text-black font-mono text-xs">
      {/* BAŞLIK & İŞLETME BİLGİLERİ */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-black tracking-wider uppercase mb-1">
          {report.restaurantName}
        </h1>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-800">
          GÜN SONU Z RAPORU
        </h2>
        <div className="text-[11px] mt-2 flex justify-between border-t border-dashed border-gray-400 pt-2">
          <span>Rapor No: <strong>{report.zNumberFormatted || "AÇIK GÜN TASLAĞI"}</strong></span>
          <span>Tarih: <strong>{report.dateFormatted}</strong></span>
        </div>
        <div className="text-[10px] flex justify-between text-gray-700 mt-0.5">
          <span>Açılış: {report.openedAt}</span>
          <span>Kapanış: {report.closedAt || "Henüz Kapanmadı"}</span>
          <span>Yetkili: {report.closedByName || "Yönetici"}</span>
        </div>
      </div>

      {/* 1. FİNANSAL SATIŞ TABLOSU */}
      <div className="mb-4">
        <div className="font-bold border-b border-black pb-1 mb-1 text-xs">
          1. SATIŞ VE CİRO ÖZETİ
        </div>
        <table className="w-full text-left">
          <tbody>
            <tr>
              <td className="py-1">Brüt Satış (KDV Dahil):</td>
              <td className="py-1 text-right font-bold">{formatCurrency(report.financial.grossSales)}</td>
            </tr>
            <tr>
              <td className="py-1">Toplam İndirimler (−):</td>
              <td className="py-1 text-right">−{formatCurrency(report.financial.discountTotal)}</td>
            </tr>
            <tr>
              <td className="py-1">İptaller (−):</td>
              <td className="py-1 text-right">−{formatCurrency(report.financial.voidTotal)}</td>
            </tr>
            <tr>
              <td className="py-1">İkram & Zayi (−):</td>
              <td className="py-1 text-right">−{formatCurrency(report.financial.compTotal)}</td>
            </tr>
            <tr className="border-t border-black font-bold text-sm">
              <td className="py-1.5">NET SATIŞ (CİRO):</td>
              <td className="py-1.5 text-right">{formatCurrency(report.financial.netSales)}</td>
            </tr>
            <tr>
              <td className="py-0.5 text-gray-600 text-[10px]">Toplam Adisyon:</td>
              <td className="py-0.5 text-right text-gray-600 text-[10px]">{report.financial.orderCount} adet</td>
            </tr>
            <tr>
              <td className="py-0.5 text-gray-600 text-[10px]">Ortalama Adisyon (AOV):</td>
              <td className="py-0.5 text-right text-gray-600 text-[10px]">{formatCurrency(report.financial.avgOrderAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. ÖDEME YÖNTEMLERİ */}
      <div className="mb-4">
        <div className="font-bold border-b border-black pb-1 mb-1 text-xs">
          2. TAHSİLAT & ÖDEME DAĞILIMI
        </div>
        <table className="w-full text-left">
          <tbody>
            {report.payments.map((p) => (
              <tr key={p.mode} className="border-b border-gray-200">
                <td className="py-1">{p.label} ({p.count} işlem)</td>
                <td className="py-1 text-right font-bold">{formatCurrency(p.amount)}</td>
              </tr>
            ))}
            <tr className="border-t border-black font-bold">
              <td className="py-1">TOPLAM TAHSİLAT:</td>
              <td className="py-1 text-right font-black">{formatCurrency(report.kpis.totalCollections)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. KASA MUTABAKATI */}
      <div className="mb-4">
        <div className="font-bold border-b border-black pb-1 mb-1 text-xs">
          3. KASA MUTABAKATI
        </div>
        <table className="w-full text-left">
          <tbody>
            <tr>
              <td className="py-0.5">Açılış Kasası:</td>
              <td className="py-0.5 text-right">{formatCurrency(report.cashReconciliation.openingCash)}</td>
            </tr>
            <tr>
              <td className="py-0.5">(+) Nakit Satışlar:</td>
              <td className="py-0.5 text-right">+{formatCurrency(report.cashReconciliation.cashSales)}</td>
            </tr>
            <tr>
              <td className="py-0.5">(+) Nakit Kasa Girişleri:</td>
              <td className="py-0.5 text-right">+{formatCurrency(report.cashReconciliation.cashInTotal)}</td>
            </tr>
            <tr>
              <td className="py-0.5">(−) Kasa Gider / Çıkışları:</td>
              <td className="py-0.5 text-right">−{formatCurrency(report.cashReconciliation.cashOutTotal)}</td>
            </tr>
            <tr className="border-t border-gray-300 font-bold">
              <td className="py-1">BEKLENEN KASA:</td>
              <td className="py-1 text-right">{formatCurrency(report.cashReconciliation.expectedCash)}</td>
            </tr>
            <tr className="font-bold">
              <td className="py-1">SAYILAN KASA (FİZİKSEL):</td>
              <td className="py-1 text-right">{formatCurrency(report.cashReconciliation.countedCash)}</td>
            </tr>
            <tr className="border-t border-black font-bold">
              <td className="py-1">KASA FARKI:</td>
              <td className="py-1 text-right">
                {report.cashReconciliation.cashDifference === 0
                  ? "0,00 ₺ (EŞLEŞİYOR)"
                  : report.cashReconciliation.cashDifference > 0
                    ? `+${formatCurrency(report.cashReconciliation.cashDifference)} (FAZLA)`
                    : `−${formatCurrency(Math.abs(report.cashReconciliation.cashDifference))} (AÇIK)`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. KDV DAĞILIMI */}
      <div className="mb-4">
        <div className="font-bold border-b border-black pb-1 mb-1 text-xs">
          4. KDV & VERGİ DÖKÜMÜ
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-400 text-[10px]">
              <th className="py-0.5">Oran</th>
              <th className="py-0.5 text-right">Matrah</th>
              <th className="py-0.5 text-right">KDV</th>
              <th className="py-0.5 text-right">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {report.taxes.map((t) => (
              <tr key={t.taxRate} className="border-b border-gray-200 text-[11px]">
                <td className="py-0.5">%{t.taxRate}</td>
                <td className="py-0.5 text-right">{formatCurrency(t.matrah)}</td>
                <td className="py-0.5 text-right">{formatCurrency(t.taxAmount)}</td>
                <td className="py-0.5 text-right font-bold">{formatCurrency(t.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. İPTAL VE İKRAM ÖZETİ */}
      <div className="mb-4">
        <div className="font-bold border-b border-black pb-1 mb-1 text-xs">
          5. İPTAL / İKRAM / ZAYİ
        </div>
        <div className="flex justify-between text-xs py-0.5">
          <span>Toplam İptal Tutarı:</span>
          <span className="font-bold">{formatCurrency(report.financial.voidTotal)}</span>
        </div>
        <div className="flex justify-between text-xs py-0.5">
          <span>Toplam İkram Tutarı:</span>
          <span className="font-bold">{formatCurrency(report.financial.compTotal)}</span>
        </div>
      </div>

      {/* İMZA VE KAŞE ALANI */}
      <div className="mt-8 pt-6 border-t-2 border-dashed border-black flex justify-between text-center text-[10px]">
        <div>
          <span className="block font-bold">KASİYER / YETKİLİ</span>
          <span className="block mt-6">İmza: ........................</span>
        </div>
        <div>
          <span className="block font-bold">RESTORAN MÜDÜRÜ / İŞLETME SAHİBİ</span>
          <span className="block mt-6">İmza & Kaşe: ........................</span>
        </div>
      </div>

      <div className="text-center text-[9px] text-gray-500 mt-6">
        AdisyonEx Bulut Restoran POS Otomasyonu ile üretilmiştir.
      </div>
    </div>
  );
}
