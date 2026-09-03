"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArchiveIcon,
  CalculatorIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileSpreadsheetIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  LayersIcon,
  LockIcon,
  PrinterIcon,
  RefreshCwIcon,
  ScaleIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react";

import { ZReportAuditsVoidsCard } from "@/components/z-report/z-report-audits-voids";
import { ZReportCashReconciliationCard } from "@/components/z-report/z-report-cash-reconciliation";
import { ZReportChannelsCategoriesCard } from "@/components/z-report/z-report-channels-categories";
import { ZReportCloseModal } from "@/components/z-report/z-report-close-modal";
import { ZReportFinancialSummaryCard } from "@/components/z-report/z-report-financial-summary";
import { ZReportHistoryTable } from "@/components/z-report/z-report-history-table";
import { ZReportKpiCards } from "@/components/z-report/z-report-kpi-cards";
import { ZReportPrintSheet } from "@/components/z-report/z-report-print";
import { ZReportStaffPerformanceCard } from "@/components/z-report/z-report-staff-performance";
import { ZReportTaxSummaryCard } from "@/components/z-report/z-report-tax-summary";
import { cn } from "@/lib/utils";
import type { ZReportDTO, ZReportHistoryItem } from "@/types/z-report";

type TabKey =
  | "overview"
  | "cash"
  | "sales"
  | "taxes"
  | "audits"
  | "staff"
  | "history";

