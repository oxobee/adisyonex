"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  ArmchairIcon,
  BuildingIcon,
  ChefHatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  PackageIcon,
  SearchIcon,
  TreePineIcon,
  UmbrellaIcon,
  UsersIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

interface TableCarouselProps {
  tables: readonly TableDTO[];
  ordersByTableId: Map<string, OrderDTO[]>;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sections: string[];
  selectedSection: string;
  onSelectSection: (section: string) => void;
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

/** Get section icon based on name */
const getSectionIcon = (section: string) => {
  const lower = section.toLowerCase();
  if (lower.includes("bahçe") || lower.includes("bahce") || lower.includes("garden")) {
    return <TreePineIcon className="size-3.5 text-emerald-500 shrink-0" />;
  }
  if (lower.includes("salon") || lower.includes("hall") || lower.includes("iç")) {
    return <ArmchairIcon className="size-3.5 text-amber-500 shrink-0" />;
  }
  if (lower.includes("teras") || lower.includes("terrace") || lower.includes("balkon")) {
    return <UmbrellaIcon className="size-3.5 text-sky-500 shrink-0" />;
  }
  return <BuildingIcon className="size-3.5 text-muted-foreground shrink-0" />;
};

export function TableCarousel({
  tables,
  ordersByTableId,
  selectedTableId,
  onSelectTable,
  searchQuery,
  onSearchChange,
  sections,
  selectedSection,
  onSelectSection,
}: TableCarouselProps) {
  // Find current index of selected table
  const activeIndex = useMemo(() => {
    if (!selectedTableId) return 0;
    const idx = tables.findIndex((t) => t.id === selectedTableId);
    return idx >= 0 ? idx : 0;
  }, [tables, selectedTableId]);

  // Live seconds ticker for timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = useCallback(() => {
    if (tables.length === 0) return;
    const newIdx = (activeIndex - 1 + tables.length) % tables.length;
    onSelectTable(tables[newIdx].id);
  }, [tables, activeIndex, onSelectTable]);

  const handleNext = useCallback(() => {
    if (tables.length === 0) return;
    const newIdx = (activeIndex + 1) % tables.length;
    onSelectTable(tables[newIdx].id);
  }, [tables, activeIndex, onSelectTable]);

  // Keyboard left/right navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  return (
    <div className="flex flex-col items-center w-full gap-5 sm:gap-6">
      {/* 1. TOP CENTERED SEARCH BAR */}
      <div className="w-full max-w-xl mx-auto px-4">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Masa adı veya salon ara…"
            className="w-full h-11 pl-11 pr-4 rounded-full bg-card/85 dark:bg-card/70 border border-border/80 text-foreground text-xs sm:text-sm font-medium placeholder:text-muted-foreground shadow-xs hover:border-border transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* 2. COVERFLOW / 3D CAROUSEL SLIDER */}
      <div className="relative w-full max-w-6xl mx-auto overflow-hidden py-3 px-2 sm:px-6 select-none">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Önceki Masa"
          className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-30 size-10 sm:size-12 rounded-full bg-background/95 hover:bg-background border border-border/70 text-foreground shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:shadow-xl"
        >
          <ChevronLeftIcon className="size-5 sm:size-6" />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Sonraki Masa"
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-30 size-10 sm:size-12 rounded-full bg-background/95 hover:bg-background border border-border/70 text-foreground shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer hover:shadow-xl"
        >
          <ChevronRightIcon className="size-5 sm:size-6" />
        </button>

        {/* Cards Container with Coverflow Perspective */}
        <div className="relative min-h-[220px] sm:min-h-[235px] flex items-center justify-center">
          {tables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aramaya uygun masa bulunamadı.
            </div>
          ) : (
            tables.map((table, index) => {
              const tableOrders = ordersByTableId.get(table.id) ?? [];
              const isOccupied = tableOrders.length > 0;
              const activeLines = tableOrders.flatMap((o) =>
                o.lines.filter((l) => l.state !== "VOID"),
              );
              const itemCount = activeLines.reduce((sum, l) => sum + l.quantity, 0);
              const totalAmount = activeLines.reduce(
                (sum, l) => sum + l.unitPrice * l.quantity,
                0,
              );

              // Live elapsed timer
              const firstOrderAt =
                tableOrders.length > 0 ? tableOrders[0].createdAt : null;
              const elapsed = firstOrderAt ? formatElapsed(firstOrderAt) : null;

              // Elapsed minutes & duration tier
              const diffSec = firstOrderAt
                ? Math.max(0, Math.floor((Date.now() - new Date(firstOrderAt).getTime()) / 1000))
                : 0;
              const elapsedMinutes = Math.floor(diffSec / 60);

              let durationLabel = "Müsait";
              if (isOccupied) {
                if (elapsedMinutes < 20) durationLabel = "< 20 dk";
                else if (elapsedMinutes < 45) durationLabel = "20-45 dk";
                else if (elapsedMinutes < 75) durationLabel = "45-75 dk";
                else durationLabel = "75+ dk";
              }

              // Kitchen state detection
              const unservedLines = activeLines.filter((l) => l.state !== "SERVED");
              const isPreparing = unservedLines.some(
                (l) => l.state === "FIRED" || l.state === "UNSENT" || l.state === "PREPARING",
              );
              const isReady =
                unservedLines.length > 0 &&
                unservedLines.every((l) => l.state === "PREPARED");

              // Reserved check
              const isReserved =
                tableOrders.some((o) => o.note?.toUpperCase().includes("REZERVE")) ||
                table.label.toUpperCase().includes("REZERVE");

              // Status color scheme: Green for Empty, Red for Occupied, Indigo for Reserved
              const cardGradient = isReserved
                ? "bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#3730a3] shadow-[0_12px_36px_rgba(79,70,229,0.35)]"
                : isOccupied
                  ? "bg-gradient-to-r from-[#fa4b6d] via-[#e53956] to-[#cc2847] shadow-[0_12px_36px_rgba(229,57,86,0.35)]"
                  : "bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] shadow-[0_12px_36px_rgba(5,150,105,0.35)]";

              // Coverflow relative offset
              let offset = index - activeIndex;
              // Wrap around for seamless appearance if tables list is large
              const half = Math.floor(tables.length / 2);
              if (offset > half) offset -= tables.length;
              else if (offset < -half) offset += tables.length;

              const isCurrent = offset === 0;
              const isAdjacent = Math.abs(offset) === 1;
              const isVisible = Math.abs(offset) <= 2;

              if (!isVisible) return null;

              // 3D Transform values
              const translateX = offset * 280; // horizontal separation
              const scale = isCurrent ? 1 : isAdjacent ? 0.88 : 0.76;
              const opacity = isCurrent ? 1 : isAdjacent ? 0.78 : 0.45;
              const zIndex = isCurrent ? 20 : 15 - Math.abs(offset);

              return (
                <div
                  key={table.id}
                  onClick={() => onSelectTable(table.id)}
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    zIndex,
                    opacity,
                  }}
                  className={cn(
                    "absolute transition-all duration-350 ease-out cursor-pointer",
                    "w-[340px] sm:w-[410px] select-none",
                  )}
                >
                  {/* Glowing Status Colored Card Frame (Green: Empty, Red: Occupied, Indigo: Reserved) */}
                  <div
                    className={cn(
                      "relative rounded-[28px] p-5 sm:p-6 text-white overflow-hidden shadow-2xl transition-all duration-300",
                      cardGradient,
                      isCurrent && "ring-4 ring-white/70 shadow-[0_18px_45px_rgba(0,0,0,0.35)] scale-[1.01]",
                    )}
                  >
                    {/* Subtle atmospheric background graphic overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_60%)] pointer-events-none" />

                    {/* TOP ROW: Table Name + Section Badge + Timer + Seats */}
                    <div className="relative flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                          {table.label}
                        </h3>
                        {table.section && (
                          <span className="rounded-full bg-black/25 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 border border-white/15">
                            {table.section}
                          </span>
                        )}
                      </div>

                      {/* Timer & Seats on Right */}
                      <div className="flex flex-col items-end gap-0.5 text-right">
                        {elapsed ? (
                          <div className="inline-flex items-center gap-1.5 text-white text-xs font-mono font-bold tracking-tight bg-black/20 px-2.5 py-0.5 rounded-full border border-white/10">
                            <ClockIcon className="size-3 text-white/90" />
                            <span>{elapsed}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-white/80 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/10">
                            Masa Boş
                          </span>
                        )}

                        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/85 mt-0.5">
                          {isOccupied && (
                            <span className="inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-white animate-pulse" />
                              <span>{durationLabel}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <UsersIcon className="size-3 text-white/80" />
                            <span>{table.seats || 4} Kişi</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE ROW: Adisyon Count + Item Count */}
                    <div className="relative flex items-center justify-between text-xs font-bold text-white/90 py-1.5 mb-2">
                      <div className="inline-flex items-center gap-1.5">
                        <FileTextIcon className="size-4 text-white/85" />
                        <span>{tableOrders.length} Adisyon</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5">
                        <PackageIcon className="size-4 text-white/85" />
                        <span>{itemCount > 0 ? `${itemCount} Ürün` : "Ürün Yok"}</span>
                      </div>
                    </div>

                    {/* STATUS PILLS: Hazırlanıyor / Mutfakta / Hazır */}
                    <div className="relative flex items-center gap-2 mb-3">
                      {isReserved ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/25 backdrop-blur-xs text-white px-3 py-0.5 text-[11px] font-bold border border-white/20">
                          <span>Rezerve Masa</span>
                        </div>
                      ) : isPreparing ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f8bc3c] text-amber-950 px-3 py-0.5 text-[11px] font-black shadow-xs">
                            <ChefHatIcon className="size-3 text-amber-950" />
                            <span>HAZIRLANIYOR</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-xs text-white px-3 py-0.5 text-[11px] font-bold border border-white/10">
                            <UtensilsCrossedIcon className="size-3 text-white/90" />
                            <span>Mutfakta</span>
                          </div>
                        </>
                      ) : isReady ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300 text-emerald-950 px-3 py-0.5 text-[11px] font-black shadow-xs">
                          <span>HAZIR / TESLİM</span>
                        </div>
                      ) : isOccupied ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-black/25 text-white px-3 py-0.5 text-[11px] font-bold border border-white/10">
                          <span>Aktif Masa</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/25 backdrop-blur-xs text-white px-3 py-0.5 text-[11px] font-bold border border-white/20">
                          <span>Boş / Müsait</span>
                        </div>
                      )}
                    </div>

                    {/* BOTTOM ROW: Masa Tutarı */}
                    <div className="relative pt-2.5 border-t border-white/20 flex items-center justify-between">
                      <span className="text-white/85 text-xs sm:text-sm font-semibold tracking-tight">
                        Masa Tutarı
                      </span>
                      <span className="text-lg sm:text-2xl font-black text-white tabular-nums tracking-tight drop-shadow-xs">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. SECTION / SALON FILTER PILLS (CENTERED, PURPLE ACTIVE PILL) */}
      <div className="w-full flex justify-center px-4">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 max-w-full justify-center">
          {/* Tüm Masalar Pill */}
          <button
            type="button"
            onClick={() => onSelectSection("ALL")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2 text-xs font-black transition-all cursor-pointer select-none",
              selectedSection === "ALL"
                ? "bg-[#5c328e] hover:bg-[#522982] text-white shadow-md shadow-purple-950/20 scale-102 ring-2 ring-purple-400/30"
                : "bg-card hover:bg-muted text-foreground/80 border border-border/80 shadow-xs",
            )}
          >
            <span>Tüm Masalar</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                selectedSection === "ALL" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {tables.length}
            </span>
          </button>

          {/* Section Pills */}
          {sections.map((sec) => {
            const isSelected = selectedSection === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => onSelectSection(sec)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-[#5c328e] hover:bg-[#522982] text-white shadow-md shadow-purple-950/20 scale-102 ring-2 ring-purple-400/30"
                    : "bg-card hover:bg-muted text-foreground/80 border border-border/80 shadow-xs",
                )}
              >
                {getSectionIcon(sec)}
                <span>{sec}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
