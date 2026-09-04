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

  // Premium 3D Material Status Theme, Specular Bevels & Floor Shadows
  const statusTheme = useMemo(() => {
    if (hasBillRequest) {
      return {
        gradient: "bg-gradient-to-br from-[#ff9f43] via-[#ee5253] to-[#d63031]",
        shadow: "shadow-[0_14px_32px_-6px_rgba(255,159,67,0.5),0_4px_12px_rgba(0,0,0,0.15)]",
        border: "border-t border-t-amber-200/60 border-x border-amber-300/30 border-b-[3px] border-b-black/35",
        insetHighlight: "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
        icon: <BellRingIcon className="size-4 sm:size-5 text-white animate-bounce" />,
      };
    }
    if (isReserved) {
      return {
        gradient: "bg-gradient-to-br from-[#9b5de5] via-[#6c5ce7] to-[#51368a]",
        shadow: "shadow-[0_14px_30px_-6px_rgba(108,92,231,0.45),0_4px_12px_rgba(0,0,0,0.15)]",
        border: "border-t border-t-purple-200/50 border-x border-purple-300/25 border-b-[3px] border-b-black/35",
        insetHighlight: "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
        icon: <MoonIcon className="size-4 sm:size-5 text-white" />,
      };
    }
    if (isOccupied) {
      return {
        gradient: "bg-gradient-to-br from-[#ff5e57] via-[#eb4d4b] to-[#b71540]",
        shadow: "shadow-[0_16px_34px_-6px_rgba(235,77,75,0.45),0_4px_12px_rgba(0,0,0,0.18)]",
        border: "border-t border-t-red-200/50 border-x border-red-300/25 border-b-[3px] border-b-black/35",
        insetHighlight: "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.25)]",
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
      gradient: "bg-gradient-to-br from-[#10b981] via-[#059669] to-[#046c4e]",
      shadow: "shadow-[0_14px_30px_-6px_rgba(16,185,129,0.4),0_4px_12px_rgba(0,0,0,0.15)]",
      border: "border-t border-t-emerald-200/50 border-x border-emerald-300/25 border-b-[3px] border-b-black/35",
      insetHighlight: "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
      icon: <UtensilsIcon className="size-4 sm:size-5 text-white" />,
    };
  }, [hasBillRequest, isReserved, isOccupied, isPreparing, isReady]);

  // Clean sanitized ID for SVG pattern definition
  const patternId = useMemo(
    () => `pat-${table.id.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [table.id],
  );

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white overflow-hidden select-none cursor-pointer transition-all duration-200",
        statusTheme.gradient,
        statusTheme.shadow,
        statusTheme.border,
        statusTheme.insetHighlight,
        "transform-gpu will-change-transform",
        "hover:-translate-y-1.5 hover:shadow-2xl",
        "active:translate-y-1 active:scale-[0.985] active:border-b-2 active:shadow-md",
        isCompact ? "min-h-[135px]" : "min-h-[160px] sm:min-h-[175px]",
        "flex flex-col justify-between",
        className,
      )}
    >
      {/* 3D MATERIAL BACKGROUND TEXTURES & EYE-FRIENDLY PATTERN */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
        {/* Eye-friendly Micro-Grid & Dot Matrix Pattern (subtle non-distracting opacity) */}
        <svg
          className="absolute inset-0 size-full opacity-[0.07] mix-blend-overlay"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={patternId}
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.1" fill="white" />
              <circle cx="14" cy="14" r="0.9" fill="white" />
              <path
                d="M24 0H0V24"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                strokeDasharray="2 4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>

        {/* Elegant 3D Concentric Geometric Rings in Corner */}
        <svg
          className="absolute -bottom-6 -right-6 w-36 h-36 opacity-[0.08] text-white pointer-events-none"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle cx="80" cy="80" r="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="80" cy="80" r="52" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>

        {/* 3D Top Specular Light Bevel */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-t-[inherit]" />

        {/* 3D Bottom Depth Shadow */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 via-black/10 to-transparent pointer-events-none rounded-b-[inherit]" />

        {/* Ambient Top-Left Specular Glow */}
        <div className="absolute -top-12 -left-12 size-36 rounded-full bg-white/15 blur-2xl pointer-events-none" />
      </div>

      {/* TOP ROW: Table Label + Section Pill + Top-Right Icon Badge */}
      <div className="relative z-10 flex items-start justify-between gap-2.5">
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-white tracking-tight whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              {table.label}
            </span>
            {table.section && (
              <span className="shrink-0 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.15)] whitespace-nowrap">
                {table.section}
              </span>
            )}
          </div>
          {table.seats ? (
            <span className="text-[10px] sm:text-[11px] text-white/85 font-semibold mt-0.5 flex items-center gap-1 drop-shadow-2xs">
              <UsersIcon className="size-2.5 sm:size-3 shrink-0 opacity-80" />
              <span>{table.seats} Kişi</span>
            </span>
          ) : null}
        </div>

        {/* Top-Right Tactile 3D Circular Status Icon Badge */}
        <div className="size-8 sm:size-9 lg:size-10 rounded-full bg-white/25 backdrop-blur-md border border-white/40 shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.6),0_3px_6px_rgba(0,0,0,0.2)] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
          {statusTheme.icon}
        </div>
      </div>

      {/* CENTER: Hero Metric (Total Amount or Müsait/Rezerve) */}
      <div className="relative z-10 my-auto py-1">
        {isOccupied ? (
          <div className="flex flex-col">
            <div className="flex items-baseline overflow-hidden">
              <span className="text-2xl sm:text-[28px] lg:text-3xl font-black text-white tabular-nums tracking-tight whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90 text-[10px] sm:text-[11px] font-medium mt-0.5 whitespace-nowrap drop-shadow-2xs">
              <span>{itemCount} ürün</span>
              <span>•</span>
              <span>{orders.length} adisyon</span>
            </div>
          </div>
        ) : isReserved ? (
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
              Rezerve
            </span>
            <span className="text-white/85 text-[10px] sm:text-[11px] font-medium mt-0.5">
              Rezervasyonlu Masa
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
              Müsait
            </span>
            <span className="text-white/85 text-[10px] sm:text-[11px] font-medium mt-0.5">
              + Sipariş Başlat
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM ROW: Detailed Indicators (Timer & Kitchen Status) */}
      <div className="relative z-10 flex items-end justify-between gap-1.5 text-[11px] sm:text-xs font-semibold text-white/90 pt-1">
        {/* Left: Recessed Duration LCD timer or ready text */}
        <div className="flex items-center min-w-0">
          {isOccupied && elapsed ? (
            <span className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.1)] font-mono font-bold text-[10px] sm:text-[11px] text-white whitespace-nowrap">
              <ClockIcon className="size-2.5 sm:size-3 text-white/80 shrink-0" />
              <span>{elapsed}</span>
            </span>
          ) : !isOccupied ? (
            <span className="text-white/85 text-[10px] sm:text-[11px] font-medium drop-shadow-2xs">
              Siparişe Hazır
            </span>
          ) : null}
        </div>

        {/* Right: Tactile 3D Kitchen & Bill Badges */}
        <div className="flex items-center shrink-0">
          {hasBillRequest ? (
            <span className="rounded-full bg-white text-[#d63031] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center gap-1 animate-pulse">
              <BellRingIcon className="size-2.5 shrink-0" />
              <span>Hesap</span>
            </span>
          ) : isPreparing ? (
            <span className="rounded-full bg-amber-400 text-amber-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center gap-1">
              <ChefHatIcon className="size-2.5 shrink-0" />
              <span>Mutfak</span>
            </span>
          ) : isReady ? (
            <span className="rounded-full bg-white text-emerald-700 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)] flex items-center gap-1">
              <CheckCircle2Icon className="size-2.5 shrink-0" />
              <span>Hazır</span>
            </span>
          ) : isOccupied ? (
            <span className="rounded-full bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 text-[10px] font-bold border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)] whitespace-nowrap">
              Serviste
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
