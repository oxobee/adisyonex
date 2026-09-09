"use client";

import { useState } from "react";
import {
  UsersIcon,
  CaretRightIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  CheckIcon,
  XIcon,
} from "@/components/ui/icons";

interface PendingVoidItem {
  id: string;
  orderNumber: number;
  tableLabel?: string | null;
  amount: number;
  reason?: string | null;
  createdAt: string;
}

interface QuickMetricGridProps {
  tables: {
    occupied: number;
    total: number;
    percent: number;
  };
  activeOrders: {
    total: number;
    kitchen: number;
    service: number;
    statusBadge: string;
  };
  guests: {
    totalToday: number;
  };
  pendingVoids: PendingVoidItem[];
  autoApproveDefault?: boolean;
  currency?: string;
  onApproveVoid?: (id: string) => void;
  onRejectVoid?: (id: string) => void;
}

export function QuickMetricGrid({
  tables,
  activeOrders,
  guests,
  pendingVoids,
  autoApproveDefault = false,
  currency = "₺",
  onApproveVoid,
  onRejectVoid,
}: QuickMetricGridProps) {
  const [autoApprove, setAutoApprove] = useState(autoApproveDefault);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const pendingCount = pendingVoids.length;
  const firstPending = pendingVoids[0];

  const handleApprove = (id: string) => {
    setActionMessage("Fiş iptali onaylandı. Kasa işlemi kapatılabilir.");
    onApproveVoid?.(id);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleReject = (id: string) => {
    setActionMessage("Fiş iptali reddedildi. Sadece ödeme alınarak kapatılabilir.");
    onRejectVoid?.(id);
    setTimeout(() => setActionMessage(null), 3500);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Kart 1 – Masa Durumu (Mevcut ve Dolu Masa Sayısı) */}
        <div className="relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              MASA DURUMU
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          <div className="mt-2.5">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {tables.occupied} / {tables.total}
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600">
              %{tables.percent} Doluluk
            </div>
          </div>

          {/* Yatay Progress Bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(tables.percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Kart 2 – Aktif Sipariş (Mutfak & Servis) */}
        <div className="relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              AKTİF SİPARİŞ
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200/60">
              {activeOrders.statusBadge}
            </span>
          </div>

          <div className="mt-2.5">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {activeOrders.total}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              Mutfak: {activeOrders.kitchen} · Servis: {activeOrders.service}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
            <span>Açık Adisyonlar</span>
            <CaretRightIcon size={12} weight="bold" />
          </div>
        </div>

        {/* Kart 3 – Misafir Sayısı (Bugün Gelip Giden Toplam) */}
        <div className="relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              MİSAFİR SAYISI
            </span>
            <UsersIcon size={16} weight="duotone" className="text-indigo-500" />
          </div>

          <div className="mt-2.5">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {guests.totalToday}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              Bugün gelip giden misafir
            </div>
          </div>

          <div className="mt-3 text-[10px] font-semibold text-slate-400">
            Masa kişi sayıları toplamı
          </div>
        </div>

        {/* Kart 4 – Bekleyen İşlem: Fiş İptalleri & Patron Onayı */}
        <div className="relative flex flex-col justify-between rounded-[20px] border border-rose-200/80 bg-rose-50/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500">
              BEKLEYEN İŞLEM
            </span>
            {pendingCount > 0 ? (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </div>

          <div className="mt-2.5">
            <div className="text-2xl font-black tracking-tight text-rose-600">
              {pendingCount} Onay
            </div>
            <div className="mt-1 text-xs font-medium text-slate-700 truncate">
              {firstPending
                ? `${firstPending.tableLabel ? `${firstPending.tableLabel} · ` : ""}Fiş İptal Talebi`
                : "Bekleyen iptal yok"}
            </div>
          </div>

          {/* Aksiyon butonu & Otomatik onay seçeneği */}
          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full rounded-full bg-rose-100/90 py-1 text-center text-[11px] font-bold text-rose-700 transition hover:bg-rose-200/80 active:scale-95 border border-rose-200"
            >
              {pendingCount > 0 ? "İncele ve Onayla" : "İptal Geçmişi"}
            </button>

            {/* Otomatik Onay Switch */}
            <div className="flex items-center justify-between pt-1 border-t border-rose-100/80">
              <span className="text-[10px] font-semibold text-slate-500">
                Oto-Onay
              </span>
              <button
                type="button"
                onClick={() => setAutoApprove(!autoApprove)}
                className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 focus:outline-none"
              >
                {autoApprove ? (
                  <ToggleRightIcon size={18} weight="fill" className="text-indigo-600" />
                ) : (
                  <ToggleLeftIcon size={18} className="text-slate-400" />
                )}
                <span>{autoApprove ? "Açık" : "Kapalı"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aksiyon Bildirimi */}
      {actionMessage && (
        <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/90 p-3 text-center text-xs font-bold text-indigo-800 shadow-sm animate-fade-in">
          {actionMessage}
        </div>
      )}

      {/* Fiş İptal Onay Modalı */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Fiş İptal Onay Ekranı
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kasada hesap sadece ödeme ile veya patron onayıyla kapatılabilir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Otomatik Onay Toggle */}
            <div className="my-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Otomatik Onay
                </div>
                <div className="text-[10px] text-slate-500">
                  Açıkken iptal talepleri anında onaylanır.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoApprove(!autoApprove)}
                className="text-indigo-600"
              >
                {autoApprove ? (
                  <ToggleRightIcon size={24} weight="fill" className="text-indigo-600" />
                ) : (
                  <ToggleLeftIcon size={24} className="text-slate-400" />
                )}
              </button>
            </div>

            {/* Bekleyen İptal Listesi */}
            <div className="max-h-60 overflow-y-auto space-y-2 my-3">
              {pendingVoids.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Bekleyen fiş iptal talebi bulunmuyor.
                </div>
              ) : (
                pendingVoids.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Sipariş #{item.orderNumber}
                      </span>
                      <span className="font-black text-rose-600">
                        {currency}{item.amount.toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">
                      {item.tableLabel ? `Masa: ${item.tableLabel} · ` : ""}
                      {item.reason || "Müşteri vazgeçti / Kuver iptal"}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleApprove(item.id);
                          setModalOpen(false);
                        }}
                        className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-center text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                      >
                        Onayla (İptal Et)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleReject(item.id);
                          setModalOpen(false);
                        }}
                        className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-center text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        Reddet (Ödeme İste)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
