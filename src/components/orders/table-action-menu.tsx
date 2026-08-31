"use client";

import {
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  MergeIcon,
  PlusCircleIcon,
  PrinterIcon,
  ReceiptIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

export interface TableActionMenuProps {
  table: TableDTO;
  orders: readonly OrderDTO[];
  onClose: () => void;
  onPrintBill: () => void;
  onAddProduct: () => void;
  onSettleBill: () => void;
  onTransferTable: () => void;
  onMergeTable: () => void;
  onViewDetails: () => void;
  onVoidTable: () => void;
}

export function TableActionMenu({
  table,
  orders,
  onClose,
  onPrintBill,
  onAddProduct,
  onSettleBill,
  onTransferTable,
  onMergeTable,
  onViewDetails,
  onVoidTable,
}: TableActionMenuProps) {
  const isOccupied = orders.length > 0;

  return (
    <div className="flex w-full sm:w-80 flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl animate-in zoom-in-95 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 p-4 bg-muted/30">
        <div>
          <h3 className="font-black text-base text-foreground leading-tight">
            {table.label}
          </h3>
          <span className="text-xs text-muted-foreground">
            {isOccupied ? `${orders.length} Açık Adisyon` : "Masa Boş / Müsait"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Action Buttons List */}
      <div className="flex flex-col p-2 gap-1 text-sm font-semibold">
        {/* 1. Print Bill */}
        <button
          type="button"
          disabled={!isOccupied}
          onClick={onPrintBill}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-muted active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PrinterIcon className="size-4.5" />
          </div>
          <span>Fiş / Adisyon Çıkar</span>
        </button>

        {/* 2. Add Product */}
        <button
          type="button"
          onClick={onAddProduct}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-muted active:scale-[0.98] cursor-pointer text-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <PlusCircleIcon className="size-4.5" />
          </div>
          <span>Ürün Ekle</span>
        </button>

        {/* 3. Settle Bill (Hesap Kapat) */}
        <button
          type="button"
          disabled={!isOccupied}
          onClick={onSettleBill}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-muted active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CreditCardIcon className="size-4.5" />
          </div>
          <span>Hesap Al / Kapat</span>
        </button>

        {/* 4. Transfer Table (Masa Değişim) */}
        <button
          type="button"
          disabled={!isOccupied}
          onClick={onTransferTable}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-muted active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <ArrowRightLeftIcon className="size-4.5" />
          </div>
          <span>Masayı Taşı (Değişim)</span>
        </button>

        {/* 5. Merge Tables (Masa Birleştir) */}
        <button
          type="button"
          disabled={!isOccupied}
          onClick={onMergeTable}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-muted active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <MergeIcon className="size-4.5" />
          </div>
          <span>Masayı Birleştir</span>
        </button>

        {/* 6. View Details */}
        <button
          type="button"
          disabled={!isOccupied}
          onClick={onViewDetails}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-muted active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ReceiptIcon className="size-4.5" />
          </div>
          <span>Masa Detayı & Adisyon</span>
        </button>

        {/* 7. Void / Clear Table */}
        {isOccupied && (
          <button
            type="button"
            onClick={onVoidTable}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-destructive/10 active:scale-[0.98] cursor-pointer text-destructive"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2Icon className="size-4.5" />
            </div>
            <span>Masayı İptal Et / Boşalt</span>
          </button>
        )}

        <div className="my-1 border-t border-border/60" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center rounded-2xl py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Pencereyi Kapat
        </button>
      </div>
    </div>
  );
}
