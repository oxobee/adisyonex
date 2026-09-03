"use client";

import { useEffect, useMemo, useState, memo } from "react";
import {
  BellRingIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  Loader2Icon,
  PackageCheckIcon,
  ReceiptIcon,
  SparklesIcon,
  UsersIcon,
  UtensilsCrossedIcon,
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
  // 1. Packaged items ready to deliver:
  const canDeliverPackaged = unservedPackaged.length > 0;
  // 2. Cooked food ready to deliver:
  const canDeliverCooked = hasCookedReady;
  // 3. Overall can click "Teslim Et":
  const isDeliverable = canDeliverPackaged || canDeliverCooked;
  // 4. Only cooking food waiting in kitchen:
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
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-3.5 transition-all duration-200 select-none cursor-pointer text-white shadow-md hover:-translate-y-1 hover:shadow-xl active:scale-95 btn-press",
        // Color coding:
        status === "EMPTY" &&
          "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/15",
        status === "OCCUPIED" &&
          "bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/20",
        status === "RESERVED" &&
          "bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/15",
        // New Order Animated Dashed Border (Active until all items delivered):
        hasNewOrderAlert &&
          "border-2 border-dashed border-amber-300 ring-4 ring-amber-400 ring-offset-2 ring-offset-background animate-pulse shadow-xl shadow-amber-500/40",
        // Waiter Call Alarm Animation:
        hasWaiterCall &&
          "ring-4 ring-red-500 ring-offset-2 ring-offset-background animate-pulse shadow-2xl shadow-red-500/50",
        // Bill Request Alarm Animation:
        hasBillRequest &&
          "ring-4 ring-amber-400 ring-offset-2 ring-offset-background animate-pulse shadow-xl shadow-amber-500/40",
        // Spotlight Selected State:
        isSelected &&
          "ring-4 ring-white/90 shadow-2xl scale-102",
      )}
    >
      {/* Top Header: Table Name + Live Elapsed Time or Status */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate font-black text-sm sm:text-base tracking-tight drop-shadow-xs">
            {table.label}
          </span>
        </div>

        {status === "OCCUPIED" && firstOrderAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/25 backdrop-blur-xs px-2 py-0.5 text-[11px] font-extrabold tabular-nums tracking-tight">
            <ClockIcon className="size-3 text-white/90" />
            <span>{elapsed}</span>
          </span>
        ) : status === "RESERVED" ? (
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Rezerve
          </span>
        ) : (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Boş
          </span>
        )}
      </div>

      {/* Center Row: Table Meta & Live Order Status Badge */}
      <div className="my-2.5 flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 text-white/90 text-xs font-semibold">
          {table.seats ? (
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3.5 opacity-80" />
              <span>{table.seats} Kişi</span>
            </span>
          ) : null}
        </div>

        {/* Dynamic Status Badges */}
        {hasWaiterCall ? (
          <div className="inline-flex items-center gap-1 rounded-full bg-white text-red-600 px-2.5 py-0.5 text-[10px] font-black animate-bounce shadow-md">
            <BellRingIcon className="size-3" />
            <span>GARSON ÇAĞRILDI</span>
            {onDismissWaiterCall && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissWaiterCall();
                }}
                className="size-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold hover:bg-red-700 ml-0.5"
                title="Çağrıyı Kapat"
              >
                ✕
              </button>
            )}
          </div>
        ) : hasBillRequest ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-2 py-0.5 text-[10px] font-black animate-bounce shadow-md">
            <BellRingIcon className="size-3" />
            <span>HESAP İSTENDİ</span>
          </span>
        ) : isDeliverable ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300 text-emerald-950 px-2 py-0.5 text-[10px] font-black shadow-md animate-pulse">
            <SparklesIcon className="size-3" />
            {canDeliverPackaged && hasCooking ? "PAKETLİ HAZIR" : "TESLİMATA HAZIR"}
          </span>
        ) : isOnlyPreparing ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-400 text-orange-950 px-2 py-0.5 text-[10px] font-black shadow-md animate-pulse">
            <ChefHatIcon className="size-3" />
            HAZIRLANIYOR
          </span>
        ) : status === "OCCUPIED" ? (
          <span className="flex items-center gap-1 text-xs font-bold text-white/90">
            <UtensilsCrossedIcon className="size-3.5" />
            <span>{itemCount} Ürün</span>
          </span>
        ) : null}
      </div>

      {/* Bottom Footer: Total Price & Dynamic Action Button */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/20">
        <span className="text-[11px] font-medium text-white/80">
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
            {canDeliverPackaged && hasCooking ? "Teslim Et" : "Teslim Et"}
          </button>
        ) : isOnlyPreparing ? (
          <span className="inline-flex items-center gap-1 rounded-xl bg-orange-950/80 text-orange-200 border border-orange-400/40 px-2 py-0.5 text-[11px] font-extrabold shadow-xs">
            <ChefHatIcon className="size-3 text-orange-400 animate-spin" />
            Hazırlanıyor
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
