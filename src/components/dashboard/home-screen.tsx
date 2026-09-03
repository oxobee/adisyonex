"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArmchairIcon,
  BookOpenIcon,
  BoxesIcon,
  CalculatorIcon,
  ChefHatIcon,
  CircleHelpIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LogInIcon,
  PaletteIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

interface HomeItem {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly gradient: string;
  readonly glowColor: string;
  readonly badge: string;
}

const HOME_ITEMS: readonly HomeItem[] = [
  {
    title: "Anlık Durum",
    description: "Masalar & Açık Adisyonlar",
    href: "/dashboard/orders",
    icon: ReceiptTextIcon,
    gradient: "from-amber-500/35 via-orange-600/25 to-red-700/35",
    glowColor: "rgba(245, 158, 11, 0.4)",
    badge: "01",
  },
  {
    title: "Mutfak Ekranı",
    description: "KOT & Hazırlık Takibi",
    href: "/dashboard/kitchen",
    icon: ChefHatIcon,
    gradient: "from-emerald-500/35 via-teal-600/25 to-cyan-700/35",
    glowColor: "rgba(16, 185, 129, 0.4)",
    badge: "02",
  },
  {
    title: "POS / Kasa",
    description: "Hızlı Sipariş & Tahsilat",
    href: "/dashboard/pos",
    icon: CalculatorIcon,
    gradient: "from-sky-500/35 via-blue-600/25 to-indigo-700/35",
    glowColor: "rgba(14, 165, 233, 0.4)",
    badge: "03",
  },
  {
    title: "Genel Bakış",
    description: "Satış & Günlük Raporlar",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    gradient: "from-violet-500/35 via-purple-600/25 to-fuchsia-700/35",
    glowColor: "rgba(139, 92, 246, 0.4)",
    badge: "04",
  },
  {
    title: "Menü Yönetimi",
    description: "Ürün & Kategori Listesi",
    href: "/dashboard/menu",
    icon: BookOpenIcon,
    gradient: "from-teal-500/35 via-cyan-600/25 to-emerald-700/35",
    glowColor: "rgba(20, 184, 166, 0.4)",
    badge: "05",
  },
  {
    title: "Menü Tasarım",
    description: "QR Menüyü Özelleştir",
    href: "/dashboard/menu-design",
    icon: PaletteIcon,
    gradient: "from-pink-500/35 via-rose-600/25 to-red-700/35",
    glowColor: "rgba(236, 72, 153, 0.4)",
    badge: "06",
  },
  {
    title: "Masalar",
    description: "Salon & Masa Yerleşimi",
    href: "/dashboard/tables",
    icon: ArmchairIcon,
    gradient: "from-rose-500/35 via-red-600/25 to-orange-700/35",
    glowColor: "rgba(244, 63, 94, 0.4)",
    badge: "07",
  },
  {
    title: "Personel",
    description: "Ekip & Giriş PIN'leri",
    href: "/dashboard/staff",
    icon: UsersIcon,
    gradient: "from-orange-500/35 via-amber-600/25 to-yellow-700/35",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badge: "08",
  },
  {
    title: "Stok & Envanter",
    description: "Kritik Stok & Giriş-Çıkış",
    href: "/dashboard/inventory",
    icon: BoxesIcon,
    gradient: "from-slate-500/35 via-zinc-600/25 to-stone-700/35",
    glowColor: "rgba(100, 116, 139, 0.4)",
    badge: "09",
  },
  {
    title: "Müşteriler",
    description: "Sadakat & Kampanyalar",
    href: "/dashboard/customers",
    icon: GiftIcon,
    gradient: "from-fuchsia-500/35 via-pink-600/25 to-rose-700/35",
    glowColor: "rgba(217, 70, 239, 0.4)",
    badge: "10",
  },
  {
    title: "Ayarlar",
    description: "Restoran & Sistem Profili",
    href: "/dashboard/settings",
    icon: Settings2Icon,
    gradient: "from-zinc-500/35 via-neutral-600/25 to-stone-700/35",
    glowColor: "rgba(113, 113, 122, 0.4)",
    badge: "11",
  },
];

