"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  LockIcon,
  ShieldAlertIcon,
  UtensilsIcon,
} from "lucide-react";

import { closeZReportAction } from "@/actions/z-report.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ZReportDTO } from "@/types/z-report";

export function ZReportCloseModal({
  open,
  onOpenChange,
  report,
  countedCash,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly report: ZReportDTO;
  readonly countedCash: number;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const hasOpenOrders = report.kpis.openOrdersCount > 0;
  const cashDiff = countedCash - report.cashReconciliation.expectedCash;
  const hasCashDiff = Math.abs(cashDiff) >= 0.01;

  const handleCloseDay = async () => {
    if (!confirmed) {
      toast.error("Lütfen kapanış onay kutusunu işaretleyin.");
      return;
    }

    setIsPending(true);
    try {
      const res = await closeZReportAction({
        countedCash,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Kapanış işlemi sırasında bir hata oluştu.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
              <LockIcon className="size-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">
              Resmi Gün Sonu Kapanışı
            </span>
          </div>
          <DialogTitle className="text-xl font-black text-gray-900">
            Gün Sonu Kontrolü & Z Raporu Onayı
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Gün sonu kapatıldığında o anki tüm finansal sonuçlar dondurulur ve değiştirilemez bir Z Raporu snapshot kaydı üretilir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 my-2">
          {/* Kontrol Listesi */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2Icon className="size-4" />
              <span>Tamamlanan siparişler kontrol edildi ({report.kpis.orderCount} adet)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2Icon className="size-4" />
              <span>Tahsilatlar ve ödeme kırılımları hesaplandı ({formatCurrency(report.kpis.totalCollections)})</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2Icon className="size-4" />
              <span>Kasa hareketleri ve beklenen nakit hesaplandı</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2Icon className="size-4" />
              <span>İptal, ikram ve vergi matrahları işlendi</span>
            </div>
          </div>

          {/* KRİTİK UYARI 1: AÇIK ADİSYON VARSA */}
          {hasOpenOrders && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-in fade-in">
              <UtensilsIcon className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="block font-bold">
                  ⚠️ {report.kpis.openOrdersCount} Açık Adisyon Bulunuyor ({formatCurrency(report.kpis.openOrdersTotal)})
                </span>
                <span className="block text-[11px] opacity-80 mt-0.5">
                  Masalarda açık siparişler varken gün sonu almak açık siparişlerin bu Z raporuna dahil olmamasına sebep olur. Lütfen önce masaları kapatın veya yönetici onayıyla devam edin.
                </span>
              </div>
            </div>
          )}

          {/* KRİTİK UYARI 2: KASA FARKI VARSA */}
          {hasCashDiff && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs animate-in fade-in">
              <AlertTriangleIcon className="size-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="block font-bold">
                  ⚠️ Kasa Farkı Bulunuyor: {cashDiff > 0 ? `+${formatCurrency(cashDiff)} Fazla` : `−${formatCurrency(Math.abs(cashDiff))} Açık`}
                </span>
                <span className="block text-[11px] opacity-80 mt-0.5">
                  Beklenen Kasa: {formatCurrency(report.cashReconciliation.expectedCash)} · Sayılan Kasa: {formatCurrency(countedCash)}. Kasa farkı Z Raporu fişine işlenecektir.
                </span>
              </div>
            </div>
          )}

          {/* Kapanış Notu */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="closeNotes" className="text-xs font-semibold text-gray-700">
              Kapanış Notu / Açıklama (Opsiyonel)
            </label>
            <textarea
              id="closeNotes"
              rows={2}
              placeholder="Örn: 23:50 vardiya değişimi ile gün sonu kapatıldı."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
            />
          </div>

          {/* Kesin Onay Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-100/80 border border-gray-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs font-bold text-gray-800 leading-snug">
              Gün sonu kapatıldıktan sonra bu rapor değiştirilemez ve bugüne ait yeni Z raporu üretilemez. Devam etmek istiyorum.
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={isPending || !confirmed}
            onClick={handleCloseDay}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <span>Z Raporu Oluşturuluyor...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <LockIcon className="size-3.5" />
                <span>Günü Kapat & Z Raporunu Al</span>
              </span>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
