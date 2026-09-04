"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  ArmchairIcon,
  BookOpenIcon,
  BoxesIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  FileSpreadsheetIcon,
  LockIcon,
  QrCodeIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StoreIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface SystemStats {
  readonly tableCount: number;
  readonly staffCount: number;
  readonly lowStockCount: number;
  readonly menuItemCount?: number;
  readonly categoryCount?: number;
  readonly isDayClosed: boolean;
  readonly zNumberFormatted: string | null;
  readonly restaurantName: string;
}

export function SystemHub({
  stats,
  allowedRoutes,
}: {
  readonly stats: SystemStats;
  readonly allowedRoutes?: readonly string[] | null;
}) {
  const SYSTEM_CARDS = [
    {
      title: "Menü Yönetimi",
      description: "Ürünler, kategoriler, porsiyonlar, ekstralar ve fiyat listesi",
      href: "/dashboard/menu",
      icon: BookOpenIcon,
      iconBg: "bg-teal-50 text-teal-600 border border-teal-200",
      tag:
        typeof stats.menuItemCount === "number"
          ? `${stats.menuItemCount} Ürün`
          : "Ürün & Kategori",
      tagColor: "bg-teal-100/80 text-teal-800 border-teal-200",
      secondaryIcon: UtensilsIcon,
    },
    {
      title: "Masa ve QR Yönetimi",
      description: "Salon planı, masa numaraları, yerleşim ve masa QR karekodları",
      href: "/dashboard/tables",
      icon: ArmchairIcon,
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
      tag: `${stats.tableCount} Masa`,
      tagColor: "bg-amber-100/80 text-amber-800 border-amber-200",
      secondaryIcon: QrCodeIcon,
    },
    {
      title: "Personel",
      description: "Ekip üyeleri, giriş PIN'leri, roller ve ekran erişim yetkileri",
      href: "/dashboard/staff",
      icon: UsersIcon,
      iconBg: "bg-orange-50 text-orange-600 border border-orange-200",
      tag: `${stats.staffCount} Çalışan`,
      tagColor: "bg-orange-100/80 text-orange-800 border-orange-200",
      secondaryIcon: ShieldCheckIcon,
    },
    {
      title: "Stok & Envanter",
      description: "Hammadde ve ürün stokları, kritik stok uyarıları, giriş ve çıkışlar",
      href: "/dashboard/inventory",
      icon: BoxesIcon,
      iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-200",
      tag: stats.lowStockCount > 0 ? `${stats.lowStockCount} Kritik Stok` : "Stoklar İyi",
      tagColor:
        stats.lowStockCount > 0
          ? "bg-rose-100 text-rose-800 border-rose-200"
          : "bg-emerald-100 text-emerald-800 border-emerald-200",
      secondaryIcon: AlertTriangleIcon,
    },
    {
      title: "Yapay Zeka Stüdyosu",
      description: "AI menü fotoğraf geliştirme, ürün açıklamaları ve görsel stüdyosu",
      href: "/dashboard/ai-studio",
      icon: SparklesIcon,
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
      tag: "AI Studio",
      tagColor: "bg-amber-100/80 text-amber-800 border-amber-200",
      secondaryIcon: SparklesIcon,
    },
    {
      title: "Restoran Ayarları",
      description: "İşletme adı, logo, iletişim, çalışma saatleri ve sistem parametreleri",
      href: "/dashboard/settings",
      icon: Settings2Icon,
      iconBg: "bg-gray-100 text-gray-700 border border-gray-200",
      tag: "Yapılandırma",
      tagColor: "bg-gray-100 text-gray-700 border-gray-200",
      secondaryIcon: StoreIcon,
    },
  ];

  // Filtreleme (personel yetkilerine göre)
  const visibleCards = SYSTEM_CARDS.filter((card) => {
    if (!allowedRoutes || allowedRoutes.length === 0) return true;
    return allowedRoutes.includes(card.href);
  });

  const canAccessZReport =
    !allowedRoutes || allowedRoutes.length === 0 || allowedRoutes.includes("/dashboard/z-report");

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full bg-[#fafafa] min-h-[calc(100vh-3.5rem)]">
      {/* 1. ÜST HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200 text-gray-800 shadow-2xs">
            <SlidersHorizontalIcon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Sistem
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Yönetim Merkezi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              Restoranınızın alt yapı, menü, masa, personel, stok ve muhasebe ayarlarını tek noktadan yönetin.
            </p>
          </div>
        </div>
      </header>

      {/* 2. SİSTEM AYARLARI BÖLÜMÜ (STANDART 6'LI GRID) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <SparklesIcon className="size-4.5 text-primary" />
              <span>Sistem Ayarları</span>
            </h2>
            <p className="text-xs text-gray-500">
              Operasyonel ve yapılandırma süreçlerini optimize eden ana yönetim modülleri
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {visibleCards.length + (canAccessZReport ? 1 : 0)} Modül
          </span>
        </div>

        {/* KARTLAR GRID'İ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {visibleCards.map((card, idx) => {
            const Icon = card.icon;
            const SecondaryIcon = card.secondaryIcon;

            return (
              <Link
                key={card.href}
                href={card.href}
                prefetch={true}
                className={cn(
                  "group relative flex flex-col justify-between p-5 rounded-2xl border border-gray-200 bg-white shadow-xs",
                  "hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                  "active:scale-[0.98] min-h-[175px]",
                )}
                style={{
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                {/* Üst Kısım: İkon + Rozet + Yön Oku */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-xl shadow-2xs group-hover:scale-105 transition-transform",
                        card.iconBg,
                      )}
                    >
                      <Icon className="size-6" />
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs",
                        card.tagColor,
                      )}
                    >
                      <SecondaryIcon className="size-3" />
                      <span>{card.tag}</span>
                    </span>
                  </div>

                  <span className="flex size-7 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-colors">
                    <ChevronRightIcon className="size-4" />
                  </span>
                </div>

                {/* Orta & Alt Kısım: Başlık ve Açıklama */}
                <div className="mt-4">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>{card.title}</span>
                  </h3>
                  <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 3. EN SONDA: ÖZEL VE FARKLI BİÇİMDE Z RAPORU KARTI */}
        {canAccessZReport && (
          <div className="mt-3">
            <Link
              href="/dashboard/z-report"
              prefetch={true}
              className={cn(
                "group relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-7 rounded-3xl",
                "border-2 border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 shadow-xs",
                "hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
                "active:scale-[0.99] overflow-hidden",
              )}
            >
              {/* Arka plan yumuşak halo */}
              <div className="pointer-events-none absolute right-0 top-0 translate-x-12 -translate-y-12 size-64 rounded-full bg-emerald-500/10 blur-3xl" />

              {/* Sol: Büyük İkon + Başlık + Detaylar */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 z-10">
                <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 group-hover:bg-emerald-700 transition-all shrink-0">
                  <FileSpreadsheetIcon className="size-7 sm:size-8" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                      Z Raporu & Gün Sonu Kapanışı
                    </h3>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80 uppercase tracking-wider">
                      Mali Muhasebe & Kasa
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                    Günlük kasa mutabakatı, POS slip denkleştirmesi, açık adisyon denetimi ve dondurulmuş mali rapor arşivi.
                  </p>

                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs",
                        stats.isDayClosed
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200",
                      )}
                    >
                      {stats.isDayClosed ? (
                        <LockIcon className="size-3.5 text-gray-300" />
                      ) : (
                        <span className="relative flex size-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full size-2 bg-emerald-600" />
                        </span>
                      )}
                      <span>
                        {stats.isDayClosed
                          ? `${stats.zNumberFormatted || "Gün Kapandı"} · Arşivlendi`
                          : "Bugünün Kasası Açık (Aktif Satışlar Devam Ediyor)"}
                      </span>
                    </span>

                    <span className="text-xs font-semibold text-gray-500 hidden sm:inline-flex items-center gap-1">
                      <ReceiptTextIcon className="size-3.5 text-gray-400" />
                      <span>Resmi Mali Snapshot</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Sağ: Aksiyon Butonu */}
              <div className="flex items-center gap-3 z-10 shrink-0 self-end lg:self-auto">
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white group-hover:bg-emerald-700 text-xs sm:text-sm font-black shadow-sm group-hover:shadow-md transition-all">
                  <span>Z Raporunu Aç</span>
                  <span className="text-base font-bold transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
