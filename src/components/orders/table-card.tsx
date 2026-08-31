"use client";

import { useEffect, useState } from "react";
import {
  BellRingIcon,
  CheckCircle2Icon,
  ClockIcon,
  ReceiptIcon,
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
  isSelected?: boolean;
  onClick: () => void;
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

export function TableCard({
  table,
  status,
  total,
  orders,
  firstOrderAt,
  hasBillRequest,
  isSelected,
  onClick,
}: TableCardProps) {
  const [elapsed, setElapsed] = useState<string>(
    firstOrderAt ? formatElapsed(firstOrderAt) : "",
  );

  // Live timer interval if occupied
  useEffect(() => {
    if (!firstOrderAt || status !== "OCCUPIED") return;

    setElapsed(formatElapsed(firstOrderAt));
    const interval = setInterval(() => {
      setElapsed(formatElapsed(firstOrderAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [firstOrderAt, status]);

  const itemCount = orders.reduce(
    (sum, o) => sum + o.lines.filter((l) => l.state !== "VOID").reduce((s, l) => s + l.quantity, 0),
    0,
  );

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
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-3.5 transition-all duration-200 select-none cursor-pointer text-white shadow-md active:scale-95",
        // Color coding:
        status === "EMPTY" &&
          "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/15",
        status === "OCCUPIED" &&
          "bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/20",
        status === "RESERVED" &&
          "bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/15",
        // Bill Request Alarm Animation:
        hasBillRequest &&
          "ring-4 ring-amber-400 ring-offset-2 ring-offset-background animate-pulse shadow-xl shadow-amber-500/40",
        // Spotlight Selected State:
        isSelected &&
          "ring-4 ring-white/90 shadow-2xl",
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

      {/* Center Icon & Guest / Table Meta */}
      <div className="my-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-white/90 text-xs font-semibold">
          {table.seats ? (
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3.5 opacity-80" />
              <span>{table.seats} Kişi</span>
            </span>
          ) : null}
        </div>

        {hasBillRequest ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-2 py-0.5 text-[10px] font-black animate-bounce shadow-md">
            <BellRingIcon className="size-3" />
            <span>HESAP İSTENDİ</span>
          </span>
        ) : status === "OCCUPIED" ? (
          <span className="flex items-center gap-1 text-xs font-bold text-white/90">
            <UtensilsCrossedIcon className="size-3.5" />
            <span>{itemCount} Ürün</span>
          </span>
        ) : null}
      </div>

      {/* Bottom Footer: Total Price */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/20">
        <span className="text-[11px] font-medium text-white/80">
          {status === "OCCUPIED" ? "Masa Tutarı" : "Durum"}
        </span>
        <span className="font-black text-sm sm:text-base tracking-tight tabular-nums drop-shadow-xs">
          {status === "OCCUPIED" ? `${total.toFixed(0)} ₺` : "Müsait"}
        </span>
      </div>
    </div>
  );
}
