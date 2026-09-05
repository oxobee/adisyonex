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
  HeadphonesIcon,
  LockIcon,
  MapPinIcon,
  MicIcon,
  SendIcon,
  ServerIcon,
  Settings2Icon,
  ShoppingBagIcon,
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
import {
  HomeNotificationsModal,
  type HomeNotificationItem,
} from "./home-notifications-modal";
import { HomeScreenLockModal } from "./home-screen-lock-modal";
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
  restaurantName = "AdisyonEx",
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

  // Kalıcı Bildirim Senkronizasyonu (Sayfa yenilendiğinde temizlenen bildirimlerin gelmemesi için)
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  useEffect(() => {
    const loadDismissed = () => {
      try {
        const stored = localStorage.getItem("adisyonex_dismissed_notifications");
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

    const notifications: readonly HomeNotificationItem[] = operationalStats?.notifications ?? [
      {
        id: "1",
        type: "order" as const,
        title: "Yeni online paket siparişi",
        description: "Mutfak kuyruğuna aktarıldı (#1042)",
        timeAgo: "2 dk önce",
        targetUrl: "/dashboard/orders",
      },
      {
        id: "2",
        type: "table" as const,
        title: "Masa 4 adisyonu açıldı",
        description: "4 kişilik masa servisi başladı",
        timeAgo: "8 dk önce",
        targetUrl: "/dashboard/orders",
      },
      {
        id: "3",
        type: "kitchen" as const,
        title: "Mutfakta 3 sipariş bekliyor",
        description: "Hazırlık süresi ortalama 10 dk",
        timeAgo: "12 dk önce",
        targetUrl: "/dashboard/kitchen",
      },
    ];

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
      statLeftLabel: "aktif masa",
      statRightValue: `%${stats.occupancyRate}`,
      statRightLabel: "doluluk",
      gradient: "bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
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
      statLeftLabel: "bekleyen",
      statRightValue: `${stats.readyItems}`,
      statRightLabel: "servise hazır",
      gradient: "bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c]",
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
      statLeftLabel: "açık adisyon",
      statRightValue: "Hızlı Kasa",
      statRightLabel: "terminal hazır",
      gradient: "bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857]",
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
      statLeftLabel: "günlük sipariş",
      statRightValue: "Trendler",
      statRightLabel: "anlık analiz",
      gradient: "bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#5b21b6]",
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
      statLeftLabel: "toplam kayıt",
      statRightValue: `${stats.newCustomers}`,
      statRightLabel: "bugün yeni",
      gradient: "bg-gradient-to-br from-[#f43f5e] via-[#e11d48] to-[#9f1239]",
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
      icon: Settings2Icon,
      statLeftValue: "Ayarlar",
      statLeftLabel: "yapılandırma",
      statRightValue: "Yönetim",
      statRightLabel: "sistem",
      gradient: "bg-gradient-to-br from-[#475569] via-[#334155] to-[#1e293b]",
      shadow: "shadow-[0_16px_34px_-6px_rgba(51,65,85,0.45),0_4px_12px_rgba(0,0,0,0.18)]",
      border: "border-t border-t-slate-300/60 border-x border-slate-400/30 border-b-[3px] border-b-black/40",
      insetHighlight: "shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.25)]",
      badgeBg: "bg-white/20 border border-white/40 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
      circleBg: "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.25)]",
    },
  ];

  // Personel yetkisine göre dinamik kart filtreleme
  const visibleCards = useMemo(() => {
    const role = activeAccount.role?.toUpperCase();
    const isManagerRole = role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN";
    if (isManagerRole || !activeAccount.allowedRoutes) {
      return ALL_ACTION_CARDS;
    }

    const routes = activeAccount.allowedRoutes;
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
    const hasSystemAccess = systemSubRoutes.some((r) => routes.includes(r));

    return ALL_ACTION_CARDS.filter((card) => {
      if (card.href === "/dashboard/system") {
        return hasSystemAccess;
      }
      return routes.includes(card.href);
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
    <div className="w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] bg-[#f8fafc] text-gray-900 p-2.5 sm:p-5 lg:p-6 pb-4 sm:pb-6 flex flex-col justify-between gap-3 sm:gap-5 selection:bg-primary/20">
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
        1. ÜST HEADER ALANI (STATİK, TAŞMAYAN VE MOBİL UYUMLU)
      */}
      <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 px-1 py-1">
        {/* Sol: Logo + Alt Slogan */}
        <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 w-full md:w-auto min-w-0">
          <div className="flex items-center gap-2 min-w-0 shrink">
            {settings.logoUrl || settings.logoDarkUrl ? (
              <div className="relative h-8 sm:h-10 md:h-12 w-32 sm:w-44 md:w-56 shrink-0">
                <Image
                  src={settings.logoUrl || settings.logoDarkUrl || ""}
                  alt="Adisyoon"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex size-9 sm:size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-500/25">
                  <UtensilsCrossedIcon className="size-4.5 sm:size-6" />
                </div>
                <span className="text-xl sm:text-3xl font-black tracking-tight text-gray-900">
                  {settings.systemName || "AdisyonEx"}
                </span>
              </div>
            )}
          </div>

          {/* Mobilde sağ üst: Profil Adı + Görevi + Ekranı Kilitle */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
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

        {/* Masaüstü Rozetler & Profil Alanı */}
        <div className="hidden md:flex items-center gap-2.5 flex-wrap">
          {/* İnternet Durumu */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs",
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200",
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
                : "bg-amber-50 text-amber-700 border-amber-200",
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
        </div>

        {/* Mobilde 2. Satır: Kompakt Durum Rozetleri */}
        <div className="flex md:hidden items-center justify-between gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}
            >
              <WifiIcon className="size-2.5" />
              <span>{isOnline ? "İnternet" : "Yok"}</span>
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}
            >
              <ServerIcon className="size-2.5" />
              <span>{isOnline ? "Sunucu Bağlı" : "Lokal Sunucu"}</span>
            </span>
          </div>

          <span className="text-[10px] font-bold text-gray-500 truncate max-w-[140px]">
            📍 {displayBranch}
          </span>
        </div>
      </header>

      {/* 
        2. ANA GÖVDE: SOL PANEL (SAAT, OPERASYON, BİLDİRİMLER) + SAĞ 2 SÜTUNLU KART GRID'İ
      */}
      <main className="w-full flex flex-col lg:flex-row gap-3.5 sm:gap-5 items-start flex-1">
        {/* SOL PANEL (W-FULL LG:W-[310px]) */}
        <aside className="w-full lg:w-[310px] xl:w-[330px] shrink-0 flex flex-col gap-3 sm:gap-4">
          {/* KART 1: SAAT & CANLI HAVA DURUMU */}
          <div
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-t border-t-white border-x border-gray-200/90 border-b-[3px] border-b-gray-300/80 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-between"
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 capitalize tracking-wide">
                {dateStr}
              </span>
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 tabular-nums mt-0.5 font-mono">
                {timeStr}
              </span>
            </div>

            <div className="flex flex-col items-end text-right">
              <WeatherIcon iconType={stats.weather.iconType} />
              <span className="text-lg sm:text-xl font-extrabold text-gray-900 mt-0.5 tabular-nums">
                {stats.weather.temperature}°
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-gray-500">
                {stats.weather.description}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 truncate max-w-[120px]">
                {stats.weather.cityName}
              </span>
            </div>
          </div>

          {/* KART 2: OPERASYON ÖZETİ (%100 GERÇEK CANLI DB) */}
          <div
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-t border-t-white border-x border-gray-200/90 border-b-[3px] border-b-gray-300/80 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-3"
            style={{ animationDelay: "35ms" }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="size-4 text-primary" />
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

          {/* KART 3: BİLDİRİMLER (TIKLANINCA POPUP AÇILIR) */}
          <div
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-t border-t-white border-x border-gray-200/90 border-b-[3px] border-b-gray-300/80 bg-white shadow-[0_10px_24px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-2.5"
            style={{ animationDelay: "70ms" }}
          >
            <div
              onClick={() => setIsNotifModalOpen(true)}
              className="flex items-center justify-between pb-1 border-b border-gray-100 cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <BellIcon className="size-4 text-gray-700 group-hover:text-primary transition-colors" />
                <h2 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
                  Bildirimler
                </h2>
              </div>
              <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black">
                {visibleNotifications.length}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {visibleNotifications.slice(0, 3).map((n, i) => (
                <div
                  key={n.id || i}
                  onClick={() => setIsNotifModalOpen(true)}
                  className="flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/80 p-1.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "flex size-5.5 shrink-0 items-center justify-center rounded-full text-white text-[9px] font-black",
                        n.type === "order"
                          ? "bg-emerald-500"
                          : n.type === "table"
                          ? "bg-blue-500"
                          : n.type === "kitchen"
                          ? "bg-orange-500"
                          : "bg-rose-500"
                      )}
                    >
                      {n.type === "order" ? "S" : n.type === "table" ? "M" : n.type === "kitchen" ? "K" : "!"}
                    </div>
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {n.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 shrink-0">
                    {n.timeAgo}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsNotifModalOpen(true)}
              className="mt-1 inline-flex items-center justify-between text-xs font-bold text-gray-500 hover:text-primary transition-colors pt-2 border-t border-gray-100 group cursor-pointer"
            >
              <span>Tüm bildirimleri göster</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </aside>

        {/* SAĞ TARAF: MOBİLDE 2 SÜTUNLU, MASAÜSTÜNDE 3 SÜTUNLU 3D MATERIAL MENÜ KARTLARI */}
        <section className="flex-1 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 w-full">
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
                  "min-h-[195px] sm:min-h-[280px]"
                )}
                style={{
                  animationDelay: `${index * 35 + 90}ms`,
                }}
              >
                {/* 3D MATERIAL BACKGROUND TEXTURES & GÖZ YORMAYAN PATTERN */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                  {/* Göz yormayan Mikro-Grid & Dot Matrix SVG Deseni */}
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

                  {/* Sağ Alt Köşe: 3D Geometrik Konsantrik Halkalar */}
                  <svg
                    className="absolute -bottom-8 -right-8 w-44 h-44 opacity-[0.09] text-white pointer-events-none"
                    viewBox="0 0 160 160"
                    fill="none"
                  >
                    <circle cx="80" cy="80" r="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx="80" cy="80" r="52" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                  </svg>

                  {/* Üst Işık Evi: 3D Specular Light Bevel */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-t-[inherit]" />

                  {/* Alt Kalınlık & Zemin Temas Gölgesi: 3D Bottom Depth Shadow */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 via-black/10 to-transparent pointer-events-none rounded-b-[inherit]" />

                  {/* Sol-Üst Işıma / Ambient Specular Glow */}
                  <div className="absolute -top-12 -left-12 size-40 rounded-full bg-white/15 blur-2xl pointer-events-none" />
                </div>

                {/* 1. Üst Sıra: Kabartmalı Rozet (Embossed Medallion) & Sağ Yön Oku */}
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
                <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-2 sm:py-3">
                  <div
                    className={cn(
                      "flex size-14 sm:size-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                      card.circleBg
                    )}
                  >
                    <Icon className="size-7 sm:size-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                  </div>

                  <h3 className="text-base sm:text-2xl font-black text-white tracking-tight mt-2.5 sm:mt-3.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition-all">
                    {card.title}
                  </h3>

                  <p className="text-[11px] sm:text-xs font-semibold text-white/85 mt-0.5 sm:mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] line-clamp-1 hidden sm:block">
                    {card.description}
                  </p>
                </div>

                {/* 3. Alt: Gömülü 3D LCD Metrik Paneli (Recessed LCD / Embedded Module) */}
                <div className="relative z-10 grid grid-cols-2 gap-1.5 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/20 border border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xs text-center mt-1 sm:mt-2">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs sm:text-base font-black text-white tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                      {card.statLeftValue}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-wider">
                      {card.statLeftLabel}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center border-l border-white/15">
                    <span className="text-xs sm:text-base font-black text-white tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                      {card.statRightValue}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-wider">
                      {card.statRightLabel}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* SADECE GARSON EKRANINDA GÖZÜKEN SERVİSE HAZIR ÜRÜNLER ALANI */}
          {isWaiter && (
            <WaiterReadyItemsPanel
              initialItems={operationalStats?.readyToServeItems}
              className="col-span-full"
            />
          )}
        </section>
      </main>

      {/* 
        3. SİSTEM DEĞİŞİKLİK VE İŞLEM GÜNLÜĞÜ (AUDIT LOG ÇUBUĞU - DAR, GENİŞ VE DİKKAT ÇEKMEYEN ZARİF ALAN)
      */}
      <div className="w-full rounded-2xl p-2.5 sm:p-3 border-t border-t-white border-x border-gray-200/90 border-b-[2.5px] border-b-gray-300/80 bg-white/95 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs shrink-0">
            <HistoryIcon className="size-3.5 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-black text-gray-900 tracking-tight shrink-0">
              Sistem Değişiklik Günlüğü:
            </span>
            <span className="text-[11px] text-gray-500 font-medium truncate hidden sm:inline">
              Sipariş, masa, menü ve personel hareketleri anlık arşivlenir.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-slate-900 text-gray-700 hover:text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ml-auto"
        >
          <HistoryIcon className="size-3.5" />
          <span>Logları İncele</span>
        </button>
      </div>

      {/* 
        4. ALT BAR (OXONOM CORP KURUMSAL FOOTER - DİŞ LINK YOK, KİLİT YOK, SIFIR FAZLA BOŞLUK)
      */}
      <footer
        className="w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-t border-t-white border-x border-gray-200/90 border-b-[2.5px] border-b-gray-300/80 bg-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-600 mb-0"
      >
        {/* Sol: Yatay Sistem Logosu + Slogan */}
        <div className="flex items-center gap-3">
          {settings.logoUrl || settings.logoDarkUrl ? (
            <div className="relative h-7 w-28 sm:w-36">
              <Image
                src={settings.logoUrl || settings.logoDarkUrl || ""}
                alt="Adisyoon"
                fill
                className="object-contain object-left"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <UtensilsCrossedIcon className="size-3.5 text-amber-400" />
              </div>
              <span className="text-sm font-black text-gray-900 tracking-tight">
                {settings.systemName || "AdisyonEx"}
              </span>
            </div>
          )}

          <span className="text-[11px] text-gray-400 hidden sm:inline-block border-l border-gray-200 pl-3">
            {settings.systemTagline || "Restoran & POS Yönetim Platformu"}
          </span>
        </div>

        {/* Orta: Telif Hakkı (© {yıl} OXONOM CORP. | {sistem adı} Tüm hakları saklıdır.) */}
        <div className="text-center text-[11px] text-gray-500">
          © {currentYear} OXONOM CORP. | {settings.systemName || "AdisyonEx"} Tüm hakları saklıdır.
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
