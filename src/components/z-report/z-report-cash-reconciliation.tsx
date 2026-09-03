"use client";

import { useState } from "react";
import {
  AlertTriangleIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlusIcon,
  ScaleIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { deleteCashMovementAction } from "@/actions/z-report.actions";
import { AddCashMovementDialog } from "@/components/z-report/add-cash-movement-dialog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CashMovementDTO, CashReconciliationDTO } from "@/types/z-report";

export function ZReportCashReconciliationCard({
  reconciliation,
  cashMovements,
  isClosed,
  onCountedCashChange,
}: {
  readonly reconciliation: CashReconciliationDTO;
  readonly cashMovements: readonly CashMovementDTO[];
  readonly isClosed: boolean;
  readonly onCountedCashChange?: (counted: number) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localCounted, setLocalCounted] = useState<string>(
    reconciliation.countedCash > 0 ? String(reconciliation.countedCash) : "",
  );

  const countedNum = parseFloat(localCounted.replace(",", ".")) || 0;
  const currentDiff = countedNum > 0 ? countedNum - reconciliation.expectedCash : 0;
  const isMatch = Math.abs(currentDiff) < 0.01;
  const isSurplus = currentDiff > 0.01;
  const isDeficit = currentDiff < -0.01;

  const handleCountedBlur = () => {
    if (onCountedCashChange) {
      onCountedCashChange(countedNum);
    }
  };

  const handleDelete = async (id: string) => {
    if (isClosed) return;
    if (!confirm("Bu kasa hareketini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await deleteCashMovementAction(id);
      if (res.success) toast.success("Kasa hareketi silindi.");
      else toast.error(res.message);
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ÜST BÖLÜM: KASA MUTABAKAT DENKLEMİ */}
      <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ScaleIcon className="size-5 text-emerald-600" />
              <span>Kasa Mutabakatı & Fiziksel Nakit Sayımı</span>
            </h3>
            <p className="text-xs text-gray-500">
              Günlük nakit akışı formülü: Açılış + Satışlar + Girişler − Çıkışlar = Beklenen
            </p>
          </div>

          {!isClosed && (
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <PlusIcon className="size-4" />
              <span>Kasa Hareketi Ekle</span>
            </button>
          )}
        </div>

        {/* Formül Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 text-center">
          {/* 1. Açılış Kasası */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50/80 border border-gray-200/80">
            <span className="text-[11px] font-semibold text-gray-500">Açılış Kasası</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 tabular-nums my-1">
              {formatCurrency(reconciliation.openingCash)}
            </span>
            <span className="text-[10px] text-gray-400">Sabah Devri</span>
          </div>

          {/* 2. Nakit Satışlar */}
          <div className="flex flex-col p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700">(+) Nakit Satışlar</span>
            <span className="text-base sm:text-lg font-bold text-emerald-800 tabular-nums my-1">
              +{formatCurrency(reconciliation.cashSales)}
            </span>
            <span className="text-[10px] text-emerald-600">Adisyon Nakit</span>
          </div>

          {/* 3. Kasa Girişleri */}
          <div className="flex flex-col p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-700">(+) Kasa Girişleri</span>
            <span className="text-base sm:text-lg font-bold text-blue-800 tabular-nums my-1">
              +{formatCurrency(reconciliation.cashInTotal)}
            </span>
            <span className="text-[10px] text-blue-600">Ara Girişler</span>
          </div>

          {/* 4. Kasa Çıkışları */}
          <div className="flex flex-col p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-[11px] font-semibold text-rose-700">(−) Gider / Çıkışlar</span>
            <span className="text-base sm:text-lg font-bold text-rose-800 tabular-nums my-1">
              −{formatCurrency(reconciliation.cashOutTotal)}
            </span>
            <span className="text-[10px] text-rose-600">Masraflar & Avans</span>
          </div>

          {/* 5. BEKLENEN KASA */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-900 text-white col-span-2 sm:col-span-1 shadow-xs">
            <span className="text-[11px] font-bold text-gray-300">(=) BEKLENEN KASA</span>
            <span className="text-base sm:text-lg font-black text-white tabular-nums my-1">
              {formatCurrency(reconciliation.expectedCash)}
            </span>
            <span className="text-[10px] text-gray-400">Kasada Olması Gereken</span>
          </div>
        </div>

        {/* FİZİKSEL SAYIM & KASA FARKI KUTUSU */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Sol: Fiziksel Sayım Girişi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <BanknoteIcon className="size-4 text-primary" />
              <span>Fiziksel Kasada Sayılan Nakit Tutar</span>
            </label>

            {isClosed ? (
              <div className="h-12 flex items-center px-4 rounded-xl bg-gray-100 border border-gray-300 font-bold text-lg tabular-nums text-gray-900">
                {formatCurrency(reconciliation.countedCash)}
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00 ₺"
                  value={localCounted}
                  onChange={(e) => setLocalCounted(e.target.value)}
                  onBlur={handleCountedBlur}
                  className="h-12 w-full rounded-xl border-2 border-primary/40 bg-white px-4 text-lg font-black text-gray-900 shadow-xs focus:border-primary focus:ring-3 focus:ring-primary/20 focus:outline-none transition-all tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  ₺ Sayım
                </span>
              </div>
            )}
            <span className="text-[11px] text-gray-500">
              {isClosed
                ? "Kapanış anında yetkili tarafından sayılan fiziksel nakit tutarı."
                : "Çekmecedeki nakit parayı sayıp buraya giriniz. Fark otomatik hesaplanacaktır."}
            </span>
          </div>

          {/* Sağ: Mutabakat Sonucu Rozeti */}
          <div
            className={cn(
              "flex flex-col justify-between p-4 rounded-xl border transition-all",
              countedNum === 0 && !isClosed
                ? "bg-gray-50 border-gray-200 text-gray-600"
                : isMatch
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : isSurplus
                    ? "bg-blue-50 border-blue-200 text-blue-900"
                    : "bg-rose-50 border-rose-200 text-rose-900 ring-1 ring-rose-400/30",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Mutabakat Sonucu (Kasa Farkı)
              </span>
              {isMatch ? (
                <CheckCircle2Icon className="size-5 text-emerald-600" />
              ) : isSurplus ? (
                <ArrowUpRightIcon className="size-5 text-blue-600" />
              ) : (
                <AlertTriangleIcon className="size-5 text-rose-600 animate-pulse" />
              )}
            </div>

            <div className="my-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums">
                {isMatch
                  ? "0,00 ₺"
                  : isSurplus
                    ? `+${formatCurrency(currentDiff)}`
                    : `−${formatCurrency(Math.abs(currentDiff))}`}
              </span>
              <span className="text-xs font-bold">
                {isMatch
                  ? "✓ Kasa Tam Eşleşiyor"
                  : isSurplus
                    ? "Kasa Fazlası Var"
                    : "Kasa Açığı Var"}
              </span>
            </div>

            <span className="text-[11px] opacity-80">
              {isMatch
                ? "Tebrikler, çekmecedeki nakit ile sistem kayıtları birebir uyuşuyor."
                : isSurplus
                  ? "Kasada beklenen miktardan daha fazla nakit tespit edildi."
                  : "Kasada beklenen miktardan daha az nakit var! Kapanış öncesi fiş ve hareketleri kontrol edin."}
            </span>
          </div>
        </div>
      </div>

      {/* ALT BÖLÜM: GÜNLÜK KASA HAREKETLERİ LİSTESİ */}
      <div className="flex flex-col p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Günlük Kasa Giriş & Çıkış Hareketleri</h4>
            <span className="text-xs text-gray-500">
              Bugün kaydedilen nakit masraflar, avanslar ve ara girişler
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {cashMovements.length} Hareket
          </span>
        </div>

        {cashMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <BanknoteIcon className="size-8 text-gray-300 mb-1" />
            <span>Bugün henüz bir kasa hareketi (giriş/çıkış) kaydedilmemiş.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold">
                  <th className="py-2.5 px-3">Saat</th>
                  <th className="py-2.5 px-3">Tür</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Açıklama</th>
                  <th className="py-2.5 px-3">İşlemi Yapan</th>
                  <th className="py-2.5 px-3 text-right">Tutar</th>
                  {!isClosed && <th className="py-2.5 px-3 text-center">İşlem</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cashMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 tabular-nums flex items-center gap-1">
                      <ClockIcon className="size-3 text-gray-400" />
                      <span>{m.createdAt}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          m.type === "IN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200",
                        )}
                      >
                        {m.type === "IN" ? "GİRİŞ (+)" : "ÇIKIŞ (−)"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{m.category}</td>
                    <td className="py-2.5 px-3 text-gray-600">{m.description || "—"}</td>
                    <td className="py-2.5 px-3 text-gray-500">{m.performedByName || "Kasiyer"}</td>
                    <td
                      className={cn(
                        "py-2.5 px-3 text-right font-bold tabular-nums",
                        m.type === "IN" ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      {m.type === "IN" ? "+" : "−"}
                      {formatCurrency(m.amount)}
                    </td>
                    {!isClosed && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      <AddCashMovementDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
