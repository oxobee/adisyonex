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
    gradient: "from-amber-500/40 via-orange-500/30 to-red-600/40",
    glowColor: "rgba(245, 158, 11, 0.4)",
    badge: "01",
  },
  {
    title: "Mutfak Ekranı",
    description: "KOT & Hazırlık Takibi",
    href: "/dashboard/kitchen",
    icon: ChefHatIcon,
    gradient: "from-emerald-500/40 via-teal-500/30 to-cyan-600/40",
    glowColor: "rgba(16, 185, 129, 0.4)",
    badge: "02",
  },
  {
    title: "POS / Kasa",
    description: "Hızlı Sipariş & Tahsilat",
    href: "/dashboard/pos",
    icon: CalculatorIcon,
    gradient: "from-sky-500/40 via-blue-500/30 to-indigo-600/40",
    glowColor: "rgba(14, 165, 233, 0.4)",
    badge: "03",
  },
  {
    title: "Genel Bakış",
    description: "Satış & Günlük Raporlar",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    gradient: "from-violet-500/40 via-purple-500/30 to-fuchsia-600/40",
    glowColor: "rgba(139, 92, 246, 0.4)",
    badge: "04",
  },
  {
    title: "Menü Yönetimi",
    description: "Ürün & Kategori Listesi",
    href: "/dashboard/menu",
    icon: BookOpenIcon,
    gradient: "from-teal-500/40 via-cyan-500/30 to-emerald-600/40",
    glowColor: "rgba(20, 184, 166, 0.4)",
    badge: "05",
  },
  {
    title: "Menü Tasarım",
    description: "QR Menüyü Özelleştir",
    href: "/dashboard/menu-design",
    icon: PaletteIcon,
    gradient: "from-pink-500/40 via-rose-500/30 to-red-600/40",
    glowColor: "rgba(236, 72, 153, 0.4)",
    badge: "06",
  },
  {
    title: "Masalar",
    description: "Salon & Masa Yerleşimi",
    href: "/dashboard/tables",
    icon: ArmchairIcon,
    gradient: "from-rose-500/40 via-red-500/30 to-orange-600/40",
    glowColor: "rgba(244, 63, 94, 0.4)",
    badge: "07",
  },
  {
    title: "Personel",
    description: "Ekip & Giriş PIN'leri",
    href: "/dashboard/staff",
    icon: UsersIcon,
    gradient: "from-orange-500/40 via-amber-500/30 to-yellow-600/40",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badge: "08",
  },
  {
    title: "Stok & Envanter",
    description: "Kritik Stok & Giriş-Çıkış",
    href: "/dashboard/inventory",
    icon: BoxesIcon,
    gradient: "from-slate-500/40 via-zinc-500/30 to-stone-600/40",
    glowColor: "rgba(100, 116, 139, 0.4)",
    badge: "09",
  },
  {
    title: "Müşteriler",
    description: "Sadakat & Kampanyalar",
    href: "/dashboard/customers",
    icon: GiftIcon,
    gradient: "from-fuchsia-500/40 via-pink-500/30 to-rose-600/40",
    glowColor: "rgba(217, 70, 239, 0.4)",
    badge: "10",
  },
  {
    title: "Ayarlar",
    description: "Restoran & Sistem Profili",
    href: "/dashboard/settings",
    icon: Settings2Icon,
    gradient: "from-zinc-500/40 via-neutral-500/30 to-stone-600/40",
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Responsive geometry for the oval arc
  const [geometry, setGeometry] = useState({
    rx: 440,
    ry: 260,
    cardScale: 1,
    centerOffsetY: 40,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setGeometry({ rx: 155, ry: 135, cardScale: 0.65, centerOffsetY: 10 });
      } else if (width < 768) {
        setGeometry({ rx: 240, ry: 175, cardScale: 0.78, centerOffsetY: 20 });
      } else if (width < 1024) {
        setGeometry({ rx: 340, ry: 215, cardScale: 0.88, centerOffsetY: 30 });
      } else if (width < 1440) {
        setGeometry({ rx: 430, ry: 250, cardScale: 0.96, centerOffsetY: 40 });
      } else {
        setGeometry({ rx: 480, ry: 280, cardScale: 1.05, centerOffsetY: 50 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const count = HOME_ITEMS.length;

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#07080a] text-white flex flex-col justify-between select-none">
      {/* Cinematic Deep Space Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Central Core Ambient Light */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-all duration-700",
            isOpen
              ? "size-[650px] bg-gradient-to-b from-primary/25 via-primary/10 to-transparent opacity-80"
              : "size-[450px] bg-gradient-to-b from-white/10 via-primary/5 to-transparent opacity-40",
          )}
        />
        {/* Subtle Top Arc Vignette */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
        {/* Bottom Ambient Floor */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* TOP STATUS BAR INFO */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            {settings.systemName} OS
          </span>
        </div>

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
        1. Radial Arc Items (Z-Index 30 - Over the logo)
        2. System Logo (Z-Index 10 - Blurs when open)
        3. Center "MENÜ" Trigger Button (Z-Index 40)
      */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[520px]">
        {/* Center Anchor Point for the Arc and Logo */}
        <div className="relative flex flex-col items-center justify-center">
          {/* 
            OVAL ARC ITEMS (Z-INDEX 30 - SITS OVER THE BLURRED LOGO)
            Each item is positioned along the convex elliptical arch.
            Staggered elastic spring animation from left to right.
          */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
            style={{ marginTop: `${geometry.centerOffsetY}px` }}
          >
            {HOME_ITEMS.map((item, index) => {
              const Icon = item.icon;

              // Arc angle calculation from left (175 deg) to right (5 deg), Apex at 90 deg
              const startAngle = 175;
              const endAngle = 5;
              const angleDeg =
                startAngle - index * ((startAngle - endAngle) / (count - 1));
              const angleRad = (angleDeg * Math.PI) / 180;

              // Elliptical coordinates relative to center
              const targetX = Math.round(geometry.rx * Math.cos(angleRad));
              const targetY = Math.round(-geometry.ry * Math.sin(angleRad));

              // Tangent orientation angle for natural curve alignment
              const rotationDeg = Math.round((90 - angleDeg) * 0.52);

              // Left-to-right progressive stagger delay
              // Open: index * 35ms (starts on left item 0, ripples to right item 10)
              // Close: (count - 1 - index) * 20ms (collapses back in reverse)
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
                      "pointer-events-auto group relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer select-none",
                      "w-20 h-24 xs:w-22 xs:h-28 sm:w-26 sm:h-32 md:w-28 md:h-36",
                      "rounded-[22px] sm:rounded-[26px] p-2.5 sm:p-3",
                      "border border-white/15 bg-gradient-to-b from-zinc-800/90 via-zinc-900/90 to-black/95",
                      "backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)]",
                      "transition-all duration-300 ease-out",
                      isOpen && "hover:scale-115 hover:z-50 hover:border-white/50",
                    )}
                    style={{
                      transform: isHovered
                        ? "rotate(0deg) translateY(-8px)"
                        : `rotate(${rotationDeg}deg)`,
                      boxShadow: isHovered
                        ? `0 20px 40px -10px ${item.glowColor}, 0 0 20px ${item.glowColor}`
                        : undefined,
                    }}
                    title={item.title}
                  >
                    {/* Glowing Inner Tint Layer */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-[22px] sm:rounded-[26px] bg-gradient-to-br opacity-40 group-hover:opacity-80 transition-opacity",
                        item.gradient,
                      )}
                    />

                    {/* Badge Pill Number */}
                    <div className="absolute top-2 left-2.5 z-10 flex size-4.5 sm:size-5 items-center justify-center rounded-full bg-black/50 border border-white/10 text-[9px] sm:text-[10px] font-black text-zinc-300">
                      {item.badge}
                    </div>

                    {/* Icon Container */}
                    <div className="relative z-10 flex flex-1 items-center justify-center">
                      <div className="flex size-10 sm:size-12 md:size-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-inner group-hover:scale-110 group-hover:bg-white/20 transition-all duration-200">
                        <Icon className="size-5 sm:size-6 md:size-7 stroke-[2.2]" />
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="relative z-10 w-full text-center px-0.5">
                      <span className="block text-[11px] sm:text-xs font-black tracking-tight text-white group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="hidden sm:block text-[9px] font-medium text-zinc-400 line-clamp-1 opacity-80">
                        {item.description}
                      </span>
                    </div>

                    {/* Arrow Indicator on Hover */}
                    <div className="absolute -bottom-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-black shadow-lg">
                        ↗
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* 
            NEXT / CYCLE ARROW BUTTON (As seen in the uploaded reference photo!)
            Appears on the right side of the arc to slide/cycle through cards
          */}
          {isOpen && (
            <button
              type="button"
              onClick={() => {
                // Focus / cycle to next module
                setHoveredIndex((prev) =>
                  prev === null || prev >= count - 1 ? 0 : prev + 1,
                );
              }}
              className="absolute right-[-45px] sm:right-[-65px] md:right-[-90px] top-1/2 -translate-y-1/2 z-40 flex size-11 sm:size-13 items-center justify-center rounded-full border border-white/20 bg-zinc-900/90 text-white shadow-2xl hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-xl animate-in fade-in zoom-in duration-300"
              title="Sonraki Menü"
              aria-label="Sonraki"
            >
              <ChevronRightIcon className="size-5 sm:size-6 stroke-[2.5]" />
            </button>
          )}

          {/* 
            SİSTEM LOGOSU (Z-INDEX 10 - MENÜLER AÇILDIĞINDA BULANIK OLUR)
            "butonun üstünde sistemin logosu olsun . menüler açıldığında logo bulanık olsun menüler logonun üstünde kalsın."
          */}
          <div
            className={cn(
              "relative z-10 flex flex-col items-center justify-center mb-6 text-center transition-all duration-600 ease-out select-none pointer-events-none",
              isOpen
                ? "blur-md brightness-75 opacity-25 scale-95"
                : "blur-none brightness-100 opacity-100 scale-100",
            )}
          >
            {settings.logoDarkUrl || settings.logoUrl ? (
              <div className="relative h-14 sm:h-20 w-52 sm:w-72 max-w-[320px] mb-2 drop-shadow-[0_10px_25px_rgba(255,255,255,0.15)]">
                <Image
                  src={settings.logoDarkUrl || settings.logoUrl || ""}
                  alt={settings.systemName}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 208px, 288px"
                />
              </div>
            ) : settings.faviconUrl ? (
              <div className="relative size-16 sm:size-20 mb-3 overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-2 shadow-2xl">
                <Image
                  src={settings.faviconUrl}
                  alt={settings.systemName}
                  fill
                  className="object-contain"
                  priority
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="flex size-16 sm:size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 text-primary mb-3 shadow-[0_0_40px_rgba(255,85,0,0.3)]">
                <UtensilsCrossedIcon className="size-8 sm:size-10" />
              </div>
            )}

            {/* System Title & Tagline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {settings.systemName}
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-zinc-400 max-w-sm px-4 leading-snug">
              {settings.systemTagline || "Restoranınızı tek ekrandan yönetin."}
            </p>
          </div>

          {/* 
            ORTADAKİ "MENÜ" BUTONU (Z-INDEX 40)
            "ortada bir buton olsun kullanıcı butona tıkladığında elastik animasyonlu şekilde bu tarzda oval sıra düzeniyle butonlar açılsın tekrar ortadaki butona tıklayınca kapansın. butonda MENÜ yazsın"
          */}
          <div className="relative z-40 mt-1">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-label="Menüyü Aç/Kapat"
              className={cn(
                "group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-black text-sm sm:text-base tracking-wider uppercase transition-all duration-300 cursor-pointer outline-none select-none active:scale-95 shadow-2xl",
                isOpen
                  ? "bg-white text-zinc-950 hover:bg-zinc-200 border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.4)]"
                  : "bg-white text-zinc-950 hover:scale-105 border-2 border-white/90 shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_45px_rgba(255,255,255,0.5)]",
              )}
            >
              {/* Animated Icon Indicator */}
              <span
                className={cn(
                  "flex size-5 items-center justify-center transition-transform duration-300",
                  isOpen ? "rotate-90 text-red-600" : "group-hover:rotate-180",
                )}
              >
                {isOpen ? "✕" : "❖"}
              </span>

              {/* Button Text */}
              <span className="font-extrabold tracking-widest">
                {isOpen ? "KAPAT" : "MENÜ"}
              </span>

              {/* Subtle Ambient Pulse Light */}
              {!isOpen && (
                <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-r from-primary/50 via-white/40 to-primary/50 opacity-40 blur-md group-hover:opacity-80 transition-opacity animate-pulse" />
              )}
            </button>
          </div>

          {/* Active Hovered Item Hint Display */}
          <div
            className={cn(
              "absolute -bottom-14 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 text-center whitespace-nowrap pointer-events-none",
              hoveredIndex !== null && isOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2",
            )}
          >
            {hoveredIndex !== null && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-zinc-900/90 text-xs font-bold text-white shadow-xl backdrop-blur-md">
                <SparklesIcon className="size-3 text-amber-400" />
                <span>{HOME_ITEMS[hoveredIndex].title}</span>
                <span className="text-zinc-400 font-normal">
                  — {HOME_ITEMS[hoveredIndex].description}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER BAR */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-xs text-zinc-400">
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
