"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArmchairIcon,
  ArrowRightLeftIcon,
  BuildingIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  MergeIcon,
  PackageIcon,
  PlusCircleIcon,
  PrinterIcon,
  ReceiptIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  TreePineIcon,
  UmbrellaIcon,
  UsersIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

interface TableSplitViewProps {
  tables: readonly TableDTO[];
  ordersByTableId: Map<string, OrderDTO[]>;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sections: string[];
  selectedSection: string;
  onSelectSection: (section: string) => void;
  onPrintBill: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onAddProduct: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onSettleBill: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onTransferTable: (table: TableDTO) => void;
  onMergeTable: (table: TableDTO) => void;
  onViewDetails: (table: TableDTO, orders: readonly OrderDTO[]) => void;
  onVoidTable: (table: TableDTO) => void;
  onDeliverTable?: (tableId: string) => void;
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

/** Section Icon */
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

export function TableSplitView({
  tables,
  ordersByTableId,
  selectedTableId,
  onSelectTable,
  searchQuery,
  onSearchChange,
  sections,
  selectedSection,
  onSelectSection,
  onPrintBill,
  onAddProduct,
  onSettleBill,
  onTransferTable,
  onMergeTable,
  onViewDetails,
  onVoidTable,
  onDeliverTable,
}: TableSplitViewProps) {
  // Mobile Tab state ("TABLES" vs "DETAILS")
  const [mobileTab, setMobileTab] = useState<"TABLES" | "DETAILS">("TABLES");

  // Timer ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Active selected table resolution
  const activeTable = useMemo(() => {
    if (selectedTableId) {
      const found = tables.find((t) => t.id === selectedTableId);
      if (found) return found;
    }
    return tables[0] ?? null;
  }, [tables, selectedTableId]);

  const activeOrders = useMemo(
    () => (activeTable ? ordersByTableId.get(activeTable.id) ?? [] : []),
    [ordersByTableId, activeTable],
  );

  const activeLines = useMemo(
    () => activeOrders.flatMap((o) => o.lines.filter((l) => l.state !== "VOID")),
    [activeOrders],
  );

  const activeTotal = useMemo(
    () => activeLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [activeLines],
  );

  const activeItemCount = useMemo(
    () => activeLines.reduce((sum, l) => sum + l.quantity, 0),
    [activeLines],
  );

  const isOccupied = activeOrders.length > 0;
  const firstOrderAt = isOccupied ? activeOrders[0].createdAt : null;
  const elapsed = firstOrderAt ? formatElapsed(firstOrderAt) : null;

  // Kitchen deliverable state
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
  const canDeliverPackaged = unservedPackaged.length > 0;
  const isDeliverable = canDeliverPackaged || hasCookedReady;
  const isOnlyPreparing = !canDeliverPackaged && hasCooking;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* MOBILE SEGMENTED VIEW SWITCHER (Visible on Mobile only) */}
      <div className="flex lg:hidden w-full items-center p-1 bg-muted/60 rounded-2xl border border-border/80 sticky top-0 z-20 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMobileTab("TABLES")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            mobileTab === "TABLES"
              ? "bg-card text-foreground shadow-sm font-black"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Masalar</span>
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.2 text-[10px] font-black">
            {tables.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("DETAILS")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            mobileTab === "DETAILS"
              ? "bg-card text-foreground shadow-sm font-black"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>{activeTable ? activeTable.label : "Masa İşlemleri"}</span>
          <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.2 text-[10px] font-black">
            {formatCurrency(activeTotal)}
          </span>
        </button>
      </div>

      {/* DESKTOP SPLIT CONTAINER (2 COLUMNS: LEFT TABLES, RIGHT FIXED WORKBENCH) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: TABLE CARDS & FILTERS (7 cols on desktop) */}
        <div
          className={cn(
            "w-full flex flex-col gap-4",
            "lg:col-span-7",
            mobileTab === "DETAILS" && "hidden lg:flex",
          )}
        >
          {/* Top Search & Section Chips in compact bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Masa adı veya salon ara…"
                className="w-full h-10 pl-10 pr-3.5 rounded-2xl bg-card border border-border/80 text-foreground text-xs font-medium placeholder:text-muted-foreground shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Salon / Section Chips */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => onSelectSection("ALL")}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer",
                  selectedSection === "ALL"
                    ? "bg-[#5c328e] text-white shadow-xs font-black"
                    : "bg-card text-muted-foreground border border-border/70 hover:bg-muted",
                )}
              >
                <span>Tümü</span>
                <span className="text-[10px] opacity-75">({tables.length})</span>
              </button>

              {sections.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onSelectSection(sec)}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer",
                    selectedSection === sec
                      ? "bg-[#5c328e] text-white shadow-xs font-black"
                      : "bg-card text-muted-foreground border border-border/70 hover:bg-muted",
                  )}
                >
                  {getSectionIcon(sec)}
                  <span>{sec}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Cards Grid */}
          {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/80 bg-muted/10">
              <SparklesIcon className="size-8 text-muted-foreground/60 mb-2" />
              <p className="font-bold text-foreground text-sm">Masa Bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lütfen arama kelimenizi veya salon filtresini kontrol edin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {tables.map((table) => {
                const tableOrders = ordersByTableId.get(table.id) ?? [];
                const isTableOccupied = tableOrders.length > 0;
                const lines = tableOrders.flatMap((o) =>
                  o.lines.filter((l) => l.state !== "VOID"),
                );
                const itemsCount = lines.reduce((s, l) => s + l.quantity, 0);
                const totalAmt = lines.reduce(
                  (s, l) => s + l.unitPrice * l.quantity,
                  0,
                );

                const tableFirstOrder = isTableOccupied ? tableOrders[0].createdAt : null;
                const tableElapsed = tableFirstOrder ? formatElapsed(tableFirstOrder) : null;

                const isReserved =
                  tableOrders.some((o) => o.note?.toUpperCase().includes("REZERVE")) ||
                  table.label.toUpperCase().includes("REZERVE");

                // Status gradient: Green for empty, Red for occupied, Indigo for reserved
                const gradientClass = isReserved
                  ? "bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#3730a3] shadow-[0_8px_20px_rgba(79,70,229,0.25)]"
                  : isTableOccupied
                    ? "bg-gradient-to-r from-[#fa4b6d] via-[#e53956] to-[#cc2847] shadow-[0_8px_20px_rgba(229,57,86,0.25)]"
                    : "bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] shadow-[0_8px_20px_rgba(5,150,105,0.25)]";

                const isSelected = activeTable?.id === table.id;

                return (
                  <div
                    key={table.id}
                    onClick={() => {
                      onSelectTable(table.id);
                      // On mobile screen, switch to details view automatically for convenience
                      if (window.innerWidth < 1024) {
                        setMobileTab("DETAILS");
                      }
                    }}
                    className={cn(
                      "relative rounded-2xl p-4 text-white overflow-hidden cursor-pointer transition-all duration-200 select-none",
                      gradientClass,
                      isSelected
                        ? "ring-4 ring-primary/80 dark:ring-primary shadow-xl scale-[1.02]"
                        : "hover:scale-[1.01] hover:shadow-lg opacity-95",
                    )}
                  >
                    {/* Header: Label + Section + Timer */}
                    <div className="flex items-start justify-between gap-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-lg font-black tracking-tight drop-shadow-xs">
                          {table.label}
                        </h4>
                        {table.section && (
                          <span className="rounded-full bg-black/25 text-white text-[10px] font-bold px-2 py-0.5 border border-white/10">
                            {table.section}
                          </span>
                        )}
                      </div>

                      {tableElapsed ? (
                        <span className="text-[11px] font-mono font-bold bg-black/25 px-2 py-0.5 rounded-full border border-white/10">
                          {tableElapsed}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
                          Boş
                        </span>
                      )}
                    </div>

                    {/* Middle: Adisyon & Ürün Info */}
                    <div className="flex items-center justify-between text-xs font-semibold text-white/90 py-1 mb-2">
                      <span className="inline-flex items-center gap-1">
                        <FileTextIcon className="size-3.5 opacity-80" />
                        <span>{tableOrders.length} Adisyon</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <PackageIcon className="size-3.5 opacity-80" />
                        <span>{itemsCount} Ürün</span>
                      </span>
                    </div>

                    {/* Footer: Masa Tutarı */}
                    <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                      <span className="text-[11px] text-white/80 font-medium">
                        Masa Tutarı
                      </span>
                      <span className="text-base font-black tabular-nums">
                        {formatCurrency(totalAmt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FIXED TABLE ACTION WORKBENCH & ADİSYON KALEMLERİ (5 cols on desktop, sticky) */}
        <div
          className={cn(
            "w-full flex flex-col gap-4",
            "lg:col-span-5 lg:sticky lg:top-4",
            mobileTab === "TABLES" && "hidden lg:flex",
          )}
        >
          {activeTable ? (
            <div className="w-full rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl overflow-hidden flex flex-col">
              {/* Active Table Header Banner */}
              <div className="p-4 sm:px-5 sm:py-4 border-b border-border/70 bg-muted/25 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      {activeTable.label}
                    </h3>
                    {activeTable.section && (
                      <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold">
                        {activeTable.section}
                      </span>
                    )}
                    {activeTable.seats && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <UsersIcon className="size-3" />
                        <span>{activeTable.seats}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {isOccupied ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                        <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>Dolu ({activeItemCount} Ürün)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span>Masa Müsait</span>
                      </span>
                    )}
                    {elapsed && (
                      <span className="inline-flex items-center gap-1 font-bold tabular-nums text-muted-foreground">
                        <ClockIcon className="size-3" />
                        <span>{elapsed}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Total amount on right */}
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">
                    Toplam
                  </span>
                  <span className="text-xl font-black text-foreground tabular-nums">
                    {formatCurrency(activeTotal)}
                  </span>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-3.5 sm:px-5 sm:py-3.5 border-b border-border/60 bg-muted/10 flex flex-col gap-2.5">
                {/* Kitchen Deliver Button */}
                {isDeliverable && onDeliverTable ? (
                  <button
                    type="button"
                    onClick={() => onDeliverTable(activeTable.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <CheckCircle2Icon className="size-4.5 shrink-0" />
                    <span>
                      {canDeliverPackaged && hasCooking
                        ? "Paketli Ürünleri Teslim Et"
                        : "Hazır Siparişleri Teslim Et"}
                    </span>
                  </button>
                ) : isOnlyPreparing ? (
                  <div className="flex items-center justify-between rounded-xl px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <ChefHatIcon className="size-4 text-orange-500 animate-pulse" />
                      <span>Mutfakta Hazırlanıyor</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-500/20">
                      Mutfak
                    </span>
                  </div>
                ) : null}

                {/* Primary Action Buttons Row */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAddProduct(activeTable, activeOrders)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl h-11 px-4 text-xs sm:text-sm font-black transition-all active:scale-[0.98] cursor-pointer shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <PlusCircleIcon className="size-4.5 shrink-0" />
                    <span>{isOccupied ? "Ürün Ekle" : "+ Sipariş Başlat"}</span>
                  </button>

                  {isOccupied && (
                    <button
                      type="button"
                      onClick={() => onSettleBill(activeTable, activeOrders)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl h-11 px-4 text-xs sm:text-sm font-black transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
                    >
                      <CreditCardIcon className="size-4.5 shrink-0" />
                      <span>Hesap Al</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onPrintBill(activeTable, activeOrders)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer shadow-xs"
                    title="Fiş / Adisyon Yazdır"
                  >
                    <PrinterIcon className="size-4.5 text-primary" />
                  </button>
                </div>
              </div>

              {/* Order Lines List (Adisyon Kalemleri) */}
              <div className="p-3.5 sm:px-5 sm:py-3.5 flex flex-col gap-2 max-h-[320px] overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                  <span className="flex items-center gap-1.5">
                    <UtensilsCrossedIcon className="size-3" />
                    <span>Adisyon Kalemleri</span>
                  </span>
                  {isOccupied && <span>{activeLines.length} Kalem</span>}
                </div>

                {isOccupied ? (
                  <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/80 bg-muted/15 overflow-hidden">
                    {activeLines.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-start justify-between gap-2 p-2.5 text-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="size-5.5 rounded-md bg-foreground/10 text-foreground flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                            {line.quantity}×
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate leading-tight">
                              {line.name}
                            </span>
                            {line.variantName && (
                              <span className="text-[11px] text-muted-foreground">
                                {line.variantName}
                              </span>
                            )}
                            {line.modifiers && line.modifiers.length > 0 && (
                              <span className="text-[10px] text-muted-foreground/80">
                                {line.modifiers.map((m) => m.name).join(", ")}
                              </span>
                            )}
                            {line.lineNote && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                &ldquo;{line.lineNote}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-0.5">
                          <span className="font-black text-foreground tabular-nums text-xs">
                            {formatCurrency(line.unitPrice * line.quantity)}
                          </span>
                          {line.state === "SERVED" ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                              Teslim
                            </span>
                          ) : line.state === "PREPARED" ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Hazır
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400">
                              Mutfakta
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/10 my-auto">
                    <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                      <SparklesIcon className="size-5" />
                    </div>
                    <p className="font-extrabold text-foreground text-xs">Masa Boş</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                      Sipariş girmek için &quot;+ Sipariş Başlat&quot; butonuna dokunun.
                    </p>
                  </div>
                )}
              </div>

              {/* Management 4-Button Grid in Footer */}
              <div className="p-3 sm:px-5 sm:py-3 border-t border-border/80 bg-card">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={!isOccupied}
                    onClick={() => onTransferTable(activeTable)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground shadow-2xs"
                    title="Masayı Taşı"
                  >
                    <ArrowRightLeftIcon className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="truncate">Taşı</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isOccupied}
                    onClick={() => onMergeTable(activeTable)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-foreground shadow-2xs"
                    title="Masaları Birleştir"
                  >
                    <MergeIcon className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="truncate">Birleştir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewDetails(activeTable, activeOrders)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold border border-border/80 bg-muted/20 hover:bg-muted transition-all active:scale-[0.97] cursor-pointer text-foreground shadow-2xs"
                    title="Adisyon Detayı"
                  >
                    <ReceiptIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="truncate">Detay</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isOccupied}
                    onClick={() => onVoidTable(activeTable)}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-bold border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                    title="Masayı Boşalt"
                  >
                    <Trash2Icon className="size-4 shrink-0" />
                    <span className="truncate">Boşalt</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
