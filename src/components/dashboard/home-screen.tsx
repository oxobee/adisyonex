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
  ChevronRightIcon,
  CircleHelpIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LogInIcon,
  PaletteIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
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
    gradient: "from-amber-500/50 via-orange-600/40 to-red-700/50",
    glowColor: "rgba(245, 158, 11, 0.5)",
    badge: "01",
  },
  {
    title: "Mutfak Ekranı",
    description: "KOT & Hazırlık Takibi",
    href: "/dashboard/kitchen",
    icon: ChefHatIcon,
    gradient: "from-emerald-500/50 via-teal-600/40 to-cyan-700/50",
    glowColor: "rgba(16, 185, 129, 0.5)",
    badge: "02",
  },
  {
    title: "POS / Kasa",
    description: "Hızlı Sipariş & Tahsilat",
    href: "/dashboard/pos",
    icon: CalculatorIcon,
    gradient: "from-sky-500/50 via-blue-600/40 to-indigo-700/50",
    glowColor: "rgba(14, 165, 233, 0.5)",
    badge: "03",
  },
  {
    title: "Genel Bakış",
    description: "Satış & Günlük Raporlar",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    gradient: "from-violet-500/50 via-purple-600/40 to-fuchsia-700/50",
    glowColor: "rgba(139, 92, 246, 0.5)",
    badge: "04",
  },
  {
    title: "Menü Yönetimi",
    description: "Ürün & Kategori Listesi",
    href: "/dashboard/menu",
    icon: BookOpenIcon,
    gradient: "from-teal-500/50 via-cyan-600/40 to-emerald-700/50",
    glowColor: "rgba(20, 184, 166, 0.5)",
    badge: "05",
  },
  {
    title: "Menü Tasarım",
    description: "QR Menüyü Özelleştir",
    href: "/dashboard/menu-design",
    icon: PaletteIcon,
    gradient: "from-pink-500/50 via-rose-600/40 to-red-700/50",
    glowColor: "rgba(236, 72, 153, 0.5)",
    badge: "06",
  },
  {
    title: "Masalar",
    description: "Salon & Masa Yerleşimi",
    href: "/dashboard/tables",
    icon: ArmchairIcon,
    gradient: "from-rose-500/50 via-red-600/40 to-orange-700/50",
    glowColor: "rgba(244, 63, 94, 0.5)",
    badge: "07",
  },
  {
    title: "Personel",
    description: "Ekip & Giriş PIN'leri",
    href: "/dashboard/staff",
    icon: UsersIcon,
    gradient: "from-orange-500/50 via-amber-600/40 to-yellow-700/50",
    glowColor: "rgba(249, 115, 22, 0.5)",
    badge: "08",
  },
  {
    title: "Stok & Envanter",
    description: "Kritik Stok & Giriş-Çıkış",
    href: "/dashboard/inventory",
    icon: BoxesIcon,
    gradient: "from-slate-500/50 via-zinc-600/40 to-stone-700/50",
    glowColor: "rgba(100, 116, 139, 0.5)",
    badge: "09",
  },
  {
    title: "Müşteriler",
    description: "Sadakat & Kampanyalar",
    href: "/dashboard/customers",
    icon: GiftIcon,
    gradient: "from-fuchsia-500/50 via-pink-600/40 to-rose-700/50",
    glowColor: "rgba(217, 70, 239, 0.5)",
    badge: "10",
  },
  {
    title: "Ayarlar",
    description: "Restoran & Sistem Profili",
    href: "/dashboard/settings",
    icon: Settings2Icon,
    gradient: "from-zinc-500/50 via-neutral-600/40 to-stone-700/50",
    glowColor: "rgba(113, 113, 122, 0.5)",
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  // Responsive geometry for the desktop radial arc (wider spacing for bigger cards)
  const [geometry, setGeometry] = useState({
    rx: 520,
    ry: 290,
    cardScale: 1,
    centerOffsetY: 50,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1024) {
        setGeometry({ rx: 420, ry: 240, cardScale: 0.9, centerOffsetY: 35 });
      } else if (width < 1440) {
        setGeometry({ rx: 500, ry: 280, cardScale: 1, centerOffsetY: 45 });
      } else {
        setGeometry({ rx: 560, ry: 310, cardScale: 1.08, centerOffsetY: 55 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const count = HOME_ITEMS.length;

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] w-full overflow-x-hidden bg-[#07080a] text-white flex flex-col justify-between select-none">
      {/* Cinematic Deep Space Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] transition-all duration-700",
            isOpen
              ? "size-[750px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent opacity-90"
              : "size-[500px] bg-gradient-to-b from-white/10 via-primary/5 to-transparent opacity-40",
          )}
        />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/90 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* 
        TOP HEADER BAR:
        Adisyon OS yazısı yerine: Canlı yeşil / kırmızı çevrimiçi durumu ve Online / Offline metni
      */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Real-time Online / Offline Pill */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors",
            isOnline
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
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

        {/* Top Right Actions */}
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
        1. Radial Arc Items (Desktop / Tablet)
        2. Beyaz Sistem Logosu (Yazı yok, menü açıldığında kaybolmaz)
        3. Ortadaki "MENÜ" Butonu
        4. Sırayla Dizilen Mobil Menü Kartları (Mobil)
      */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[500px]">
        {/* Center Anchor Point */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-5xl">
          {/* 
            DESKTOP / TABLET: OVAL RADIAL ARC (≥ 768px)
            Each item's wrapper div gets dynamic zIndex: isHovered ? 100 : 30 + index
            Guarantees hovered card is ALWAYS on top of neighbor cards!
          */}
          <div
            className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ marginTop: `${geometry.centerOffsetY}px` }}
          >
            {HOME_ITEMS.map((item, index) => {
              const Icon = item.icon;

              const startAngle = 175;
              const endAngle = 5;
              const angleDeg =
                startAngle - index * ((startAngle - endAngle) / (count - 1));
              const angleRad = (angleDeg * Math.PI) / 180;

              const targetX = Math.round(geometry.rx * Math.cos(angleRad));
              const targetY = Math.round(-geometry.ry * Math.sin(angleRad));
              const rotationDeg = Math.round((90 - angleDeg) * 0.52);

              const staggerDelay = isOpen
                ? `${index * 38}ms`
                : `${(count - 1 - index) * 18}ms`;

              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={item.href}
                  className="absolute left-0 top-0 pointer-events-none"
                  style={{
                    transform: isOpen
                      ? `translate(${targetX}px, ${targetY}px) scale(${geometry.cardScale})`
                      : "translate(0px, 0px) scale(0)",
                    opacity: isOpen ? 1 : 0,
                    // CRITICAL FIX: The outer wrapper gets zIndex 100 when hovered so it sits ON TOP of all other cards!
                    zIndex: isHovered ? 100 : 30 + index,
                    transition: isOpen
                      ? `transform 0.72s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease`
                      : `transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease`,
                    transitionDelay: staggerDelay,
                  }}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "pointer-events-auto group relative -translate-x-1/2 -translate-y-1/2 flex flex-col justify-between cursor-pointer select-none",
                      // Significantly enlarged card size
                      "w-36 h-46 lg:w-42 lg:h-52",
                      "rounded-[28px] p-3.5 lg:p-4",
                      "border-2 border-white/20 bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black",
                      "backdrop-blur-3xl shadow-[0_16px_36px_rgba(0,0,0,0.7)]",
                      "transition-all duration-300 ease-out",
                      isHovered && "scale-115 border-white/80 shadow-2xl",
                    )}
                    style={{
                      transform: isHovered
                        ? "rotate(0deg) translateY(-12px)"
                        : `rotate(${rotationDeg}deg)`,
                      boxShadow: isHovered
                        ? `0 25px 60px -10px ${item.glowColor}, 0 0 30px ${item.glowColor}`
                        : undefined,
                    }}
                  >
                    {/* Glowing Gradient Background Layer */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-[26px] bg-gradient-to-br transition-opacity",
                        item.gradient,
                        isHovered ? "opacity-90" : "opacity-45",
                      )}
                    />

                    {/* Top Header: Badge Number & Arrow */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="flex size-6 items-center justify-center rounded-full bg-black/60 border border-white/20 text-[11px] font-black text-white shadow-xs">
                        {item.badge}
                      </span>
                      <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white group-hover:bg-white group-hover:text-black transition-all">
                        <span className="text-xs font-black">↗</span>
                      </span>
                    </div>

                    {/* Center Icon */}
                    <div className="relative z-10 flex flex-1 items-center justify-center py-1">
                      <div className="flex size-14 lg:size-16 items-center justify-center rounded-2xl bg-white/15 border border-white/25 text-white shadow-inner group-hover:scale-110 group-hover:bg-white/25 transition-all duration-200">
                        <Icon className="size-7 lg:size-8 stroke-[2.2] text-white" />
                      </div>
                    </div>

                    {/* Bottom Title & Subtitle: High contrast pure white text */}
                    <div className="relative z-10 w-full text-center px-1">
                      <span className="block text-sm lg:text-base font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                        {item.title}
                      </span>
                      <span className="block text-[10px] lg:text-xs font-semibold text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1 mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* 
            NEXT / CYCLE ARROW BUTTON (≥ 768px Desktop)
          */}
          {isOpen && (
            <button
              type="button"
              onClick={() => {
                setHoveredIndex((prev) =>
                  prev === null || prev >= count - 1 ? 0 : prev + 1,
                );
              }}
              className="hidden md:flex absolute right-[-50px] lg:right-[-80px] top-1/2 -translate-y-1/2 z-40 size-13 items-center justify-center rounded-full border border-white/20 bg-zinc-900/90 text-white shadow-2xl hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-xl animate-in fade-in zoom-in duration-300"
              title="Sonraki Menü"
              aria-label="Sonraki"
            >
              <ChevronRightIcon className="size-6 stroke-[2.5]" />
            </button>
          )}

          {/* 
            BEYAZ SİSTEM LOGOSU (Z-INDEX 10)
            "Ana ekrandaki Adisyoon yazısı olmasın sadece beyaz logo olsun menüye tıklayınca bu beyaz logo kaybolmasın"
            - AdisyonEx / Slogan yazısı tamamen kaldırıldı.
            - Yalnızca beyaz logo görünür.
            - Menü açıldığında kaybolmaz (hafif yumuşak blur ile arkada kalır).
          */}
          <div
            className={cn(
              "relative z-10 flex flex-col items-center justify-center mb-6 text-center select-none pointer-events-none transition-all duration-500",
              isOpen
                ? "opacity-75 blur-[2px] scale-95"
                : "opacity-100 blur-none scale-100",
            )}
          >
            {settings.logoDarkUrl || settings.logoUrl ? (
              <div className="relative h-20 sm:h-26 md:h-32 w-64 sm:w-84 md:w-96 max-w-[380px] drop-shadow-[0_15px_35px_rgba(255,255,255,0.2)]">
                <Image
                  src={settings.logoDarkUrl || settings.logoUrl || ""}
                  alt="Sistem Logosu"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 256px, 384px"
                />
              </div>
            ) : settings.faviconUrl ? (
              <div className="relative size-20 sm:size-24 overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-3 shadow-2xl">
                <Image
                  src={settings.faviconUrl}
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent border border-white/30 text-white shadow-[0_0_40px_rgba(255,255,255,0.25)]">
                <UtensilsCrossedIcon className="size-10 sm:size-12" />
              </div>
            )}
          </div>

          {/* 
            ORTADAKİ "MENÜ" BUTONU (Z-INDEX 50)
          */}
          <div className="relative z-50 mt-2">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-label="Menüyü Aç/Kapat"
              className={cn(
                "group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-12 py-4 sm:py-4.5 rounded-full font-black text-sm sm:text-base tracking-wider uppercase transition-all duration-300 cursor-pointer outline-none select-none active:scale-95 shadow-2xl",
                isOpen
                  ? "bg-white text-zinc-950 hover:bg-zinc-200 border-2 border-white shadow-[0_0_40px_rgba(255,255,255,0.45)]"
                  : "bg-white text-zinc-950 hover:scale-105 border-2 border-white/90 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_55px_rgba(255,255,255,0.6)]",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center transition-transform duration-300",
                  isOpen ? "rotate-90 text-red-600" : "group-hover:rotate-180",
                )}
              >
                {isOpen ? "✕" : "❖"}
              </span>
              <span className="font-extrabold tracking-widest">
                {isOpen ? "KAPAT" : "MENÜ"}
              </span>

              {!isOpen && (
                <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-primary/50 via-white/40 to-primary/50 opacity-50 blur-md group-hover:opacity-90 transition-opacity animate-pulse" />
              )}
            </button>
          </div>

          {/* 
            MOBİL GÖRÜNÜM: OKUNAKLI & SIRAYLA DİZİLEN MENÜ KARTLARI (< 768px)
            "mobilde ise ortadaki butona tıklayınca menü kartları ekrana sırayla dizilsin ve okunaklı olsun."
          */}
          {isOpen && (
            <div className="md:hidden w-full mt-8 grid grid-cols-2 gap-3 px-2 animate-in fade-in slide-in-from-bottom-6 duration-300">
              {HOME_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="relative flex flex-col justify-between p-3.5 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black shadow-xl active:scale-95 transition-all overflow-hidden group"
                    style={{
                      animationDelay: `${index * 35}ms`,
                    }}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-45 group-hover:opacity-75 transition-opacity",
                        item.gradient,
                      )}
                    />

                    {/* Top Row: Badge & Arrow */}
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-black/60 border border-white/20 text-[10px] font-black text-white">
                        {item.badge}
                      </span>
                      <span className="text-xs font-black text-white/80 group-hover:text-white">
                        ↗
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="relative z-10 flex items-center justify-center my-1.5">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-white/15 border border-white/20 text-white">
                        <Icon className="size-6 stroke-[2.2] text-white" />
                      </div>
                    </div>

                    {/* Title & Description: Pure white high contrast */}
                    <div className="relative z-10 text-center mt-1">
                      <span className="block text-xs font-black tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] truncate">
                        {item.title}
                      </span>
                      <span className="block text-[9px] font-semibold text-zinc-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Active Hovered Item Hint Display (Desktop) */}
          <div
            className={cn(
              "hidden md:block absolute -bottom-16 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 text-center whitespace-nowrap pointer-events-none",
              hoveredIndex !== null && isOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2",
            )}
          >
            {hoveredIndex !== null && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-zinc-900/95 text-xs font-bold text-white shadow-2xl backdrop-blur-md">
                <SparklesIcon className="size-3.5 text-amber-400" />
                <span className="font-black">{HOME_ITEMS[hoveredIndex].title}</span>
                <span className="text-zinc-300 font-medium">
                  — {HOME_ITEMS[hoveredIndex].description}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER BAR */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-xs text-zinc-400">
        <p className="font-medium text-[11px] text-zinc-500">
          © {new Date().getFullYear()} {settings.systemName}. Tüm hakları saklıdır.
        </p>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[11px] text-zinc-500">
            {isOpen ? "Menüyü kapatmak için butona tıklayın" : "Tüm modülleri görmek için MENÜ butonuna tıklayın"}
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
