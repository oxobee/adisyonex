"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArmchairIcon,
  BookOpenIcon,
  BoxesIcon,
  CalculatorIcon,
  ChefHatIcon,
  FileSpreadsheetIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LogInIcon,
  PaletteIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  UtensilsCrossedIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

interface HomeItem {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly iconBg: string;
  readonly badge: string;
}

const HOME_ITEMS: readonly HomeItem[] = [
  {
    title: "Masalar",
    description: "Masalar & Açık Adisyonlar",
    href: "/dashboard/orders",
    icon: ReceiptTextIcon,
    iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
    badge: "01",
  },
  {
    title: "Mutfak",
    description: "KOT & Hazırlık Takibi",
    href: "/dashboard/kitchen",
    icon: ChefHatIcon,
    iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
    badge: "02",
  },
  {
    title: "POS / Kasa",
    description: "Hızlı Sipariş & Tahsilat",
    href: "/dashboard/pos",
    icon: CalculatorIcon,
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    badge: "03",
  },
  {
    title: "Analitik",
    description: "Satış & Günlük Raporlar",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    iconBg: "bg-purple-50 text-purple-600 border border-purple-100",
    badge: "04",
  },
  {
    title: "Müşteriler",
    description: "Sadakat & Kampanyalar",
    href: "/dashboard/customers",
    icon: GiftIcon,
    iconBg: "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100",
    badge: "05",
  },
  {
    title: "Sistem",
    description: "Menü, Masa & QR, Personel, Stok, Z Raporu",
    href: "/dashboard/system",
    icon: SlidersHorizontalIcon,
    iconBg: "bg-gray-100 text-gray-800 border border-gray-200",
    badge: "06",
  },
];

