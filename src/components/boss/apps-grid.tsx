"use client";

import Link from "next/link";
import {
  ReceiptIcon,
  UsersIcon,
  CookingPotIcon,
  ChartLineUpIcon,
  QrCodeIcon,
  ClipboardTextIcon,
  SparkleIcon,
  ArmchairIcon,
} from "@/components/ui/icons";

export interface ActiveModuleItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  subtext?: string;
  statusBadge?: string;
  href?: string;
}

interface AppsGridProps {
  modules: ActiveModuleItem[];
  allModulesCount?: number;
}

export function AppsGrid({ modules, allModulesCount }: AppsGridProps) {
  // İlk 6 kart
  const displayModules = modules.slice(0, 6);

  const getModuleIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case "pos":
      case "cashier":
        return <ReceiptIcon size={22} weight="duotone" className="text-indigo-600" />;
      case "waiter":
      case "staff":
        return <UsersIcon size={22} weight="duotone" className="text-emerald-600" />;
      case "kitchen":
      case "kds":
        return <CookingPotIcon size={22} weight="duotone" className="text-amber-600" />;
      case "reports":
      case "analytics":
        return <ChartLineUpIcon size={22} weight="duotone" className="text-purple-600" />;
      case "menu":
      case "qr":
        return <QrCodeIcon size={22} weight="duotone" className="text-blue-600" />;
      case "inventory":
      case "stock":
        return <ClipboardTextIcon size={22} weight="duotone" className="text-rose-600" />;
      case "tables":
        return <ArmchairIcon size={22} weight="duotone" className="text-teal-600" />;
      default:
        return <SparkleIcon size={22} weight="duotone" className="text-indigo-600" />;
    }
  };

  return (
    <section className="space-y-3">
      {/* Başlık ve Tümünü Gör Linki */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-900">
          İşletme Uygulamaları
        </h2>
        <Link
          href="/appstore"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          Tümünü Gör
        </Link>
      </div>

      {/* 3 x 2 Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {displayModules.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href || "/appstore"}
            className="group relative flex flex-col items-center justify-center rounded-[20px] border border-slate-200/80 bg-white p-3.5 text-center shadow-sm transition hover:border-indigo-300 hover:shadow-md active:scale-95"
          >
            {/* Sağ Üst Yeşil Aktif Durum Noktası */}
            <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </span>

            {/* İkon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 transition group-hover:scale-110">
              {getModuleIcon(mod.key)}
            </div>

            {/* Başlık */}
            <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate max-w-full">
              {mod.name}
            </div>

            {/* Alt Bilgi / Durum */}
            <div className="mt-0.5 text-[10px] font-semibold text-slate-400 truncate max-w-full">
              {mod.subtext || "Aktif"}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
