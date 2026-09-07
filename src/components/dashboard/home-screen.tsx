"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArmchairIcon,
  BarChart3Icon,
  BellIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSunIcon,
  CameraIcon,
  HeadphonesIcon,
  LockIcon,
  MapPinIcon,
  MessageSquareQuoteIcon,
  MicIcon,
  SendIcon,
  ServerIcon,
  Settings2Icon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  SnowflakeIcon,
  SparklesIcon,
  SunIcon,
  TrendingUpIcon,
  UtensilsCrossedIcon,
  WifiIcon,
  HistoryIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SystemSettingsDTO } from "@/services/system-setting.service";
import { hasPermissionForRoute } from "@/lib/permission-matrix";
import {
  HomeNotificationsModal,
  type HomeNotificationItem,
} from "./home-notifications-modal";
import {
  SystemNotificationDetailModal,
  type SystemNotificationItem,
} from "./system-notification-detail-modal";
import { HomeScreenLockModal } from "./home-screen-lock-modal";
import { GridPattern } from "@/components/velora/grid-pattern";
import { SystemActivityLogModal } from "./system-activity-log-modal";
import {
  StaffAccountMenu,
  type StaffAccount,
} from "./staff-account-menu";
import { WaiterReadyItemsPanel } from "./waiter-ready-items-panel";
import type { ReadyToServeItemDTO } from "@/services/kitchen.service";

export interface HomeOperationalStats {
  readonly restaurantName: string;
  readonly branchName?: string | null;
  readonly branchAddress?: string | null;
  readonly screenLockPin?: string;
  readonly totalTables: number;
  readonly activeTables: number;
  readonly openOrders: number;
  readonly takeawayOrders: number;
  readonly waitingItems: number;
  readonly readyItems: number;
  readonly todayOrders: number;
  readonly totalCustomers: number;
  readonly newCustomers: number;
  readonly weather?: {
    readonly temperature: number;
    readonly description: string;
    readonly cityName: string;
    readonly iconType: "sun" | "cloud-sun" | "cloud" | "fog" | "rain" | "snow" | "thunder";
  };
  readonly notifications?: readonly HomeNotificationItem[];
  readonly readyToServeItems?: readonly ReadyToServeItemDTO[];
}

function WeatherIcon({ iconType }: { readonly iconType: string }) {
  switch (iconType) {
    case "cloud-sun":
      return <CloudSunIcon className="size-7 sm:size-8 text-amber-500" />;
    case "cloud":
      return <CloudIcon className="size-7 sm:size-8 text-slate-400" />;
    case "rain":
      return <CloudRainIcon className="size-7 sm:size-8 text-blue-500" />;
    case "snow":
      return <SnowflakeIcon className="size-7 sm:size-8 text-sky-400" />;
    case "thunder":
      return <CloudLightningIcon className="size-7 sm:size-8 text-amber-600" />;
    case "fog":
      return <CloudFogIcon className="size-7 sm:size-8 text-gray-400" />;
    default:
      return <SunIcon className="size-7 sm:size-8 text-amber-500" />;
  }
}

