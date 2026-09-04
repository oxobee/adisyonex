"use client";

import { useEffect, useMemo, useState, memo } from "react";
import {
  BellRingIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  PackageCheckIcon,
  ReceiptIcon,
  SparklesIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

export type TableStatus = "EMPTY" | "OCCUPIED" | "RESERVED";

export interface TableCardProps {
  table: TableDTO;
  status: TableStatus;
  total: number;
  orders: readonly OrderDTO[];
  firstOrderAt: string | null;
  hasBillRequest: boolean;
  hasWaiterCall?: boolean;
  onDismissWaiterCall?: () => void;
  isSelected?: boolean;
  onClick: () => void;
  onDeliver?: () => void;
}

/** Formats elapsed time as HH:MM:SS */
const formatElapsed = (startedAt: string): string => {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

function TableCardComponent({
  table,
  status,
  total,
  orders,
  firstOrderAt,
  hasBillRequest,
  hasWaiterCall,
  onDismissWaiterCall,
  isSelected,
  onClick,
  onDeliver,
}: TableCardProps) {
  const [elapsed, setElapsed] = useState<string>(
    firstOrderAt ? formatElapsed(firstOrderAt) : "",
  );

  // Live timer interval if occupied
  useEffect(() => {
    if (!firstOrderAt || status !== "OCCUPIED") return;

    setElapsed(formatElapsed(firstOrderAt));
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setElapsed(formatElapsed(firstOrderAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [firstOrderAt, status]);

  // Elapsed minutes calculation for duration indicator
  const elapsedMinutes = useMemo(() => {
    if (!firstOrderAt || status !== "OCCUPIED") return 0;
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(firstOrderAt).getTime()) / 1000));
    return Math.floor(diffSec / 60);
  }, [firstOrderAt, status, elapsed]);

  // Duration tier indicator on the left
  const durationTier = useMemo(() => {
    if (status !== "OCCUPIED" || !firstOrderAt) {
      if (status === "RESERVED") {
        return {
          tier: "RESERVED",
          barColor: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]",
          dotColor: "bg-sky-400",
          pillBg: "bg-sky-950/60 text-sky-200 border-sky-400/30",
          badgeText: "Rezerve",
          durationDesc: "Rezerve Edildi",
        };
      }
      return {
        tier: "EMPTY",
        barColor: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]",
        dotColor: "bg-emerald-300",
        pillBg: "bg-emerald-950/40 text-emerald-200 border-emerald-400/20",
        badgeText: "Boş Masa",
        durationDesc: "Müsait",
      };
    }

    if (elapsedMinutes < 20) {
      return {
        tier: "FRESH",
        barColor: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]",
        dotColor: "bg-emerald-400",
        pillBg: "bg-emerald-950/60 text-emerald-200 border-emerald-400/30",
        badgeText: "< 20 dk",
        durationDesc: "Yeni Masa (< 20 dk)",
      };
    } else if (elapsedMinutes < 45) {
      return {
        tier: "NORMAL",
        barColor: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]",
        dotColor: "bg-amber-400",
        pillBg: "bg-amber-950/60 text-amber-200 border-amber-400/30",
        badgeText: "20 - 45 dk",
        durationDesc: "Orta Süre (20-45 dk)",
      };
    } else if (elapsedMinutes < 75) {
      return {
        tier: "LONG",
        barColor: "bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.8)]",
        dotColor: "bg-orange-400",
        pillBg: "bg-orange-950/60 text-orange-200 border-orange-400/30",
        badgeText: "45 - 75 dk",
        durationDesc: "Uzun Süre (45-75 dk)",
      };
    } else {
      return {
        tier: "OVERDUE",
        barColor: "bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.9)] animate-pulse",
        dotColor: "bg-rose-400 animate-pulse",
        pillBg: "bg-rose-950/80 text-rose-200 border-rose-400/40 animate-pulse",
        badgeText: "75+ dk",
        durationDesc: "Çok Uzun Süre (> 75 dk)",
      };
    }
  }, [status, firstOrderAt, elapsedMinutes]);

  const activeLines = useMemo(
    () => orders.flatMap((o) => o.lines.filter((l) => l.state !== "VOID")),
    [orders],
  );

  const itemCount = activeLines.reduce((s, l) => s + l.quantity, 0);

  // Unserved lines calculation:
  const unservedLines = useMemo(
    () => activeLines.filter((l) => l.state !== "SERVED"),
    [activeLines],
  );

  const unservedCooked = useMemo(
    () =>
      unservedLines.filter(
        (l) => l.itemType !== "PACKAGED_GOODS" && l.itemType !== "OTHER",
      ),
    [unservedLines],
  );

  const unservedPackaged = useMemo(
    () =>
      unservedLines.filter(
        (l) => l.itemType === "PACKAGED_GOODS" || l.itemType === "OTHER",
      ),
    [unservedLines],
  );

  const hasCooking = useMemo(
    () =>
      unservedCooked.some(
        (l) => l.state === "FIRED" || l.state === "UNSENT" || l.state === "PREPARING",
      ),
    [unservedCooked],
  );

  const hasCookedReady = useMemo(
    () =>
      unservedCooked.length > 0 &&
      unservedCooked.every((l) => l.state === "PREPARED"),
    [unservedCooked],
  );

  // Delivery & Button Logic:
  const canDeliverPackaged = unservedPackaged.length > 0;
  const canDeliverCooked = hasCookedReady;
  const isDeliverable = canDeliverPackaged || canDeliverCooked;
  const isOnlyPreparing = !canDeliverPackaged && hasCooking;

  const hasNewOrderAlert = unservedLines.length > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl pl-5 sm:pl-5.5 pr-3.5 sm:pr-4 py-3 sm:py-3.5 transition-all duration-200 select-none cursor-pointer text-white shadow-md hover:-translate-y-1 hover:shadow-xl active:scale-98 btn-press",
        // Color coding & Rich Gradients:
        status === "EMPTY" &&
          "bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/30 shadow-emerald-950/20",
        status === "OCCUPIED" &&
          "bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 hover:from-rose-500 hover:to-pink-700 border border-rose-400/30 shadow-rose-950/25",
        status === "RESERVED" &&
          "bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 hover:from-sky-500 hover:to-indigo-700 border border-sky-400/30 shadow-sky-950/20",
        // New Order Animated Dashed Border:
        hasNewOrderAlert &&
          "border-2 border-dashed border-amber-300 ring-4 ring-amber-400 ring-offset-2 ring-offset-background animate-pulse shadow-xl shadow-amber-500/40",
        // Waiter Call Alarm Animation:
        hasWaiterCall &&
          "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-pulse shadow-2xl shadow-red-500/50",
        // Bill Request Alarm Animation:
        hasBillRequest &&
          "ring-4 ring-amber-400 ring-offset-2 ring-offset-background animate-pulse shadow-xl shadow-amber-500/40",
        // Active Selected Table State:
        isSelected &&
          "ring-4 ring-primary ring-offset-2 ring-offset-background shadow-2xl scale-[1.03] z-20",
      )}
    >
      {/* 
        SOLDA RENK İBARESİ:
        Masanın ne kadar uzun süredir açık/dolu olduğunu gösteren sol dikey renk şeridi
      */}
      <div
        className={cn(
          "absolute left-0 inset-y-0 w-2.5 sm:w-3 rounded-l-2xl transition-colors duration-300",
          durationTier.barColor,
        )}
        title={`Oturma Süresi: ${durationTier.durationDesc}`}
      />

      {/* ÜST BAŞLIK: Masa Adı + Salon + Kapasite + Süre/Durum Rozeti */}
      <div className="flex items-start justify-between gap-1.5 min-w-0">
        <div className="flex flex-col min-w-0 items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate font-black text-sm sm:text-base tracking-tight drop-shadow-xs">
              {table.label}
            </span>
            {table.section && (
              <span className="rounded-md bg-black/25 px-1.5 py-0.2 text-[10px] font-extrabold text-white/90 truncate max-w-[80px]">
                {table.section}
              </span>
            )}
          </div>

          {/* Sol renk göstergesiyle eşleşen süre/durum etiketi */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn("size-2 rounded-full shrink-0", durationTier.dotColor)} />
            <span className="text-[10px] font-bold text-white/90 truncate">
              {durationTier.badgeText}
            </span>
          </div>
        </div>

        {/* Sağ Üst: Kapasite ve Canlı Sayaç */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {status === "OCCUPIED" && firstOrderAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-xs px-2 py-0.5 text-[11px] font-black tabular-nums tracking-tight border border-white/10 shadow-xs">
              <ClockIcon className="size-3 text-white/90" />
              <span>{elapsed}</span>
            </span>
          ) : status === "RESERVED" ? (
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Rezerve
            </span>
          ) : (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Boş
            </span>
          )}

          {table.seats ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-white/80">
              <UsersIcon className="size-3 opacity-80" />
              <span>{table.seats} Kişi</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* ORTA BÖLÜM: Detaylı Bilgiler ve Dinamik Durum Rozetleri */}
      <div className="my-2 flex flex-col gap-1.5">
        {/* Sipariş & Ürün Bilgisi (Dolu Masalar İçin) */}
        {status === "OCCUPIED" && (
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 bg-black/15 rounded-lg px-2 py-1">
            <span className="flex items-center gap-1">
              <UtensilsCrossedIcon className="size-3 opacity-80" />
              <span>{orders.length} Adisyon</span>
            </span>
            <span className="text-white/75">·</span>
            <span className="font-extrabold">{itemCount} Ürün</span>
          </div>
        )}

        {/* Boş Masa Bilgisi */}
        {status === "EMPTY" && (
          <div className="text-[11px] font-medium text-white/85 py-0.5 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            <span>Sipariş Alınabilir · Temiz</span>
          </div>
        )}

        {/* Canlı Alarm ve Bildirim Rozetleri */}
        {hasWaiterCall ? (
          <div className="inline-flex items-center justify-between gap-1 rounded-full bg-white text-red-600 px-2.5 py-0.5 text-[10px] font-black animate-bounce shadow-md">
            <div className="flex items-center gap-1">
              <BellRingIcon className="size-3" />
              <span>GARSON ÇAĞRILDI</span>
            </div>
            {onDismissWaiterCall && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissWaiterCall();
                }}
                className="size-4 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center ml-1 cursor-pointer transition-colors"
                title="Çağrıyı Kapat"
              >
                <XIcon className="size-2.5 text-white stroke-[3]" />
              </button>
            )}
          </div>
        ) : hasBillRequest ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-2.5 py-0.5 text-[10px] font-black animate-bounce shadow-md">
            <BellRingIcon className="size-3" />
            <span>HESAP İSTENDİ</span>
          </span>
        ) : isDeliverable ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300 text-emerald-950 px-2 py-0.5 text-[10px] font-black shadow-md animate-pulse">
            <SparklesIcon className="size-3" />
            <span>{canDeliverPackaged && hasCooking ? "PAKETLİ HAZIR" : "TESLİMATA HAZIR"}</span>
          </span>
        ) : isOnlyPreparing ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-400 text-orange-950 px-2 py-0.5 text-[10px] font-black shadow-md animate-pulse">
            <ChefHatIcon className="size-3" />
            <span>HAZIRLANIYOR</span>
          </span>
        ) : null}
      </div>

      {/* ALT BÖLÜM: Masa Tutarı & Aksiyon Butonu */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/20">
        <span className="text-[11px] font-bold text-white/80">
          {status === "OCCUPIED" ? "Masa Tutarı" : "Durum"}
        </span>

        {isDeliverable && onDeliver ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeliver();
            }}
            className="rounded-xl bg-emerald-950 text-white hover:bg-black px-2.5 py-1 text-xs font-black shadow-md transition-all active:scale-90 cursor-pointer flex items-center gap-1"
          >
            <CheckCircle2Icon className="size-3.5 text-emerald-400" />
            <span>Teslim Et</span>
          </button>
        ) : isOnlyPreparing ? (
          <span className="inline-flex items-center gap-1 rounded-xl bg-orange-950/80 text-orange-200 border border-orange-400/40 px-2 py-0.5 text-[11px] font-extrabold shadow-xs">
            <ChefHatIcon className="size-3 text-orange-400 animate-spin" />
            <span>Mutfakta</span>
          </span>
        ) : (
          <span className="font-black text-sm sm:text-base tracking-tight tabular-nums drop-shadow-xs">
            {status === "OCCUPIED" ? `${total.toFixed(0)} ₺` : "Müsait"}
          </span>
        )}
      </div>
    </div>
  );
}

export const TableCard = memo(TableCardComponent);
