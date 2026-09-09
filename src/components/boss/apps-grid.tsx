"use client";

import Link from "next/link";
import {
  ReceiptIcon,
  UsersIcon,
  CookingPotIcon,
  ChartLineUpIcon,
  QrCodeIcon,
  ClipboardTextIcon,
  CaretRightIcon,
} from "@/components/ui/icons";

interface AppItem {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  badgeType?: "green" | "orange" | "neutral";
  subtext: string;
  href?: string;
}

interface AppsGridProps {
  apps?: AppItem[];
  onOpenAll?: () => void;
}

const defaultApps: AppItem[] = [
  {
    id: "pos",
    name: "Kasa POS",
    icon: "pos",
    badge: "2 Aktif",
    badgeType: "green",
    subtext: "2 Aktif",
    href: "/dashboard/pos",
  },
  {
    id: "waiter",
    name: "Garson",
    icon: "waiter",
    badge: "8 Çevrimiçi",
    badgeType: "green",
    subtext: "8 Çevrimiçi",
    href: "/personel-giris",
  },
  {
    id: "kds",
    name: "Mutfak KDS",
    icon: "kds",
    badge: "İstasyon: 3",
    badgeType: "green",
    subtext: "İstasyon: 3",
    href: "/dashboard/kitchen",
  },
  {
    id: "reports",
    name: "Raporlar",
    icon: "reports",
    badge: "Canlı",
    badgeType: "neutral",
    subtext: "Canlı Analiz",
    href: "/dashboard/z-report",
  },
  {
    id: "menu_qr",
    name: "Menü & QR",
    icon: "qr",
    badge: "420 Hit",
    badgeType: "neutral",
    subtext: "420 Hit",
    href: "/dashboard/menu-design",
  },
  {
    id: "inventory",
    name: "Stok Takip",
    icon: "stock",
    badge: "Sayım",
    badgeType: "orange",
    subtext: "Sayım Günü",
    href: "/dashboard/inventory",
  },
];

export function AppsGrid({ apps = defaultApps, onOpenAll }: AppsGridProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "pos":
        return <ReceiptIcon size={22} weight="duotone" className="text-indigo-600" />;
      case "waiter":
        return <UsersIcon size={22} weight="duotone" className="text-emerald-600" />;
      case "kds":
        return <CookingPotIcon size={22} weight="duotone" className="text-amber-600" />;
      case "reports":
        return <ChartLineUpIcon size={22} weight="duotone" className="text-purple-600" />;
      case "qr":
        return <QrCodeIcon size={22} weight="duotone" className="text-blue-600" />;
      case "stock":
        return <ClipboardTextIcon size={22} weight="duotone" className="text-rose-600" />;
      default:
        return <ReceiptIcon size={22} weight="duotone" className="text-indigo-600" />;
    }
  };

  return (
    <section className="space-y-3">
      {/* Başlık ve Link */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-900">
          İşletme Uygulamaları
        </h2>
        <button
          onClick={onOpenAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          Tümünü Aç
        </button>
      </div>

      {/* 3 x 2 Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {apps.map((app) => (
          <Link
            key={app.id}
            href={app.href || "#"}
            className="group relative flex flex-col items-center justify-center rounded-[20px] border border-slate-200/80 bg-white p-3.5 text-center shadow-sm transition hover:border-indigo-300 hover:shadow-md active:scale-95"
          >
            {/* Sağ Üst Durum Noktası */}
            <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  app.badgeType === "orange"
                    ? "bg-amber-500"
                    : app.badgeType === "neutral"
                    ? "bg-slate-300"
                    : "bg-emerald-500"
                }`}
              />
            </span>

            {/* İkon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 transition group-hover:scale-110">
              {getIcon(app.icon)}
            </div>

            {/* Başlık */}
            <div className="mt-2 text-xs font-bold text-slate-900 group-hover:text-indigo-600">
              {app.name}
            </div>

            {/* Alt Bilgi */}
            <div
              className={`mt-0.5 text-[10px] font-semibold ${
                app.badgeType === "orange"
                  ? "text-amber-600"
                  : "text-slate-400"
              }`}
            >
              {app.subtext}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