export function HomeScreen({
  settings,
  isAdmin = false,
  isStaff = false,
  staffRole,
  allowedRoutes,
  restaurantUsername,
}: {
  readonly settings: Partial<SystemSettingsDTO>;
  readonly isAdmin?: boolean;
  readonly isStaff?: boolean;
  readonly staffRole?: string;
  readonly allowedRoutes?: readonly string[] | null;
  readonly restaurantUsername: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Personel yetkilerine göre sadece yetkili olunan menüleri filtrele
  const visibleItems = useMemo(() => {
    if (!isStaff || !allowedRoutes) return HOME_ITEMS;
    const systemSubRoutes = [
      "/dashboard/menu",
      "/dashboard/menu-design",
      "/dashboard/tables",
      "/dashboard/staff",
      "/dashboard/inventory",
      "/dashboard/z-report",
      "/dashboard/settings",
      "/dashboard/system",
    ];
    const hasSystemAccess = systemSubRoutes.some((r) => allowedRoutes.includes(r));

    const filtered = HOME_ITEMS.filter((item) => {
      if (item.href === "/dashboard/system") {
        return hasSystemAccess;
      }
      return allowedRoutes.includes(item.href);
    });
    return filtered.length > 0 ? filtered : HOME_ITEMS;
  }, [isStaff, allowedRoutes]);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time network connectivity detector
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 1-minute inactivity timeout: if screen is untouched for 60s while open, return to logo
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (isOpen) {
        inactivityTimerRef.current = setTimeout(() => {
          setIsOpen(false);
        }, 60000);
      }
    };

    if (isOpen) {
      resetTimer();
      const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
      events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

      return () => {
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div
      onClick={() => {
        if (!isOpen) {
          setIsOpen(true);
        }
      }}
      className={cn(
        "relative min-h-[calc(100vh-3.5rem)] w-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-300",
        !isOpen ? "cursor-pointer" : "cursor-default",
        "bg-[#fafafa] text-gray-900",
      )}
    >
      <style jsx global>{`
        @keyframes gentleHeartbeat {
          0%, 100% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.035);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.02);
          }
          70% {
            transform: scale(1);
          }
        }
        .animate-heartbeat {
          animation: gentleHeartbeat 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* 
        UNTITLED UI AMBIENT LIGHT BACKGROUND:
        Subtle light grid & soft aura behind center
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] sm:size-[850px] rounded-full blur-[140px] opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(245, 158, 11, 0.05) 45%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      </div>

      {/* 
        TOP BAR:
        Staff / Admin Shortcuts on Right (Sadece yöneticilerde)
      */}
      <div
        className="relative z-30 flex items-center justify-end px-4 sm:px-6 lg:px-8 py-4"
        onClick={(e) => {
          if (!isOpen) {
            e.stopPropagation();
          }
        }}
      >
        {/* Top Right Shortcuts - Yalnızca Yönetici / Admin modunda görünür, personel ekranında gizlenir */}
        {!isStaff && (
          <div className="flex items-center gap-2.5">
            {restaurantUsername && (
              <Link
                href={`/${restaurantUsername}/personals`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-2xs transition-all"
              >
                <LogInIcon className="size-3.5 text-gray-500" />
                <span>Personel Girişi</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/80 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-all shadow-2xs"
              >
                <ShieldCheckIcon className="size-3.5 text-amber-600" />
                <span>Yönetici</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 
        MAIN STAGE:
        1. KAPALIYKEN:
           - Ekranda yalnızca tam ortalanmış zarif marka logosu ve yanındaki/altındaki şık Online rozeti
           - Tıklandığında menü açılır
        2. AÇIKKEN:
           - Sol üstte Kompakt Logo + Online rozeti
           - Untitled UI beyaz tema modül kartları
           - Sağ üstte net '✕ KAPAT' butonu
      */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto my-auto">
        {!isOpen ? (
          /* ============================================================ */
          /* KAPALI DURUM: SADECE MERKEZİ LOGO + ZARİF ONLINE ROZETİ      */
          /* ============================================================ */
          <div className="flex flex-col items-center justify-center text-center my-auto cursor-pointer group py-12">
            <div className="relative transform-gpu transition-transform duration-500 group-hover:scale-105 select-none flex flex-col items-center">
              {settings.logoUrl || settings.logoDarkUrl ? (
                <div className="relative h-24 sm:h-32 lg:h-36 w-72 sm:w-96 lg:w-[480px] animate-heartbeat">
                  <Image
                    src={settings.logoUrl || settings.logoDarkUrl || ""}
                    alt={settings.systemName || "Adisyon"}
                    fill
                    className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                    priority
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 animate-heartbeat">
                  <div className="flex size-24 sm:size-28 items-center justify-center rounded-3xl bg-white border border-gray-200 shadow-md text-primary">
                    <UtensilsCrossedIcon className="size-12 sm:size-14" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
                    {settings.systemName || "Adisyon"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* AÇIK DURUM: UNTITLED UI BEYAZ TEMA KARTLAR + SAĞ ÜST 'KAPAT' */
          /* ============================================================ */
          <div className="w-full flex flex-col my-auto pt-2 sm:pt-4 animate-in fade-in zoom-in-98 duration-300">
            {/* Üst Bar: Sol Logo + Sağ Kapat Butonu */}
            <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 px-1">
              {/* Sol: Kompakt Logo */}
              <div className="flex items-center gap-3">
                {settings.logoUrl || settings.logoDarkUrl ? (
                  <div className="relative h-8 sm:h-9 w-32 sm:w-40">
                    <Image
                      src={settings.logoUrl || settings.logoDarkUrl || ""}
                      alt="Logo"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                ) : (
                  <span className="text-lg font-black tracking-tight text-gray-900">
                    {settings.systemName || "Adisyon"}
                  </span>
                )}
              </div>

              {/* Sağ: Untitled UI Kapat Butonu */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="group relative inline-flex items-center justify-center gap-2 px-5 sm:px-6 h-10 sm:h-11 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-150 cursor-pointer outline-none select-none active:scale-95 shadow-xs bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                title="Menüyü Kapat ve Logoya Dön"
              >
                <span className="text-red-600 font-black text-sm">✕</span>
                <span>KAPAT</span>
              </button>
            </div>

            {/* Menü Kartları: Yetkili butonlar ortalı ve düzgün bir biçimde */}
            <div
              className={cn(
                "w-full pb-10 transition-all duration-300",
                visibleItems.length <= 4
                  ? "flex flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-4xl mx-auto my-auto"
                  : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-4.5 justify-center",
              )}
            >
              {visibleItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.href}
                    className={cn(
                      "relative animate-in fade-in zoom-in-90 slide-in-from-bottom-5 duration-450 fill-mode-both",
                      visibleItems.length <= 4
                        ? "w-[calc(50%-0.6rem)] sm:w-[220px] md:w-[250px]"
                        : "w-full",
                    )}
                    style={{
                      animationDelay: `${index * 25}ms`,
                      animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    {/* UNTITLED UI BEYAZ TEMA KART */}
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "group relative flex flex-col justify-between w-full cursor-pointer select-none",
                        "min-h-[145px] sm:min-h-[155px] lg:min-h-[165px]",
                        "rounded-2xl p-4 sm:p-5",
                        "bg-white border border-gray-200 shadow-xs",
                        "hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5",
                        "active:scale-[0.98] transition-all duration-150",
                      )}
                    >
                      {/* Top Row: Rozet Numarası & Yön Oku */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-bold text-gray-600">
                          {item.badge}
                        </span>
                        <span className="flex size-7 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all duration-150">
                          <span className="text-xs font-bold">↗</span>
                        </span>
                      </div>

                      {/* Center: Untitled UI Style Icon Squircle */}
                      <div className="relative z-10 flex items-center justify-start my-2.5">
                        <div
                          className={cn(
                            "flex size-12 sm:size-13 items-center justify-center rounded-xl shadow-2xs transition-all duration-150 group-hover:scale-105",
                            item.iconBg,
                          )}
                        >
                          <Icon className="size-6 stroke-[2]" />
                        </div>
                      </div>

                      {/* Bottom: Temiz ve Net Başlık & Açıklama */}
                      <div className="relative z-10 w-full text-left">
                        <span className="block text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </span>
                        <span className="block text-xs font-medium text-gray-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="relative z-20 flex items-center justify-center p-4">
        <span className="text-xs font-medium text-gray-400">
          {settings.systemName || "AdisyonEx"} Restoran Bulut Sistemi
        </span>
      </footer>
    </div>
  );
}