export function HomeScreen({
  settings,
  isAdmin = false,
  isStaff = false,
  staffRole = "MANAGER",
  allowedRoutes,
  restaurantUsername,
  operationalStats,
  restaurantName = "Oxonom POS",
  userName = "Yönetici",
  userPhone,
  userEmail,
  userCity,
  userState,
  userPhotoUrl,
  userId = "current-user",
}: {
  readonly settings: Partial<SystemSettingsDTO>;
  readonly isAdmin?: boolean;
  readonly isStaff?: boolean;
  readonly staffRole?: string;
  readonly allowedRoutes?: readonly string[] | null;
  readonly restaurantUsername: string | null;
  readonly operationalStats?: HomeOperationalStats | null;
  readonly restaurantName?: string;
  readonly userName?: string;
  readonly userPhone?: string | null;
  readonly userEmail?: string | null;
  readonly userCity?: string | null;
  readonly userState?: string | null;
  readonly userPhotoUrl?: string | null;
  readonly userId?: string;
}) {
  const router = useRouter();

  // Canlı Saat & Tarih State
  const [timeStr, setTimeStr] = useState("16:04");
  const [dateStr, setDateStr] = useState("29 Ocak 2026, Perşembe");
  const [isOnline, setIsOnline] = useState(true);

  // Modals state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedDetailNotif, setSelectedDetailNotif] = useState<SystemNotificationItem | null>(null);

  // Kalıcı Bildirim Senkronizasyonu (Sayfa yenilendiğinde temizlenen bildirimlerin gelmemesi için)
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  useEffect(() => {
    const loadDismissed = () => {
      try {
        const stored = localStorage.getItem("oxonompos_dismissed_notifications");
        if (stored) {
          setDismissedNotifIds(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    };
    loadDismissed();

    window.addEventListener("notifications-cleared", loadDismissed);
    return () => window.removeEventListener("notifications-cleared", loadDismissed);
  }, []);

  // Active Account State (for fast switching and dynamic permission filtering)
  const initialAccount: StaffAccount = useMemo(
    () => ({
      id: userId,
      name: userName,
      role: staffRole,
      allowedRoutes,
      phone: userPhone,
      email: userEmail,
      city: userCity,
      state: userState,
      photoUrl: userPhotoUrl,
    }),
    [userId, userName, staffRole, allowedRoutes, userPhone, userEmail, userCity, userState, userPhotoUrl]
  );

  const [activeAccount, setActiveAccount] = useState<StaffAccount>(initialAccount);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedAccountRaw = localStorage.getItem("adisyon_active_staff_account");
        if (savedAccountRaw) {
          const parsed = JSON.parse(savedAccountRaw);
          if (parsed && parsed.id) {
            setActiveAccount(parsed);
          }
        }
      } catch {
        // ignore
      }
    }

    const handleAccountChange = (e: Event) => {
      const customEvent = e as CustomEvent<StaffAccount>;
      if (customEvent.detail) {
        setActiveAccount(customEvent.detail);
      }
    };
    window.addEventListener("active-account-changed", handleAccountChange);
    return () => {
      window.removeEventListener("active-account-changed", handleAccountChange);
    };
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTimeStr(`${hours}:${minutes}`);

      const formattedDate = now.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      });
      setDateStr(formattedDate);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ağ bağlantısı dinleyici
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

  // Metrikler (gerçek canlı DB verisi ve akıllı varsayılanlar)
  const stats = useMemo(() => {
    const totalTables = operationalStats?.totalTables ?? 24;
    const activeTables = operationalStats?.activeTables ?? 18;
    const openOrders = operationalStats?.openOrders ?? 24;
    const takeawayOrders = operationalStats?.takeawayOrders ?? 0;
    const waitingItems = operationalStats?.waitingItems ?? 7;
    const readyItems = operationalStats?.readyItems ?? 5;
    const todayOrders = operationalStats?.todayOrders ?? 142;
    const totalCustomers = operationalStats?.totalCustomers ?? 1248;
    const newCustomers = operationalStats?.newCustomers ?? 4;
    const occupancyRate =
      totalTables > 0 ? Math.min(100, Math.round((activeTables / totalTables) * 100)) : 75;

    const weather = operationalStats?.weather ?? {
      temperature: 22,
      description: "Parçalı Bulutlu",
      cityName: operationalStats?.branchName || "İstanbul",
      iconType: "cloud-sun" as const,
    };

    const notifications: readonly HomeNotificationItem[] = operationalStats?.notifications ?? [];

    return {
      totalTables,
      activeTables,
      openOrders,
      takeawayOrders,
      waitingItems,
      readyItems,
      todayOrders,
      totalCustomers,
      newCustomers,
      occupancyRate,
      weather,
      notifications,
    };
  }, [operationalStats]);

  // 6 Temel 3D Material Aksiyon Kartı
  const ALL_ACTION_CARDS = [
    {
      id: "masalar",
      badge: "01",
      title: "Masalar",
      description: "Masalar & Açık Adisyonlar",
      href: "/dashboard/orders",
      icon: ArmchairIcon,
      statLeftValue: `${stats.activeTables}`,
      statLeftLabel: "AKTİF MASA",
      statRightValue: `%${stats.occupancyRate}`,
      statRightLabel: "DOLULUK",
      gradient: "bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af]",
      shadow: "shadow-[0_16px_34px_-6px_rgba(37,99,235,0.42),0_4px_12px_rgba(0,0,0,0.16)]",
      border: "border-t border-t-blue-200/60 border-x border-blue-300/30 border-b-[3px] border-b-black/35",
      insetHighlight: "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
      badgeBg: "bg-white/20 border border-white/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
      circleBg: "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.25)]",
    },
    {
      id: "mutfak",
      badge: "02",
      title: "Mutfak",
      description: "KOT & Hazırlık Takibi",
      href: "/dashboard/kitchen",
      icon: ChefHatIcon,
      statLeftValue: `${stats.waitingItems}`,
      statLeftLabel: "BEKLEYEN",
      statRightValue: `${stats.readyItems}`,
      statRightLabel: "SERVİSE HAZIR",
      gradient: "bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#9a3412]",
      shadow: "shadow-[0_16px_34px_-6px_rgba(234,88,12,0.42),0_4px_12px_rgba(0,0,0,0.16)]",
      border: "border-t border-t-orange-200/60 border-x border-orange-300/30 border-b-[3px] border-b-black/35",
      insetHighlight: "shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
      badgeBg: "bg-white/20 border border-white/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
      circleBg: "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.25)]",
    },
    {
      id: "pos",
      badge: "03",
      title: "POS / Kasa",
      description: "Hızlı Sipariş & Tahsilat",
      href: "/dashboard/pos",
      icon: CalculatorIcon,
      statLeftValue: `${stats.openOrders}`,
      statLeftLabel: "AÇIK ADİSYON",
      statRightValue: "Hızlı Kasa",
      statRightLabel: "TERMINAL HAZIR",
      gradient: "bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46]",
      shadow: "shadow-[0_16px_34px_-6px_rgba(16,185,129,0.42),0_4px_12px_rgba(0,0,0,0.16)]",
      border: "border-t border-t-emerald-200/60 border-x border-emerald-300/30 border-b-[3px] border-b-black/35",
      insetHighlight: "shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
      badgeBg: "bg-white/20 border border-white/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
      circleBg: "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.25)]",
    },
    {
      id: "analitik",
      badge: "04",
      title: "Analitik",
      description: "Operasyonel Günlük Raporlar",
      href: "/dashboard",
      icon: BarChart3Icon,
      statLeftValue: `${stats.todayOrders}`,
      statLeftLabel: "GÜNLÜK SİPARİŞ",
      statRightValue: "Trendler",
      statRightLabel: "ANLIK ANALİZ",
      gradient: "bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#5b21b6]",
      shadow: "shadow-[0_16px_34px_-6px_rgba(124,58,237,0.42),0_4px_12px_rgba(0,0,0,0.16)]",
      border: "border-t border-t-purple-200/60 border-x border-purple-300/30 border-b-[3px] border-b-black/35",
      insetHighlight: "shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
      badgeBg: "bg-white/20 border border-white/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
      circleBg: "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.25)]",
    },
    {
      id: "musteriler",
      badge: "05",
      title: "Müşteriler",
      description: "Sadakat & Müşteri Takibi",
      href: "/dashboard/customers",
      icon: TrendingUpIcon,
      statLeftValue: `${stats.totalCustomers.toLocaleString("tr-TR")}`,
      statLeftLabel: "TOPLAM KAYIT",
      statRightValue: `${stats.newCustomers}`,
      statRightLabel: "BUGÜN YENİ",
      gradient: "bg-gradient-to-br from-[#e11d48] via-[#be123c] to-[#9f1239]",
      shadow: "shadow-[0_16px_34px_-6px_rgba(225,29,72,0.42),0_4px_12px_rgba(0,0,0,0.16)]",
      border: "border-t border-t-rose-200/60 border-x border-rose-300/30 border-b-[3px] border-b-black/35",
      insetHighlight: "shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.2)]",
      badgeBg: "bg-white/20 border border-white/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
      circleBg: "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.25)]",
    },
    {
      id: "sistem",
      badge: "06",
      title: "Sistem",
      description: "Menü, Masa, Stok, Z Raporu",
      href: "/dashboard/system",
      icon: SlidersHorizontalIcon,
      statLeftValue: "Ayarlar",
      statLeftLabel: "YAPILANDIRMA",
      statRightValue: "Yönetim",
      statRightLabel: "SİSTEM",
      gradient: "bg-gradient-to-br from-[#334155] via-[#1e293b] to-[#0f172a]",
      shadow: "shadow-[0_16px_34px_-6px_rgba(51,65,85,0.45),0_4px_12px_rgba(0,0,0,0.18)]",
      border: "border-t border-t-slate-300/60 border-x border-slate-400/30 border-b-[3px] border-b-black/40",
      insetHighlight: "shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.25)]",
      badgeBg: "bg-white/20 border border-white/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
      circleBg: "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.25)]",
    },
  ];

  // Personel / Kullanıcı yetkisine göre dinamik kart filtreleme
  const visibleCards = useMemo(() => {
    // Sadece serbest yetkili ana yönetici (allowedRoutes null olan) tüm kartları görür
    if (!activeAccount.allowedRoutes) {
      return ALL_ACTION_CARDS;
    }

    const routes = activeAccount.allowedRoutes;
    return ALL_ACTION_CARDS.filter((card) => {
      return hasPermissionForRoute(routes, card.href);
    });
  }, [activeAccount]);

  const visibleNotifications = useMemo(() => {
    return (stats.notifications || []).filter((n) => !dismissedNotifIds.includes(n.id));
  }, [stats.notifications, dismissedNotifIds]);

  const displayBranch = operationalStats?.branchName || restaurantName;
  const currentYear = new Date().getFullYear();

  const isWaiter =
    (activeAccount.role || staffRole || "").toUpperCase() === "WAITER" ||
    (activeAccount.role || "").toLowerCase() === "garson";

  return (
    <div className="relative w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] bg-background text-foreground p-2.5 sm:p-5 lg:p-6 pb-4 sm:pb-6 flex flex-col justify-between gap-3 sm:gap-5 selection:bg-primary/20">
      {/* Background Grid Texture */}
      <GridPattern
        width={36}
        height={36}
        className="pointer-events-none absolute inset-0 size-full stroke-border/40 opacity-25 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]"
      />

      {/* WORLD-CLASS MOTION DESIGN KEYFRAMES (FLUID & REFINED) */}
      <style jsx global>{`
        @keyframes sleekFadeIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .anim-sleek {
          animation: sleekFadeIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gradientBorderAnimation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-border {
          background-size: 200% 200%;
          animation: gradientBorderAnimation 4s ease infinite;
        }
        @keyframes soundWave {
          0%, 100% {
            height: 4px;
          }
          50% {
            height: 18px;
          }
        }
        .sound-bar-1 {
          animation: soundWave 0.6s ease-in-out infinite;
        }
        .sound-bar-2 {
          animation: soundWave 0.8s ease-in-out infinite 0.15s;
        }
        .sound-bar-3 {
          animation: soundWave 0.5s ease-in-out infinite 0.3s;
        }
        .sound-bar-4 {
          animation: soundWave 0.7s ease-in-out infinite 0.1s;
        }
        .sound-bar-5 {
          animation: soundWave 0.9s ease-in-out infinite 0.25s;
        }
      `}</style>

      {/* 
        1. MOBİL ÜST HEADER (YALNIZCA MOBİLDE GÖRÜNÜR)
      */}
      <header className="flex lg:hidden flex-col gap-2.5 w-full z-10 px-1 py-1">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="relative h-8 sm:h-9 w-36 sm:w-44 shrink-0">
            <Image
              src={settings.logoUrl || "/logo-oxonom-horizontal.png"}
              alt={settings.systemName || "Oxonom POS"}
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <StaffAccountMenu
              initialAccount={initialAccount}
              onActiveAccountChange={setActiveAccount}
              isMobile={true}
            />
            <button
              type="button"
              onClick={() => setIsLockModalOpen(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-amber-400 shadow-xs active:scale-90 transition-all cursor-pointer"
              title="Ekranı Kilitle"
            >
              <LockIcon className="size-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Mobilde Yatay Kaydırılabilir Rozetler */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0",
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            )}
          >
            <WifiIcon className="size-3" />
            <span>{isOnline ? "İnternet Bağlı" : "Bağlantı Yok"}</span>
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0",
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}
          >
            <ServerIcon className="size-3" />
            <span>{isOnline ? "Sunucu Bağlı" : "Lokal Sunucu"}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-gray-700 border border-gray-200 text-[11px] font-bold shrink-0 shadow-2xs">
            <MapPinIcon className="size-3 text-blue-600" />
            <span>Şube: {displayBranch}</span>
          </span>

          {hasPermissionForRoute(activeAccount.allowedRoutes, "/dashboard/modules") && (
            <Link
              href="/dashboard/modules"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-black shrink-0"
            >
              <SparklesIcon className="size-3 text-purple-600" />
              <span>Modüller</span>
            </Link>
          )}
        </div>
      </header>

      {/* 
        2. ANA GÖVDE: SOL PANEL (STACKED LOGO + OPERASYON + BİLDİRİMLER + DESTEK) + SAĞ ALAN (DESKTOP HEADER + 6 KART)
      */}
      <main className="w-full flex flex-col lg:flex-row gap-3.5 sm:gap-5 items-start flex-1 z-10">
        {/* SOL PANEL (Masaüstü W-[280px] - XL:W-[310px]) */}
        <aside className="w-full lg:w-[280px] xl:w-[310px] shrink-0 flex flex-col gap-3 sm:gap-4 order-2 lg:order-1">
          {/* 1. MASAÜSTÜ STACKED LOGO */}
          <div className="hidden lg:flex items-center justify-center p-2 mb-1">
            <div className="relative h-24 xl:h-28 w-full max-w-[240px]">
              <Image
                src={settings.logoDarkUrl || "/logo-oxonom-stacked.png"}
                alt={settings.systemName || "Oxonom POS"}
                fill
                className="object-contain object-center drop-shadow-xs select-none"
                priority
              />
            </div>
          </div>

          {/* 2. OPERASYON ÖZETİ (%100 GERÇEK CANLI DB) */}
          <div
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-t border-t-white border-x border-gray-200/90 border-b-[3px] border-b-gray-300/80 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-3"
            style={{ animationDelay: "35ms" }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="size-4 text-rose-500" />
                <h2 className="text-xs sm:text-sm font-black text-gray-900">Operasyon Özeti</h2>
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Canlı
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              {/* Aktif Masalar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <ArmchairIcon className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Aktif Masalar</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-900 tabular-nums">
                  {stats.activeTables}
                </span>
              </div>

              {/* Açık Adisyonlar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CalculatorIcon className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Açık Adisyon</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-900 tabular-nums">
                  {stats.openOrders}
                </span>
              </div>

              {/* Mutfak Bekleyen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <ChefHatIcon className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Mutfak Bekleyen</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-900 tabular-nums">
                  {stats.waitingItems}
                </span>
              </div>

              {/* Online / Paket Sipariş */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                    <ShoppingBagIcon className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Paket Sipariş</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-900 tabular-nums">
                  {stats.takeawayOrders}
                </span>
              </div>

              {/* Hazır / Servis Bekleyen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                    <CheckCircle2Icon className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Hazır Servis</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-900 tabular-nums">
                  {stats.readyItems}
                </span>
              </div>
            </div>
          </div>

          {/* 3. SİSTEM BİLDİRİMLERİ */}
          <div
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-t border-t-white border-x border-gray-200/90 border-b-[3px] border-b-gray-300/80 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-2.5"
            style={{ animationDelay: "70ms" }}
          >
            <div
              onClick={() => setIsNotifModalOpen(true)}
              className="flex items-center justify-between pb-1 border-b border-gray-100 cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <BellIcon className="size-4 text-indigo-600 group-hover:text-primary transition-colors" />
                <h2 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
                  Sistem Bildirimleri
                </h2>
              </div>
              {visibleNotifications.filter((n) => !n.isRead).length > 0 && (
                <span className="flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black animate-in zoom-in duration-150">
                  {visibleNotifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {visibleNotifications.length === 0 ? (
                <div
                  onClick={() => setIsNotifModalOpen(true)}
                  className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded-xl transition-all border bg-gray-50/60 border-gray-100 hover:bg-gray-100/70"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-600 text-xs font-black shadow-2xs">
                      📢
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        Yeni özellik eklendi !
                      </span>
                      <span className="text-[10px] text-gray-500 truncate">
                        Yapay zeka modülümüzü denediniz...
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                    23 sa önce
                  </span>
                </div>
              ) : (
                visibleNotifications.slice(0, 2).map((n, i) => (
                  <div
                    key={n.id || i}
                    onClick={() => setSelectedDetailNotif(n)}
                    className={cn(
                      "flex items-center justify-between gap-2 cursor-pointer p-2 rounded-xl transition-all border",
                      n.isRead
                        ? "bg-gray-50/60 border-gray-100 hover:bg-gray-100/70"
                        : "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-100/60"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-2xs",
                          n.isRead
                            ? "bg-gray-200 text-gray-600"
                            : "bg-indigo-600 text-white"
                        )}
                      >
                        📢
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">
                          {n.description || n.message}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                      {n.timeAgo}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsNotifModalOpen(true)}
              className="mt-1 inline-flex items-center justify-between text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors pt-2 border-t border-gray-100 group cursor-pointer"
            >
              <span>Tüm bildirimleri göster</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>

          {/* 4. GERİ BİLDİRİM & İSTEK (DESTEK) */}
          <div
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-t border-t-white border-x border-indigo-100 border-b-[3px] border-b-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 shadow-[0_10px_24px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-2.5"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-indigo-100/60">
              <div className="flex items-center gap-2">
                <MessageSquareQuoteIcon className="size-4 text-indigo-600" />
                <h2 className="text-xs sm:text-sm font-black text-gray-900">
                  Geri Bildirim & İstek
                </h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Destek
              </span>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              Öneri, yeni özellik isteği, şikayet veya sistem hatalarını doğrudan ekibimize bildirin.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-feedback-modal", {
                      detail: { category: "SUGGESTION", captureScreen: false },
                    })
                  );
                }}
                className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-black text-white shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <SendIcon className="size-3.5 text-white" />
                <span>Geri Bildirim Gönder</span>
              </button>
            </div>
          </div>
        </aside>

        {/* SAĞ TARAF: MASAÜSTÜ HEADER BAR + 6 AKSİYON KARTI GRID'İ */}
        <div className="flex-1 flex flex-col gap-3.5 sm:gap-4 w-full min-w-0 order-1 lg:order-2">
          {/* MASAÜSTÜ HEADER BAR */}
          <header className="hidden lg:flex items-center justify-end gap-2.5 flex-wrap w-full py-0.5">
            {/* İnternet Durumu */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs",
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}
              title={isOnline ? "İnternet Bağlantısı Aktif" : "İnternet Yok"}
            >
              <WifiIcon className="size-3.5" />
              <span>{isOnline ? "İnternet Bağlı" : "Bağlantı Yok"}</span>
            </div>

            {/* Sunucu Durumu */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-2xs transition-all",
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}
              title={isOnline ? "Merkezi Bulut Sunucu Aktif" : "Yerel Ağ / Lokal Sunucu"}
            >
              <ServerIcon className="size-3.5" />
              <span>{isOnline ? "Sunucu Bağlı" : "Lokal Sunucu"}</span>
            </div>

            {/* Şube Bilgisi */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-gray-700 border border-gray-200 text-xs font-bold shadow-2xs"
              title={`Şube: ${displayBranch}`}
            >
              <MapPinIcon className="size-3.5 text-blue-600" />
              <span>Şube: {displayBranch}</span>
            </div>

            {/* Modüller Butonu (Yetki Kontrollü) */}
            {hasPermissionForRoute(activeAccount.allowedRoutes, "/dashboard/modules") && (
              <Link
                href="/dashboard/modules"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black shadow-2xs transition-all cursor-pointer"
                title="Sistem ve Yapay Zeka Modülleri"
              >
                <SparklesIcon className="size-3.5 text-purple-600" />
                <span>Modüller</span>
              </Link>
            )}

            {/* Ekranı Kilitle Butonu */}
            <button
              type="button"
              onClick={() => setIsLockModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
              title="Terminal Ekranını Kilitle"
            >
              <LockIcon className="size-3.5 text-amber-400" />
              <span>Ekranı Kilitle</span>
            </button>

            {/* Personel / Hesap Değiştirici Menüsü */}
            <StaffAccountMenu
              initialAccount={initialAccount}
              onActiveAccountChange={setActiveAccount}
              isMobile={false}
            />
          </header>

          {/* 6 AKSİYON KARTI GRID'İ (3 SÜTUN X 2 SATIR) */}
          <section className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 w-full">
            {visibleCards.map((card, index) => {
              const Icon = card.icon;
              const patternId = `home-pat-${card.id}`;
              const isSingleCardWaiter = visibleCards.length === 1 && isWaiter;

              return (
                <Link
                  key={card.id}
                  href={card.href}
                  prefetch={true}
                  className={cn(
                    "anim-sleek group relative flex flex-col justify-between p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl",
                    "text-white overflow-hidden select-none cursor-pointer transition-all duration-200",
                    card.gradient,
                    card.shadow,
                    card.border,
                    card.insetHighlight,
                    isSingleCardWaiter && "col-span-2 md:col-span-1 xl:col-span-1",
                    "transform-gpu will-change-transform",
                    "hover:-translate-y-1.5 hover:shadow-2xl",
                    "active:translate-y-1 active:scale-[0.985] active:border-b-2 active:shadow-md",
                    "min-h-[195px] sm:min-h-[250px] xl:min-h-[265px]"
                  )}
                  style={{
                    animationDelay: `${index * 35 + 90}ms`,
                  }}
                >
                  {/* 3D Material Background Textures */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                    <svg
                      className="absolute inset-0 size-full opacity-[0.07] mix-blend-overlay"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id={patternId}
                          width="24"
                          height="24"
                          patternUnits="userSpaceOnUse"
                        >
                          <circle cx="2" cy="2" r="1.1" fill="white" />
                          <circle cx="14" cy="14" r="0.9" fill="white" />
                          <path
                            d="M24 0H0V24"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.5"
                            strokeDasharray="2 4"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                    </svg>

                    <svg
                      className="absolute -bottom-8 -right-8 w-44 h-44 opacity-[0.09] text-white pointer-events-none"
                      viewBox="0 0 160 160"
                      fill="none"
                    >
                      <circle cx="80" cy="80" r="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx="80" cy="80" r="52" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                    </svg>

                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-t-[inherit]" />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 via-black/10 to-transparent pointer-events-none rounded-b-[inherit]" />
                    <div className="absolute -top-12 -left-12 size-40 rounded-full bg-white/15 blur-2xl pointer-events-none" />
                  </div>

                  {/* 1. Üst Sıra: Rozet & Sağ Yön Oku */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider backdrop-blur-xs",
                        card.badgeBg
                      )}
                    >
                      {card.badge}
                    </span>

                    <div className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-white/15 border border-white/30 text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all duration-200 group-hover:bg-white group-hover:text-gray-900 group-hover:translate-x-0.5">
                      <span className="text-xs sm:text-sm font-black leading-none">→</span>
                    </div>
                  </div>

                  {/* 2. Orta: 3D Kabartmalı Dairesel İkon & Başlık & Açıklama */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-1 sm:py-2">
                    <div
                      className={cn(
                        "flex size-14 sm:size-18 lg:size-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                        card.circleBg
                      )}
                    >
                      <Icon className="size-7 sm:size-9 lg:size-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                    </div>

                    <h3 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight mt-2 sm:mt-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition-all">
                      {card.title}
                    </h3>

                    <p className="text-[10px] sm:text-xs font-semibold text-white/85 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] line-clamp-1 hidden sm:block">
                      {card.description}
                    </p>
                  </div>

                  {/* 3. Alt: Gömülü 3D LCD Metrik Paneli */}
                  <div className="relative z-10 grid grid-cols-2 gap-1.5 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/20 border border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xs text-center mt-1">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-xs sm:text-base font-black text-white tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                        {card.statLeftValue}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-white/80 uppercase tracking-wider">
                        {card.statLeftLabel}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center border-l border-white/15">
                      <span className="text-xs sm:text-base font-black text-white tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                        {card.statRightValue}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-white/80 uppercase tracking-wider">
                        {card.statRightLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>

          {/* SADECE GARSON EKRANINDA GÖZÜKEN SERVİSE HAZIR ÜRÜNLER ALANI */}
          {isWaiter && (
            <WaiterReadyItemsPanel
              initialItems={operationalStats?.readyToServeItems}
              className="col-span-full"
            />
          )}
        </div>
      </main>

      {/* 
        3. ALT BAR (OXONOM CORP KURUMSAL FOOTER - DİŞ LINK YOK, KİLİT YOK, SIFIR FAZLA BOŞLUK)
      */}
      <footer
        className="w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-t border-t-white border-x border-gray-200/90 border-b-[2.5px] border-b-gray-300/80 bg-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-600 mb-0 z-10"
      >
        {/* Sol: Yatay Sistem Logosu + Slogan */}
        <div className="flex items-center gap-3">
          <div className="relative h-7 w-28 sm:w-36">
            <Image
              src={settings.logoUrl || "/logo-oxonom-horizontal.png"}
              alt="Oxonom POS"
              fill
              className="object-contain object-left"
            />
          </div>

          <span className="text-[11px] text-gray-400 hidden sm:inline-block border-l border-gray-200 pl-3">
            {settings.systemTagline || "Gelişmiş Restoran & QR Menü Yönetim Sistemi"}
          </span>
        </div>

        {/* Orta: Telif Hakkı (© {yıl} OXONOM CORP. | {sistem adı} Tüm hakları saklıdır.) */}
        <div className="text-center text-[11px] text-gray-500">
          © {currentYear} OXONOM CORP. | {settings.systemName || "Oxonom Pos"} Tüm hakları saklıdır.
        </div>

        {/* Sağ: www.oxonom.com & Destek Hattı */}
        <div className="flex items-center gap-4 text-xs font-mono font-bold text-gray-600">
          <span className="text-gray-500">www.oxonom.com</span>

          <div className="flex items-center gap-1.5 text-gray-700 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
            <HeadphonesIcon className="size-3.5 text-primary" />
            <span className="text-[11px] font-black">{settings.supportPhone || "+90 850 309 9901"}</span>
          </div>
        </div>
      </footer>

      {/* SİSTEM DEĞİŞİKLİK VE İŞLEM GÜNLÜĞÜ MODAL (ELASTİK POPUP) */}
      <SystemActivityLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />

      {/* AÇILIR TAM EKRAN BİLDİRİM PANELİ MODAL */}
      <HomeNotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={visibleNotifications}
      />

      {/* SİSTEM BİLDİRİMİ DETAY MODALI (MOBİLDE ALTTAN AÇILIR, MASAÜSTÜNDE POPUP) */}
      <SystemNotificationDetailModal
        notification={selectedDetailNotif}
        isOpen={Boolean(selectedDetailNotif)}
        onClose={() => setSelectedDetailNotif(null)}
        onStatusChange={(id, newReadState) => {
          if (selectedDetailNotif && selectedDetailNotif.id === id) {
            setSelectedDetailNotif({ ...selectedDetailNotif, isRead: newReadState });
          }
        }}
        onDelete={(id) => {
          setDismissedNotifIds((prev) => [...prev, id]);
          setSelectedDetailNotif(null);
        }}
      />

      {/* EKRAN KİLİDİ MODAL */}
      <HomeScreenLockModal
        isLocked={isLockModalOpen}
        onUnlock={() => setIsLockModalOpen(false)}
        correctPin={operationalStats?.screenLockPin || "0000"}
        restaurantName={restaurantName}
        logoUrl={settings.logoUrl || settings.logoDarkUrl}
      />
    </div>
  );
}
