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

  // Premium SaaS Status Theme & Ambient Lighting
  const statusTheme = useMemo(() => {
    if (hasBillRequest) {
      return {
        gradient: "bg-gradient-to-br from-[#ff9f43] via-[#ee5253] to-[#d63031]",
        shadow: "shadow-[0_12px_28px_-6px_rgba(255,159,67,0.5)]",
        border: "border border-amber-300/40 ring-2 ring-amber-300/30",
        icon: <BellRingIcon className="size-4 sm:size-5 text-white animate-bounce" />,
      };
    }
    if (isReserved) {
      return {
        gradient: "bg-gradient-to-br from-[#a29bfe] via-[#6c5ce7] to-[#5b2c6f]",
        shadow: "shadow-[0_12px_28px_-6px_rgba(108,92,231,0.4)]",
        border: "border border-purple-300/30 ring-1 ring-white/15",
        icon: <MoonIcon className="size-4 sm:size-5 text-white" />,
      };
    }
    if (isOccupied) {
      return {
        gradient: "bg-gradient-to-br from-[#ff5e57] via-[#eb4d4b] to-[#c0392b]",
        shadow: "shadow-[0_14px_30px_-6px_rgba(235,77,75,0.42)]",
        border: "border border-red-300/30 ring-1 ring-white/20",
        icon: isPreparing ? (
          <FlameIcon className="size-4 sm:size-5 text-white animate-pulse" />
        ) : isReady ? (
          <CheckCircle2Icon className="size-4 sm:size-5 text-white" />
        ) : (
          <UtensilsIcon className="size-4 sm:size-5 text-white" />
        ),
      };
    }
    // Empty: Material Vibrant Green
    return {
      gradient: "bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857]",
      shadow: "shadow-[0_12px_28px_-6px_rgba(16,185,129,0.38)]",
      border: "border border-emerald-300/30 ring-1 ring-white/20",
      icon: <UtensilsIcon className="size-4 sm:size-5 text-white" />,
    };
  }, [hasBillRequest, isReserved, isOccupied, isPreparing, isReady]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white overflow-hidden select-none cursor-pointer transition-all duration-200",
        statusTheme.gradient,
        statusTheme.shadow,
        statusTheme.border,
        "active:scale-[0.97] hover:-translate-y-1 hover:shadow-2xl",
        isCompact ? "min-h-[135px]" : "min-h-[160px] sm:min-h-[175px]",
        "flex flex-col justify-between",
        className,
      )}
    >
      {/* Soft Ambient Glows */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 size-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 size-28 rounded-full bg-black/15 blur-lg pointer-events-none" />

      {/* TOP ROW: Table Label + Section Pill + Top-Right Icon Badge */}
      <div className="relative flex items-start justify-between gap-2.5">
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-white tracking-tight whitespace-nowrap drop-shadow-xs">
              {table.label}
            </span>
            {table.section && (
              <span className="shrink-0 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 border border-white/20 shadow-2xs whitespace-nowrap">
                {table.section}
              </span>
            )}
          </div>
          {table.seats ? (
            <span className="text-[10px] sm:text-[11px] text-white/85 font-semibold mt-0.5 flex items-center gap-1">
              <UsersIcon className="size-2.5 sm:size-3 shrink-0 opacity-80" />
              <span>{table.seats} Kişi</span>
            </span>
          ) : null}
        </div>

        {/* Top-Right Circular Status Icon Badge */}
        <div className="size-8 sm:size-9 lg:size-10 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105">
          {statusTheme.icon}
        </div>
      </div>

      {/* CENTER: Hero Metric (Total Amount or Müsait/Rezerve) */}
      <div className="relative my-auto py-1">
        {isOccupied ? (
          <div className="flex flex-col">
            <div className="flex items-baseline overflow-hidden">
              <span className="text-2xl sm:text-[28px] lg:text-3xl font-black text-white tabular-nums tracking-tight whitespace-nowrap drop-shadow-xs">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/85 text-[10px] sm:text-[11px] font-medium mt-0.5 whitespace-nowrap">
              <span>{itemCount} ürün</span>
              <span>•</span>
              <span>{orders.length} adisyon</span>
            </div>
          </div>
        ) : isReserved ? (
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Rezerve
            </span>
            <span className="text-white/85 text-[10px] sm:text-[11px] font-medium mt-0.5">
              Rezervasyonlu Masa
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Müsait
            </span>
            <span className="text-white/85 text-[10px] sm:text-[11px] font-medium mt-0.5">
              + Sipariş Başlat
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM ROW: Detailed Indicators (Timer & Kitchen Status) */}
      <div className="relative flex items-end justify-between gap-1.5 text-[11px] sm:text-xs font-semibold text-white/90 pt-1">
        {/* Left: Duration timer or ready text */}
        <div className="flex items-center min-w-0">
          {isOccupied && elapsed ? (
            <span className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15 font-mono font-bold text-[10px] sm:text-[11px] text-white shadow-2xs whitespace-nowrap">
              <ClockIcon className="size-2.5 sm:size-3 text-white/80 shrink-0" />
              <span>{elapsed}</span>
            </span>
          ) : !isOccupied ? (
            <span className="text-white/85 text-[10px] sm:text-[11px] font-medium">
              Siparişe Hazır
            </span>
          ) : null}
        </div>

        {/* Right: Kitchen & Bill Badges */}
        <div className="flex items-center shrink-0">
          {hasBillRequest ? (
            <span className="rounded-full bg-white text-[#d63031] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
              <BellRingIcon className="size-2.5 shrink-0" />
              <span>Hesap</span>
            </span>
          ) : isPreparing ? (
            <span className="rounded-full bg-amber-400 text-amber-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
              <ChefHatIcon className="size-2.5 shrink-0" />
              <span>Mutfak</span>
            </span>
          ) : isReady ? (
            <span className="rounded-full bg-white text-emerald-700 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
              <CheckCircle2Icon className="size-2.5 shrink-0" />
              <span>Hazır</span>
            </span>
          ) : isOccupied ? (
            <span className="rounded-full bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 text-[10px] font-bold border border-white/15 whitespace-nowrap">
              Serviste
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
