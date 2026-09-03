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
  CircleHelpIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LockIcon,
  LogInIcon,
  PaletteIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
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
  isStaff = false,
  staffRole,
  allowedRoutes = null,
  restaurantUsername,
}: {
  readonly settings: SystemSettingsDTO;
  readonly isAdmin: boolean;
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
    const filtered = HOME_ITEMS.filter((item) => allowedRoutes.includes(item.href));
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
    if (!isOpen) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      // 60 seconds (1 minute)
      inactivityTimerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 60000);
    };

    // Initial reset
    resetInactivityTimer();

    const activityEvents = [
      "mousedown",
      "mousemove",
      "touchstart",
      "pointerdown",
      "keydown",
      "scroll",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [isOpen]);

  return (
    <main
      onClick={() => {
        // Kapalı durumdayken arka plana veya logoya tıklandığında menüyü aç
        if (!isOpen) {
          setIsOpen(true);
        }
      }}
      className={cn(
        "relative min-h-[calc(100vh-3.5rem)] w-full flex flex-col justify-between overflow-hidden select-none transition-colors duration-500",
        // Kapalıyken tüm ekran tıklanabilir açılış tetiğidir
        !isOpen ? "cursor-pointer" : "cursor-default",
        // Derin minimalist obsidian gece teması
        "bg-[#050608] text-white",
      )}
    >
      {/* 
        PREMIUM DYNAMIC KEYFRAME ANIMATIONS:
        - gentleHeartbeat: Ekran kapalıyken logonun hafif, organik aralıklarla atması
        - glowPulse: Arka plan gradyanının tatlı parıltısı
      */}
      <style jsx global>{`
        @keyframes gentleHeartbeat {
          0%, 100% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.045);
          }
          28% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.025);
          }
          70% {
            transform: scale(1);
          }
        }
        .animate-heartbeat {
          animation: gentleHeartbeat 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes ambientGlowPulse {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.28;
            transform: scale(1.08);
          }
        }
        .animate-glow-pulse {
          animation: ambientGlowPulse 5s ease-in-out infinite;
        }
      `}</style>

      {/* 
        AMBIENT GLOW LAYERS:
        Logonun ve kartların arkasında atmosferik, derin stüdyo aydınlatması
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Merkez Büyük Parıltı */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] sm:size-[850px] rounded-full blur-[140px] opacity-20 animate-glow-pulse pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(235, 94, 40, 0.45) 0%, rgba(139, 92, 246, 0.25) 45%, transparent 70%)",
          }}
        />
        {/* Üst Zarif Sis */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        {/* Alt Taban Gradyanı */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
      </div>

      {/* 
        TOP BAR:
        Online / Offline Pill on Left + Staff / Admin Shortcuts on Right (Sadece yöneticilerde)
      */}
      <div
        className="relative z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4"
        onClick={(e) => {
          // Üst bardaki butonlara tıklandığında menü açma olayının tetiklenmesini engelle
          if (!isOpen) {
            e.stopPropagation();
          }
        }}
      >
        {/* Live Online / Offline Pill */}
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

        {/* Top Right Shortcuts - Yalnızca Yönetici / Admin modunda görünür, personel ekranında gizlenir */}
        {!isStaff && (
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
        )}
      </div>

      {/* 
        MAIN STAGE:
        1. KAPALIYKEN:
           - Menü butonu YOK.
           - Ekranda yalnızca tam ortalanmış, hafif aralıklarla tatlı kalp atışı (push) animasyonu yapan büyük logo yer alır.
           - Logoya veya ekranın herhangi bir yerine basıldığında menü açılır!
        2. AÇIKKEN:
           - 11 modül kartı tek tek sıralı elastik animasyonla ekrana fırlar.
           - Personel yetkilerine göre yalnızca yetkili olunan modüller aktif ve tıklanabilirdir.
           - Sağ üstte net '✕ KAPAT' butonu belirir.
      */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto my-auto">
        {!isOpen ? (
          /* ============================================================ */
          /* KAPALI DURUM: SADECE MERKEZİ LOGO VE HAFİF KALP ATIŞI        */
          /* ============================================================ */
          <div className="flex flex-col items-center justify-center text-center my-auto cursor-pointer group py-12">
            {/* Ortalanmış Canlı Logo Alanı */}
            <div className="relative transform-gpu transition-transform duration-500 group-hover:scale-105 select-none">
              {/* Logo Çevresi İnce Parıltı Halkası */}
              <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-primary/30 to-amber-500/20 blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />

              {settings.logoUrl || settings.logoDarkUrl ? (
                <div className="relative h-20 sm:h-28 lg:h-32 w-72 sm:w-96 lg:w-[460px] animate-heartbeat">
                  <Image
                    src={settings.logoDarkUrl || settings.logoUrl || ""}
                    alt={settings.systemName || "Adisyon"}
                    fill
                    className="object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
                    priority
                    sizes="(max-width: 640px) 288px, (max-width: 1024px) 384px, 460px"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 sm:gap-6 animate-heartbeat">
                  <div className="flex size-16 sm:size-20 lg:size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-[0_10px_30px_rgba(235,94,40,0.5)]">
                    <UtensilsCrossedIcon className="size-8 sm:size-10 lg:size-12 stroke-[2.2]" />
                  </div>
                  <span className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
                    {settings.systemName || "Adisyon"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* AÇIK DURUM: 11 MODÜL KARTI + SAĞ ÜST 'KAPAT' BUTONU          */
          /* ============================================================ */
          <div className="w-full flex flex-col my-auto pt-2 sm:pt-4 animate-in fade-in zoom-in-98 duration-300">
            {/* Üst Bar: Sol Logo + Sağ Kapat Butonu */}
            <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 px-1">
              {/* Sol: Kompakt Logo */}
              <div className="flex items-center gap-3">
                {settings.logoUrl || settings.logoDarkUrl ? (
                  <div className="relative h-9 sm:h-11 w-32 sm:w-44">
                    <Image
                      src={settings.logoDarkUrl || settings.logoUrl || ""}
                      alt={settings.systemName || "Adisyon"}
                      fill
                      className="object-contain object-left"
                      priority
                      sizes="176px"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-white">
                      <UtensilsCrossedIcon className="size-4" />
                    </div>
                    <span className="text-lg font-black tracking-tight text-white">
                      {settings.systemName || "Adisyon"}
                    </span>
                  </div>
                )}
              </div>

              {/* Sağ: Estetik Kapat Butonu */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="group relative inline-flex items-center justify-center gap-2 px-6 sm:px-7 h-10 sm:h-11 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer outline-none select-none active:scale-95 shadow-xl bg-white text-zinc-950 hover:bg-zinc-100 border border-white"
                title="Menüyü Kapat ve Logoya Dön"
              >
                <span className="text-red-600 font-black text-sm">✕</span>
                <span>KAPAT</span>
              </button>
            </div>

            {/* Menü Kartları: Yetkili butonlar ortalı ve düzgün bir biçimde, yetkisizler tamamen gizli */}
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
                    {/* AKTİF KART: Tam Renkli, Parıltılı, Tıklanabilir */}
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "group relative flex flex-col justify-between w-full cursor-pointer select-none",
                        // Geniş, dokunmatik uyumlu basma hedefi
                        "min-h-[145px] sm:min-h-[155px] lg:min-h-[165px]",
                        "rounded-3xl p-4 lg:p-5",
                        // Cam efektli derin obsidian kart yüzeyi
                        "border-2 border-white/15 bg-gradient-to-b from-zinc-800/80 via-zinc-900/90 to-[#0c0d11]/95",
                        "backdrop-blur-2xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]",
                        // Dokunmatik anında anlık tepki
                        "active:scale-95 transition-all duration-150",
                        // Masaüstünde zarif hover
                        "hover:scale-[1.03] hover:border-white/60 hover:shadow-2xl hover:z-50",
                      )}
                    >
                      {/* Glowing Colored Accent Layer */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-[22px] bg-gradient-to-br transition-opacity duration-200",
                          item.gradient,
                          "opacity-40 group-hover:opacity-80 group-active:opacity-95",
                        )}
                      />

                      {/* Top Row: Rozet Numarası & Yön Oku */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="flex size-6 sm:size-6.5 items-center justify-center rounded-full bg-black/60 border border-white/20 text-[10px] sm:text-[11px] font-black text-zinc-200">
                          {item.badge}
                        </span>
                        <span className="flex size-6 sm:size-6.5 items-center justify-center rounded-full bg-white/10 text-white/80 group-hover:bg-white group-hover:text-black group-hover:scale-110 transition-all">
                          <span className="text-xs font-black">↗</span>
                        </span>
                      </div>

                      {/* Center: Büyük ve Net Modül İkonu */}
                      <div className="relative z-10 flex items-center justify-start my-2.5">
                        <div className="flex size-12 sm:size-13 lg:size-14 items-center justify-center rounded-2xl bg-white/15 border border-white/25 text-white shadow-inner group-hover:scale-110 group-hover:bg-white/25 transition-all duration-150">
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
        )}
      </div>

      {/* BOTTOM FOOTER BAR */}
      <footer
        className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-4 border-t border-white/10 bg-black/30 backdrop-blur-md text-xs text-zinc-400"
        onClick={(e) => {
          // Footer butonlarına tıklandığında menü açma olayının tetiklenmesini engelle
          if (!isOpen) {
            e.stopPropagation();
          }
        }}
      >
        <p className="font-medium text-[11px] text-zinc-500">
          © {new Date().getFullYear()} {settings.systemName}. Tüm hakları saklıdır.
        </p>

        <div className="flex items-center gap-4">
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