export function ZReportView({
  report,
  history,
}: {
  readonly report: ZReportDTO;
  readonly history: readonly ZReportHistoryItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(report.date);
  const [countedCash, setCountedCash] = useState<number>(
    report.cashReconciliation.countedCash > 0
      ? report.cashReconciliation.countedCash
      : report.cashReconciliation.expectedCash,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isClosed = report.status === "CLOSED";

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    router.push(`/dashboard/z-report?date=${newDate}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 
        ========================================================================
        BASKIYA ÖZEL FİŞ ÇIKTISI (Yalnızca Yazıcıda / PDF Kaydında Görünür)
        ========================================================================
      */}
      <ZReportPrintSheet report={report} />

      {/* 
        ========================================================================
        ANA EKRAN CONTAINER'I (Print esnasında gizlenir)
        ========================================================================
      */}
      <div className="print:hidden flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1750px] mx-auto w-full bg-gray-50/50 min-h-screen">
        {/* 
          ======================================================================
          1. SAYFA BAŞLIĞI & AKSİYON BARI
          ======================================================================
        */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <FileSpreadsheetIcon className="size-5.5" />
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
                <span>Z Raporu / Gün Sonu</span>
              </h1>

              {/* DURUM ROZETİ */}
              {isClosed ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-black shadow-xs">
                  <LockIcon className="size-3.5 text-amber-400" />
                  <span>{report.zNumberFormatted} · Gün Kapandı</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>🟢 Açık Gün (Canlı Rapor)</span>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Günlük satışları, tahsilatları, kasa hareketlerini ve operasyon detaylarını kontrol edin.
            </p>

            {/* Tarih ve Kapanış Bilgi Bandı */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mt-1">
              <CalendarIcon className="size-3.5 text-gray-400" />
              <span>{report.dateFormatted}</span>
              <span className="text-gray-300">·</span>
              <ClockIcon className="size-3.5 text-gray-400" />
              <span>Açılış: {report.openedAt}</span>
              {isClosed && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>Kapanış: {report.closedAt ? new Date(report.closedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                  <span className="text-gray-300">·</span>
                  <span>Kapatan: {report.closedByName || "Yönetici"}</span>
                </>
              )}
            </div>
          </div>

          {/* SAĞ AKSİYON BUTONLARI */}
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
            {/* Tarih Seçici */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-800 shadow-2xs focus:bg-white focus:border-primary focus:outline-none transition-all cursor-pointer"
                title="Tarih Değiştir"
              />
            </div>

            {/* Yenile */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Verileri Yenile"
            >
              <RefreshCwIcon className={cn("size-4", isRefreshing && "animate-spin text-primary")} />
            </button>

            {/* Yazdır / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Resmi Z Raporu Fişini Yazdır veya PDF Kaydet"
            >
              <PrinterIcon className="size-4 text-gray-500" />
              <span>Yazdır / PDF</span>
            </button>

            {/* GÜN SONUNU KAPAT BUTONU (Yalnızca Gün Açıksa Görünür) */}
            {!isClosed ? (
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(true)}
                className="flex items-center gap-1.5 h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer select-none"
              >
                <LockIcon className="size-4" />
                <span>Gün Sonunu Kapat</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200 cursor-not-allowed">
                <CheckCircle2Icon className="size-4 text-emerald-600" />
                <span>Gün Kapatıldı</span>
              </div>
            )}
          </div>
        </header>

        {/* 
          ======================================================================
          2. ÜST KPI METRİK KARTLARI (Saniyeler İçinde Günü Özetler)
          ======================================================================
        */}
        <ZReportKpiCards kpis={report.kpis} />

        {/* 
          ======================================================================
          3. UNTITLED UI SEGMENTED TABS (KATEGORİZE EDİLMİŞ MERKEZİ BİLGİ MİMARİSİ)
          ======================================================================
        */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-200/70 border border-gray-300/60 overflow-x-auto no-scrollbar shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "overview"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <LayoutDashboardIcon className="size-4 text-primary" />
            <span>Genel Bakış & Özet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cash")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "cash"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <ScaleIcon className="size-4 text-emerald-600" />
            <span>Kasa Mutabakatı ({report.cashMovements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sales")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "sales"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <LayersIcon className="size-4 text-blue-600" />
            <span>Satışlar & Kanallar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("taxes")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "taxes"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <CalculatorIcon className="size-4 text-purple-600" />
            <span>KDV & Vergi Özeti ({report.taxes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audits")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "audits"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <ShieldAlertIcon className="size-4 text-rose-600" />
            <span>İptal, İkram & İndirimler ({report.audits.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "staff"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <UsersIcon className="size-4 text-amber-600" />
            <span>Personel Performansı ({report.staffPerformance.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ml-auto",
              activeTab === "history"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            <ArchiveIcon className="size-4 text-gray-700" />
            <span>Geçmiş Z Raporları ({history.length})</span>
          </button>
        </div>

        {/* 
          ======================================================================
          4. AKTİF TAB İÇERİKLERİ
          ======================================================================
        */}
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-150">
          {activeTab === "overview" && (
            <>
              {/* Finansal Akış & Ödeme Dağılımı */}
              <ZReportFinancialSummaryCard
                financial={report.financial}
                payments={report.payments}
              />

              {/* Kasa Mutabakatı Özeti */}
              <ZReportCashReconciliationCard
                reconciliation={report.cashReconciliation}
                cashMovements={report.cashMovements}
                isClosed={isClosed}
                onCountedCashChange={setCountedCash}
              />
            </>
          )}

          {activeTab === "cash" && (
            <ZReportCashReconciliationCard
              reconciliation={report.cashReconciliation}
              cashMovements={report.cashMovements}
              isClosed={isClosed}
              onCountedCashChange={setCountedCash}
            />
          )}

          {activeTab === "sales" && (
            <ZReportChannelsCategoriesCard
              channels={report.channels}
              categories={report.categories}
              topItems={report.topItems}
              hourlySales={report.hourlySales}
            />
          )}

          {activeTab === "taxes" && (
            <ZReportTaxSummaryCard taxes={report.taxes} />
          )}

          {activeTab === "audits" && (
            <ZReportAuditsVoidsCard
              audits={report.audits}
              discounts={report.discounts}
            />
          )}

          {activeTab === "staff" && (
            <ZReportStaffPerformanceCard
              staffPerformance={report.staffPerformance}
            />
          )}

          {activeTab === "history" && (
            <ZReportHistoryTable history={history} />
          )}
        </div>
      </div>

      {/* 
        ========================================================================
        GÜN SONU KAPANIŞ KONTROL & ONAY MODALI
        ========================================================================
      */}
      <ZReportCloseModal
        open={isCloseModalOpen}
        onOpenChange={setIsCloseModalOpen}
        report={report}
        countedCash={countedCash}
      />
    </>
  );
}
