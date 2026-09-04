"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRingIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  FlameIcon,
  HeartIcon,
  MoonIcon,
  ReceiptIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

export interface MaterialTableCardProps {
  table: TableDTO;
  orders: readonly OrderDTO[];
  onClick?: () => void;
  isCompact?: boolean;
  className?: string;
}

/** Formats elapsed time as HH:MM:SS */
const formatElapsed = (startedAt: string): string => {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
};

export function MaterialTableCard({
  table,
  orders,
  onClick,
  isCompact = false,
  className,
}: MaterialTableCardProps) {
  const isOccupied = orders.length > 0;

  const activeLines = useMemo(
    () => orders.flatMap((o) => o.lines.filter((l) => l.state !== "VOID")),
    [orders],
  );

  const itemCount = useMemo(
    () => activeLines.reduce((sum, l) => sum + l.quantity, 0),
    [activeLines],
  );

  const totalAmount = useMemo(
    () => activeLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [activeLines],
  );

  const firstOrderAt = isOccupied ? orders[0].createdAt : null;
  const [elapsed, setElapsed] = useState<string>(
    firstOrderAt ? formatElapsed(firstOrderAt) : "",
  );

  useEffect(() => {
    if (!firstOrderAt || !isOccupied) {
      setElapsed("");
      return;
    }
    setElapsed(formatElapsed(firstOrderAt));
    const interval = setInterval(() => {
      setElapsed(formatElapsed(firstOrderAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [firstOrderAt, isOccupied]);

  const hasBillRequest = useMemo(
    () => orders.some((o) => o.billRequestedAt !== null),
    [orders],
  );

  const isReserved = useMemo(
    () =>
      orders.some((o) => o.note?.toUpperCase().includes("REZERVE")) ||
      table.label.toUpperCase().includes("REZERVE"),
    [orders, table.label],
  );

  const unservedLines = useMemo(
    () => activeLines.filter((l) => l.state !== "SERVED"),
    [activeLines],
  );

  const isPreparing = unservedLines.some(
    (l) => l.state === "FIRED" || l.state === "UNSENT" || l.state === "PREPARING",
  );

  const isReady =
    unservedLines.length > 0 &&
    unservedLines.every((l) => l.state === "PREPARED");

  // Color Gradient & Shadow according to Status (matching reference image)
  const statusTheme = useMemo(() => {
    if (hasBillRequest) {
      return {
        gradient: "bg-gradient-to-br from-[#ff9f43] to-[#ee5253]",
        shadow: "shadow-[0_12px_28px_-6px_rgba(255,159,67,0.45)]",
        icon: <BellRingIcon className="size-4.5 sm:size-5 text-white animate-bounce" />,
      };
    }
    if (isReserved) {
      return {
        gradient: "bg-gradient-to-br from-[#a29bfe] to-[#6c5ce7]",
        shadow: "shadow-[0_12px_28px_-6px_rgba(108,92,231,0.4)]",
        icon: <MoonIcon className="size-4.5 sm:size-5 text-white" />,
      };
    }
    if (isOccupied) {
      return {
        gradient: "bg-gradient-to-br from-[#ff6b6b] to-[#ee5253]",
        shadow: "shadow-[0_12px_28px_-6px_rgba(238,82,83,0.4)]",
        icon: isPreparing ? (
          <FlameIcon className="size-4.5 sm:size-5 text-white animate-pulse" />
        ) : isReady ? (
          <CheckCircle2Icon className="size-4.5 sm:size-5 text-white" />
        ) : (
          <HeartIcon className="size-4.5 sm:size-5 text-white" />
        ),
      };
    }
    // Empty: Material Lime/Emerald Green
    return {
      gradient: "bg-gradient-to-br from-[#22c55e] to-[#16a34a]",
      shadow: "shadow-[0_12px_28px_-6px_rgba(22,163,74,0.38)]",
      icon: <UtensilsIcon className="size-4.5 sm:size-5 text-white" />,
    };
  }, [hasBillRequest, isReserved, isOccupied, isPreparing, isReady]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-[26px] sm:rounded-3xl p-4 sm:p-5 text-white overflow-hidden select-none cursor-pointer transition-all duration-200",
        statusTheme.gradient,
        statusTheme.shadow,
        "active:scale-[0.95] hover:-translate-y-1 hover:shadow-2xl",
        isCompact ? "min-h-[135px]" : "min-h-[155px] sm:min-h-[175px]",
        "flex flex-col justify-between",
        className,
      )}
    >
      {/* Background soft lighting glow */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 size-28 rounded-full bg-white/10 blur-xl pointer-events-none" />

      {/* TOP ROW: Table Label + Section Badge + Top-Right Circular Badge */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-white tracking-tight drop-shadow-xs">
              {table.label}
            </span>
            {table.section && (
              <span className="rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 border border-white/15">
                {table.section}
              </span>
            )}
          </div>
          {table.seats && (
            <span className="text-[10px] text-white/80 font-medium mt-0.5 flex items-center gap-1">
              <UsersIcon className="size-2.5" />
              <span>{table.seats} Kişi</span>
            </span>
          )}
        </div>

        {/* Top-Right Circular Icon Badge (Material Spec) */}
        <div className="size-8 sm:size-10 rounded-full bg-white/25 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
          {statusTheme.icon}
        </div>
      </div>

      {/* CENTER: Hero Metric (Total Amount or Müsait/Rezerve) */}
      <div className="relative my-auto py-1">
        {isOccupied ? (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tabular-nums tracking-tight drop-shadow-xs">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        ) : isReserved ? (
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Rezerve
          </span>
        ) : (
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Müsait
          </span>
        )}
      </div>

      {/* BOTTOM ROW: Secondary Stats / Subtext (Elapsed Time, Adisyon, Mutfak) */}
      <div className="relative flex items-end justify-between text-[11px] sm:text-xs font-semibold text-white/90 pt-1">
        <div className="flex items-center gap-1.5">
          {isOccupied ? (
            <>
              {elapsed && (
                <span className="inline-flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/10 font-mono font-bold text-[10px] sm:text-[11px]">
                  <ClockIcon className="size-2.5" />
                  <span>{elapsed}</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-white/85 text-[11px]">Siparişe Hazır</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {hasBillRequest ? (
            <span className="rounded-full bg-white text-[#ee5253] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
              Hesap İste
            </span>
          ) : isPreparing ? (
            <span className="rounded-full bg-amber-400 text-amber-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
              <ChefHatIcon className="size-2.5" />
              <span>Mutfak</span>
            </span>
          ) : isReady ? (
            <span className="rounded-full bg-white text-emerald-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
              Hazır
            </span>
          ) : isOccupied ? (
            <span className="text-white/90 text-[11px] font-bold">
              {orders.length} Adisyon · {itemCount} Ürün
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
