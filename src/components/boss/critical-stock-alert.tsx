"use client";

import { PackageIcon, CaretRightIcon } from "@/components/ui/icons";

interface CriticalStockAlertProps {
  count: number;
  itemsSummary: string;
  onViewClick?: () => void;
}

export function CriticalStockAlert({
  count,
  itemsSummary,
  onViewClick,
}: CriticalStockAlertProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-amber-200/90 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 p-3.5 sm:p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
          <PackageIcon size={22} weight="duotone" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900">
            {count} Ürün Kritik Seviyede
          </h3>
          <p className="text-[11px] font-medium text-slate-600 truncate max-w-[180px] sm:max-w-xs">
            {itemsSummary}
          </p>
        </div>
      </div>

      <button
        onClick={onViewClick}
        className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
      >
        Görüntüle
      </button>
    </div>
  );
}