export function HomeScreen({
  settings,
  isAdmin,
  restaurantUsername,
}: {
  readonly settings: SystemSettingsDTO;
  readonly isAdmin: boolean;
  readonly restaurantUsername: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] w-full overflow-x-hidden bg-gradient-to-b from-[#16181e] via-[#0d0e12] to-[#07080a] text-white flex flex-col justify-between select-none">
      {/* 
        SATIN GRADIENT BLACK AMBIENT LIGHTING MESH
        Deep charcoal & graphite gradient with radial illumination
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft overhead radial spotlight */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(56,62,80,0.35)_0%,rgba(22,24,30,0.1)_60%,transparent_80%)] blur-[90px]" />

        {/* Central core glow */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-all duration-700",
            isOpen
              ? "size-[750px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-80"
              : "size-[450px] bg-gradient-to-b from-white/10 via-primary/5 to-transparent opacity-40",
          )}
        />

        {/* Bottom soft gradient shadow */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#07080a] via-[#07080a]/80 to-transparent" />
      </div>

      {/* 
        TOP STATUS BAR:
        Online / Offline Pill + Actions
      */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Online / Offline Status Indicator */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors",
            isOnline
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              : "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]",
          )}
          title={isOnline ? "Sistem Çevrimiçi & Senkronize" : "İnternet Bağlantısı Yok"}
        >
          <span className="relative flex size-2.5">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full size-2.5",
                isOnline
                  ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  : "bg-red-500 shadow-[0_0_8px_#ef4444]",
              )}
            />
          </span>
          <span className="text-xs font-black tracking-wider uppercase">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Top Right Shortcuts */}
        <div className="flex items-center gap-3">
          {restaurantUsername && (
            <Link
              href={`/${restaurantUsername}/personals`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogInIcon className="size-3.5" />
              <span>Personel Girişi</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <ShieldCheckIcon className="size-3.5" />
              <span>Yönetici</span>
            </Link>
          )}
        </div>
      </div>

      {/* 
        MAIN CENTER STAGE:
        1. BEYAZ SİSTEM LOGOSU (Yazısız, menü açıldığında kaybolmaz, yumuşak odakla kalır)
        2. ORTADAKİ "MENÜ" BUTONU
        3. DOKUNMATİK UYUMLU, ASLA ÜST ÜSTE BİNMEYEN PROFESYONEL MENÜ KARTLARI
      */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:px-8 w-full max-w-7xl mx-auto">
        {/* Center Branding Area */}
        <div className="flex flex-col items-center justify-center text-center select-none mb-4">
          {/* Beyaz Sistem Logosu */}
          <div
            className={cn(
              "relative transition-all duration-500 ease-out pointer-events-none mb-3",
              isOpen
                ? "opacity-75 blur-[1.5px] scale-95"
                : "opacity-100 blur-none scale-100",
            )}
          >
            {settings.logoDarkUrl || settings.logoUrl ? (
              <div className="relative h-18 sm:h-24 md:h-28 w-60 sm:w-80 md:w-96 max-w-[380px] drop-shadow-[0_12px_30px_rgba(255,255,255,0.18)]">
                <Image
                  src={settings.logoDarkUrl || settings.logoUrl || ""}
                  alt="Sistem Logosu"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 240px, 384px"
                />
              </div>
            ) : settings.faviconUrl ? (
              <div className="relative size-18 sm:size-22 overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-3 shadow-2xl">
                <Image
                  src={settings.faviconUrl}
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="88px"
                />
              </div>
            ) : (
              <div className="flex size-18 sm:size-22 items-center justify-center rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent border border-white/30 text-white shadow-[0_0_35px_rgba(255,255,255,0.2)]">
                <UtensilsCrossedIcon className="size-9 sm:size-11" />
              </div>
            )}
          </div>

          {/* 
            ORTADAKİ "MENÜ" BUTONU (Tetikleyici)
            Elastik açılıp kapanma butonu
          */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label="Menüyü Aç / Kapat"
            className={cn(
              "group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-11 py-3.5 sm:py-4 rounded-full font-black text-sm sm:text-base tracking-widest uppercase transition-all duration-300 cursor-pointer outline-none select-none active:scale-95 shadow-2xl",
              isOpen
                ? "bg-white text-zinc-950 hover:bg-zinc-200 border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.4)]"
                : "bg-white text-zinc-950 hover:scale-105 border-2 border-white/90 shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center transition-transform duration-300",
                isOpen ? "rotate-90 text-red-600" : "group-hover:rotate-180",
              )}
            >
              {isOpen ? <XIcon className="size-4.5 stroke-[3]" /> : "❖"}
            </span>

            <span className="font-extrabold tracking-widest">
              {isOpen ? "KAPAT" : "MENÜ"}
            </span>

            {!isOpen && (
              <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-primary/50 via-white/40 to-primary/50 opacity-40 blur-md group-hover:opacity-80 transition-opacity animate-pulse" />
            )}
          </button>

          {!isOpen && (
            <p className="mt-2.5 text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Modülleri açmak için butona dokunun
            </p>
          )}
        </div>

        {/* 
          DOKUNMATİK EKRAN UYUMLU, ASLA ÜST ÜSTE GELMEYEN PROFESYONEL MENÜ DÜZENİ
          - Her kart kendi bağımsız alanına sahiptir, sıfır çakışma (zero overlap)
          - Dokunmatik ekranlar için geniş dokunma alanları (touch targets)
          - Elastik açılış animasyonu: soldan sağa kademeli yaylanma (staggered spring)
          - Kartlar üzerine gelindiğinde z-index ve ölçekleme ile canlı geri bildirim
        */}
        <div
          className={cn(
            "w-full transition-all duration-500 ease-out",
            isOpen
              ? "opacity-100 max-h-[1400px] pointer-events-auto"
              : "opacity-0 max-h-0 pointer-events-none overflow-hidden",
          )}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4.5 lg:gap-5 w-full pt-4 pb-8">
            {HOME_ITEMS.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.href}
                  className="relative transition-all"
                  style={{
                    transform: isOpen ? "scale(1) translateY(0)" : "scale(0.85) translateY(24px)",
                    opacity: isOpen ? 1 : 0,
                    transition: isOpen
                      ? "transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease"
                      : "transform 0.35s ease, opacity 0.25s ease",
                    transitionDelay: isOpen ? `${index * 32}ms` : "0ms",
                  }}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "group relative flex flex-col justify-between w-full cursor-pointer select-none",
                      // Geniş, dokunmatik ekran uyumlu yükseklik ve dokunma alanı
                      "min-h-[128px] sm:min-h-[145px] lg:min-h-[155px]",
                      "rounded-3xl p-4 lg:p-4.5",
                      // Cam efektli derin obsidian kart yüzeyi
                      "border-2 border-white/15 bg-gradient-to-b from-zinc-800/80 via-zinc-900/90 to-[#0c0d11]/95",
                      "backdrop-blur-2xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]",
                      // Dokunmatik anında net tıklama tepkisi
                      "active:scale-95 transition-all duration-200",
                      // Masaüstünde z-index: 50 ile komşuların üstünde zarif büyüme
                      "hover:scale-[1.04] hover:border-white/60 hover:shadow-2xl hover:z-50",
                    )}
                    style={{
                      boxShadow: undefined,
                    }}
                  >
                    {/* Glowing Colored Accent Layer */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-[22px] bg-gradient-to-br transition-opacity duration-300",
                        item.gradient,
                        "opacity-35 group-hover:opacity-75 group-active:opacity-90",
                      )}
                    />

                    {/* Top Row: Rozet Numarası & Yön Oku */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="flex size-6 items-center justify-center rounded-full bg-black/60 border border-white/20 text-[10px] sm:text-[11px] font-black text-zinc-200">
                        {item.badge}
                      </span>
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white/80 group-hover:bg-white group-hover:text-black group-hover:scale-110 transition-all">
                        <span className="text-xs font-black">↗</span>
                      </span>
                    </div>

                    {/* Center: Büyük ve Net Modül İkonu */}
                    <div className="relative z-10 flex items-center justify-start my-2">
                      <div className="flex size-12 sm:size-13 lg:size-14 items-center justify-center rounded-2xl bg-white/15 border border-white/25 text-white shadow-inner group-hover:scale-110 group-hover:bg-white/25 transition-all duration-200">
                        <Icon className="size-6 sm:size-7 lg:size-7.5 stroke-[2.2] text-white" />
                      </div>
                    </div>

                    {/* Bottom: Kristal Netliğinde Saf Beyaz Başlık ve Açıklama */}
                    <div className="relative z-10 w-full text-left">
                      <span className="block text-sm sm:text-base font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate">
                        {item.title}
                      </span>
                      <span className="block text-[10px] sm:text-[11px] font-medium text-zinc-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1 mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER BAR */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-white/10 bg-black/30 backdrop-blur-md text-xs text-zinc-400">
        <p className="font-medium text-[11px] text-zinc-500">
          © {new Date().getFullYear()} {settings.systemName}. Tüm hakları saklıdır.
        </p>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[11px] text-zinc-400">
            {isOpen ? "Menüyü kapatmak için KAPAT butonuna dokunun" : "Tüm modülleri açmak için MENÜ butonuna dokunun"}
          </span>
          <Link
            href="#"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <CircleHelpIcon className="size-3.5" />
            <span>Yardım</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}
