"use client";

import {
  ArmchairIcon,
  ReceiptIcon,
  UsersIcon,
  WarningIcon,
  CaretRightIcon,
} from "@/components/ui/icons";

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
    count: number;
    growthFromLastWeek: number;
  };
  pendingAction: {
    count: number;
    title: string;
    actionText: string;
  };
  onReviewPending?: () => void;
}

export function QuickMetricGrid({
  tables,
  activeOrders,
  guests,
  pendingAction,
  onReviewPending,
}: QuickMetricGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* Kart 1 – Masa Durumu */}
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

      {/* Kart 2 – Aktif Sipariş */}
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

        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
          <span>Detayları Gör</span>
          <CaretRightIcon size={12} weight="bold" />
        </div>
      </div>

      {/* Kart 3 – Misafir Sayısı */}
      <div className="relative flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            MİSAFİR SAYISI
          </span>
          <UsersIcon size={16} weight="duotone" className="text-indigo-500" />
        </div>

        <div className="mt-2.5">
          <div className="text-2xl font-black tracking-tight text-slate-900">
            {guests.count}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">
            Bugün ağırlanan
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
          <span>↗</span>
          <span>+{guests.growthFromLastWeek} geçen hafta</span>
        </div>
      </div>

      {/* Kart 4 – Bekleyen İşlem */}
      <div className="relative flex flex-col justify-between rounded-[20px] border border-rose-200/80 bg-rose-50/20 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500">
            BEKLEYEN İŞLEM
          </span>
          <span className="h-2 w-2 rounded-full bg-rose-500" />
        </div>

        <div className="mt-2.5">
          <div className="text-2xl font-black tracking-tight text-rose-600">
            {pendingAction.count} Onay
          </div>
          <div className="mt-1 text-xs font-medium text-slate-700 truncate">
            {pendingAction.title}
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={onReviewPending}
            className="w-full rounded-full bg-rose-100/90 py-1 text-center text-[11px] font-bold text-rose-700 transition hover:bg-rose-200/80 active:scale-95 border border-rose-200"
          >
            {pendingAction.actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
