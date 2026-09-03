"use client";

import { useEffect, useRef, useState } from "react";
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
        // Ekranın herhangi bir yerine tıklandığında menüyü aç (kapalıyken)
        if (!isOpen) {
          setIsOpen(true);
        }
      }}
      className={cn(
        "relative min-h-[calc(100vh-3.5rem)] w-full overflow-x-hidden bg-gradient-to-b from-[#181a20] via-[#0e0f13] to-[#07080a] text-white flex flex-col justify-between select-none transition-colors",
        !isOpen && "cursor-pointer",
      )}
    >
      {/* 
        ÖZEL KALP ATIŞI (PUSH) ANİMASYONU
        Hafif aralıklarla tekrarlayan tatlı bir nabız / push efekti (4.8 saniyede bir çift ritimli atış)
      */}
      <style jsx global>{`
        @keyframes gentleHeartbeat {
          0%, 62%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 20px 45px rgba(255, 255, 255, 0.22));
          }
          68% {
            transform: scale(1.042);
            filter: drop-shadow(0 26px 55px rgba(255, 255, 255, 0.38));
          }
          74% {
            transform: scale(1.012);
            filter: drop-shadow(0 20px 45px rgba(255, 255, 255, 0.24));
          }
          80% {
            transform: scale(1.058);
            filter: drop-shadow(0 30px 60px rgba(255, 255, 255, 0.44));
          }
          90% {
            transform: scale(1);
            filter: drop-shadow(0 20px 45px rgba(255, 255, 255, 0.22));
          }
        }
        .animate-gentle-heartbeat {
          animation: gentleHeartbeat 4.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
      `}</style>

      {/* 
        SATIN GRADIENT BLACK AMBIENT LIGHTING MESH
        Charcoal, slate & deep obsidian gradient with overhead spotlight
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft overhead radial spotlight */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(65,72,92,0.3)_0%,rgba(24,26,32,0.08)_65%,transparent_80%)] blur-[95px]" />

        {/* Central core ambient glow */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-all duration-700",
            isOpen
              ? "size-[850px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-80"
              : "size-[600px] bg-gradient-to-b from-white/10 via-primary/5 to-transparent opacity-45",
          )}
        />

        {/* Bottom soft gradient shadow */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#07080a] via-[#07080a]/80 to-transparent" />
      </div>

      {/* 
        TOP BAR:
        Online / Offline Pill on Left + Staff / Admin Shortcuts on Right
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
        MAIN STAGE:
        1. KAPALIYKEN:
           - Menü butonu YOK.
           - Ekranda yalnızca tam ortalanmış, hafif aralıklarla tatlı kalp atışı (push) animasyonu yapan büyük logo yer alır.
           - Logoya veya ekranın herhangi bir yerine basıldığında menü açılır!
        2. AÇIKKEN:
           - En Solda: Menü butonları ile aynı hizada ve boyutta (h-11 sm:h-12) beyaz logo.
           - En Sağda: Menü butonları ile aynı hizada KAPAT butonu.
           - Altında: Sıfır çakışmalı, hızlı elastik animasyonlarla açılan 11 menü kartı.
           - 1 dakika boyunca ekrana dokunulmazsa otomatik olarak logoya geri döner.
      */}
      <div className="relative z-20 flex-1 flex flex-col justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 
          1. KAPALI HAL (SADECE BÜYÜK KALP ATIŞI YAPAN LOGO - MENÜ BUTONU YOK)
        */}
        {!isOpen && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-12 animate-in fade-in zoom-in-95 duration-500">
            {/* Büyük Beyaz Sistem Logosu (Tatlı Kalp Atışı Animasyonu) */}
            <div className="relative flex items-center justify-center select-none animate-gentle-heartbeat">
              {settings.logoDarkUrl || settings.logoUrl ? (
                <div className="relative h-24 sm:h-36 md:h-44 lg:h-52 w-[340px] sm:w-[500px] md:w-[660px] lg:w-[820px] max-w-full">
                  <Image
                    src={settings.logoDarkUrl || settings.logoUrl || ""}
                    alt="Sistem Logosu"
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 640px) 340px, (max-width: 1024px) 660px, 820px"
                  />
                </div>
              ) : settings.faviconUrl ? (
                <div className="relative size-28 sm:size-40 overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-4 shadow-2xl">
                  <Image
                    src={settings.faviconUrl}
                    alt="Logo"
                    fill
                    className="object-contain"
                    priority
                    sizes="160px"
                  />
                </div>
              ) : (
                <div className="flex size-28 sm:size-40 items-center justify-center rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent border border-white/30 text-white shadow-[0_0_45px_rgba(255,255,255,0.25)]">
                  <UtensilsCrossedIcon className="size-14 sm:size-20" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 
          2. AÇIK HAL:
          - En Solda: Beyaz logo (h-11 sm:h-12)
          - En Sağda: KAPAT butonu
          - Altında: Sıfır çakışmalı 11 menü kartı
        */}
        {isOpen && (
          <div
            className="w-full flex flex-col justify-start pt-1 pb-4 animate-in fade-in duration-400"
            onClick={(e) => {
              // Menü kartlarına veya alana tıklandığında üst kapsayıcıya yayılmasını durdur
              e.stopPropagation();
            }}
          >
            {/* Üst Eylem Satırı: Sol Logo - Sağ KAPAT Butonu */}
            <div className="relative w-full flex items-center justify-between min-h-[48px] sm:min-h-[52px] pb-4 sm:pb-6">
              {/* En Solda: Buton ile aynı boyutta Sistem Logosu (Tıklanırsa kapatır) */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Ana Ekrana Dön"
                className="select-none shrink-0 cursor-pointer transition-transform active:scale-95 animate-in slide-in-from-left-6 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              >
                {settings.logoDarkUrl || settings.logoUrl ? (
                  <div className="relative h-11 sm:h-12 w-36 sm:w-44 md:w-48 drop-shadow-[0_10px_25px_rgba(255,255,255,0.2)]">
                    <Image
                      src={settings.logoDarkUrl || settings.logoUrl || ""}
                      alt="Sistem Logosu"
                      fill
                      className="object-contain object-left"
                      priority
                      sizes="(max-width: 640px) 144px, 192px"
                    />
                  </div>
                ) : settings.faviconUrl ? (
                  <div className="relative size-11 sm:size-12 overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-2 shadow-2xl">
                    <Image
                      src={settings.faviconUrl}
                      alt="Logo"
                      fill
                      className="object-contain"
                      priority
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 via-white/10 to-transparent border border-white/30 text-white shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <UtensilsCrossedIcon className="size-6 sm:size-7" />
                  </div>
                )}
              </button>

              {/* En Sağda: Menü Kartları ile aynı hizada KAPAT Butonu */}
              <div className="shrink-0 z-30 animate-in slide-in-from-right-6 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-expanded={true}
                  aria-label="Menüyü Kapat"
                  className="group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 h-11 sm:h-12 rounded-full font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 cursor-pointer outline-none select-none active:scale-95 shadow-2xl bg-white text-zinc-950 hover:bg-zinc-100 border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.4)]"
                >
                  <span className="text-red-600 font-black text-sm">✕</span>
                  <span className="font-extrabold tracking-widest text-zinc-950">
                    KAPAT
                  </span>
                </button>
              </div>
            </div>

            {/* Menü Kartları: Tek tek sırayla hızlı elastik açılış (index * 22ms) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-4.5 w-full pb-10">
              {HOME_ITEMS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.href}
                    className="relative animate-in fade-in zoom-in-90 slide-in-from-bottom-5 duration-450 fill-mode-both"
                    style={{
                      animationDelay: `${index * 22}ms`,
                      animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "group relative flex flex-col justify-between w-full cursor-pointer select-none",
                        // Geniş, dokunmatik uyumlu basma hedefi
                        "min-h-[135px] sm:min-h-[148px] lg:min-h-[158px]",
                        "rounded-3xl p-4 lg:p-4.5",
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
