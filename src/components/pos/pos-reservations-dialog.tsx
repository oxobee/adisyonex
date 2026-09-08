"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  ArmchairIcon,
  CheckCircle2Icon,
  PlusIcon,
  ShoppingBagIcon,
  XIcon,
  RotateCcwIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listReservationsAction,
  seatReservationAction,
  cancelReservationAction,
} from "@/actions/reservation.actions";
import type { ReservationDTO } from "@/services/reservation.service";
import { cn } from "@/lib/utils";

interface PosReservationsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onOpenTableWithReservation?: (tableId: string, orderId?: string) => void;
  readonly onNewReservationClick: () => void;
}

export function PosReservationsDialog({
  open,
  onClose,
  onOpenTableWithReservation,
  onNewReservationClick,
}: PosReservationsDialogProps) {
  const [reservations, setReservations] = useState<readonly ReservationDTO[]>([]);
  const [filterTab, setFilterTab] = useState<"TODAY" | "UPCOMING" | "SEATED" | "ALL">("TODAY");
  const [isPending, startTransition] = useTransition();

  const loadReservations = () => {
    startTransition(async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await listReservationsAction(
        filterTab === "TODAY" ? { date: todayStr } : undefined
      );
      if (res.success && res.data) {
        setReservations(res.data);
      }
    });
  };

  useEffect(() => {
    if (open) {
      loadReservations();
    }
  }, [open, filterTab]);

  const handleSeat = async (res: ReservationDTO) => {
    startTransition(async () => {
      const result = await seatReservationAction(res.id);
      if (!result.success || !result.data) {
        toast.error(result.error || "Masa açılamadı.");
        return;
      }
      toast.success(
        `✓ ${res.customerName} için ${res.tableLabel ? `${res.tableLabel} masası` : "masa"} açıldı ve adisyona aktarıldı!`
      );
      loadReservations();
      if (res.tableId && onOpenTableWithReservation) {
        onOpenTableWithReservation(res.tableId, result.data.orderId);
      }
      onClose();
    });
  };

  const handleCancel = async (reservationId: string) => {
    startTransition(async () => {
      const result = await cancelReservationAction(reservationId, "Kasa iptali");
      if (!result.success) {
        toast.error(result.error || "İptal edilemedi.");
        return;
      }
      toast.success("Rezervasyon iptal edildi.");
      loadReservations();
    });
  };

  const filteredList = reservations.filter((r) => {
    if (filterTab === "TODAY") {
      const todayStr = new Date().toISOString().slice(0, 10);
      return r.reservationTime.startsWith(todayStr);
    }
    if (filterTab === "UPCOMING") {
      return r.status === "CONFIRMED" || r.status === "PENDING";
    }
    if (filterTab === "SEATED") {
      return r.status === "SEATED";
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                <CalendarDaysIcon className="size-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-slate-900">
                  Masa Rezervasyonları
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Kayıtlı masa rezervasyonları, yaklaşan misafirler ve hızlı masa açma
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={loadReservations}
                disabled={isPending}
                title="Yenile"
              >
                <RefreshCwIcon className={cn("size-4", isPending && "animate-spin")} />
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  onNewReservationClick();
                }}
                className="gap-1.5 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                <PlusIcon className="size-3.5" />
                <span>Yeni Rezervasyon</span>
              </Button>
            </div>
          </div>

          {/* Sekmeler */}
          <div className="flex items-center gap-1.5 pt-3">
            {[
              { key: "TODAY", label: "Bugün" },
              { key: "UPCOMING", label: "Bekleyenler" },
              { key: "SEATED", label: "Masaya Oturanlar" },
              { key: "ALL", label: "Tümü" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTab(tab.key as typeof filterTab)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  filterTab === tab.key
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Liste Alanı */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CalendarDaysIcon className="size-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Kayıtlı rezervasyon bulunmuyor</p>
              <p className="text-xs text-slate-400">
                POS ekranından veya yukarıdaki &quot;Yeni Rezervasyon&quot; butonuna basarak yeni rezervasyon oluşturabilirsiniz.
              </p>
            </div>
          ) : (
            filteredList.map((res) => {
              const resDate = new Date(res.reservationTime);
              const timeStr = resDate.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const dateStr = resDate.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
              });
              const isSeated = res.status === "SEATED";
              const isCancelled = res.status === "CANCELLED" || res.status === "NO_SHOW";

              return (
                <div
                  key={res.id}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5",
                    isSeated
                      ? "bg-emerald-50/40 border-emerald-200/80"
                      : isCancelled
                        ? "bg-slate-50 border-slate-200 opacity-60"
                        : "bg-white border-slate-200/90 shadow-2xs hover:border-amber-300"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">
                          {res.customerName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-extrabold px-1.5 py-0.5",
                            res.status === "CONFIRMED" && "bg-amber-100 text-amber-800 border-amber-300",
                            res.status === "SEATED" && "bg-emerald-100 text-emerald-800 border-emerald-300",
                            res.status === "CANCELLED" && "bg-rose-100 text-rose-800 border-rose-300",
                            res.status === "NO_SHOW" && "bg-slate-200 text-slate-700 border-slate-300"
                          )}
                        >
                          {res.status === "CONFIRMED"
                            ? "ONAYLI"
                            : res.status === "SEATED"
                              ? "MASADA"
                              : res.status === "CANCELLED"
                                ? "İPTAL"
                                : res.status === "NO_SHOW"
                                  ? "GELMEDİ"
                                  : "BEKLİYOR"}
                        </Badge>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded">
                          {res.source === "PHONE" ? "📞 Telefon" : res.source === "ONLINE" ? "🌐 Online" : "🖥️ POS"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1 text-slate-700 font-bold">
                          <ClockIcon className="size-3.5 text-amber-600" />
                          {dateStr} - {timeStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon className="size-3.5 text-slate-400" />
                          {res.guestCount} Kişi
                        </span>
                        <span className="flex items-center gap-1 text-blue-700 font-bold">
                          <ArmchairIcon className="size-3.5 text-blue-600" />
                          {res.tableLabel ? `Masa ${res.tableLabel}` : "Masa atanmadı"}
                        </span>
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="size-3.5 text-slate-400" />
                          {res.customerPhone}
                        </span>
                      </div>
                    </div>

                    {/* Aksiyonlar */}
                    {!isSeated && !isCancelled && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSeat(res)}
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1 shadow-xs"
                        >
                          <CheckCircle2Icon className="size-3.5" />
                          <span>Masayı Aç & Oturt</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCancel(res.id)}
                          disabled={isPending}
                          title="İptal Et"
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <XIcon className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Özel Not & Ön Sipariş Ürünleri */}
                  {(res.notes || (res.preOrderItems && res.preOrderItems.length > 0)) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs">
                      {res.notes && (
                        <p className="text-slate-600 italic">
                          <span className="font-bold text-slate-700">Not:</span> {res.notes}
                        </p>
                      )}
                      {res.preOrderItems && res.preOrderItems.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-xl">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <ShoppingBagIcon className="size-3 text-primary" /> Ön Sipariş ({res.preOrderItems.length} Kalem):
                          </span>
                          {res.preOrderItems.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-800"
                            >
                              <span>{it.quantity}x {it.name}</span>
                              <span className="text-slate-400">({it.price * it.quantity}₺)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
