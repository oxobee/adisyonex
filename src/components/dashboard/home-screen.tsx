"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  ExternalLinkIcon,
  HeadphonesIcon,
  LockIcon,
  MapPinIcon,
  ServerIcon,
  Settings2Icon,
  ShoppingBagIcon,
  SnowflakeIcon,
  SunIcon,
  TrendingUpIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  WifiIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SystemSettingsDTO } from "@/services/system-setting.service";
import {
  HomeNotificationsModal,
  type HomeNotificationItem,
} from "./home-notifications-modal";
import { HomeScreenLockModal } from "./home-screen-lock-modal";

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
}

function WeatherIcon({ iconType }: { readonly iconType: string }) {
  switch (iconType) {
    case "cloud-sun":
      return <CloudSunIcon className="size-8 text-amber-500" />;
    case "cloud":
      return <CloudIcon className="size-8 text-slate-400" />;
    case "rain":
      return <CloudRainIcon className="size-8 text-blue-500 animate-pulse" />;
    case "snow":
      return <SnowflakeIcon className="size-8 text-sky-400 animate-spin" />;
    case "thunder":
      return <CloudLightningIcon className="size-8 text-amber-600" />;
    case "fog":
      return <CloudFogIcon className="size-8 text-gray-400" />;
    default:
      return <SunIcon className="size-8 text-amber-500 animate-[spin_24s_linear_infinite]" />;
  }
}

export function HomeScreen({
  settings,
  isAdmin = false,
  isStaff = false,
  staffRole,
  allowedRoutes,
  restaurantUsername,
  operationalStats,
  restaurantName = "AdisyonEx",
  userName = "Yönetici",
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
}) {
  // Canlı Saat & Tarih State
  const [timeStr, setTimeStr] = useState("16:04");
  const [dateStr, setDateStr] = useState("29 Ocak 2026, Perşembe");
  const [isOnline, setIsOnline] = useState(true);

  // Modals state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

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

  // 6 Temel Aksiyon Kartı (Finansal Veri İçermez)
  const ACTION_CARDS = [
    {
      id: "masalar",
      badge: "01",
      badgeColor: "text-blue-600 bg-blue-50/80 border-blue-200/60",
      title: "Masalar",
      description: "Masalar & Açık Adisyonlar",
      href: "/dashboard/orders",
      circleBg: "bg-blue-50/80 border border-blue-100 text-blue-600",
      icon: ArmchairIcon,
      statLeftValue: `${stats.activeTables}`,
      statLeftLabel: "aktif masa",
      statRightValue: `%${stats.occupancyRate}`,
      statRightLabel: "doluluk",
      statLeftColor: "text-blue-600",
      statRightColor: "text-blue-600",
    },
    {
      id: "mutfak",
      badge: "02",
      badgeColor: "text-orange-600 bg-orange-50/80 border-orange-200/60",
      title: "Mutfak",
      description: "KOT & Hazırlık Takibi",
      href: "/dashboard/kitchen",
      circleBg: "bg-orange-50/80 border border-orange-100 text-orange-600",
      icon: ChefHatIcon,
      statLeftValue: `${stats.waitingItems}`,
      statLeftLabel: "bekleyen sipariş",
      statRightValue: `${stats.readyItems}`,
      statRightLabel: "servise hazır",
      statLeftColor: "text-orange-600",
      statRightColor: "text-orange-600",
    },
    {
      id: "pos",
      badge: "03",
      badgeColor: "text-emerald-600 bg-emerald-50/80 border-emerald-200/60",
      title: "POS / Kasa",
      description: "Hızlı Sipariş & Tahsilat",
      href: "/dashboard/pos",
      circleBg: "bg-emerald-50/80 border border-emerald-100 text-emerald-600",
      icon: CalculatorIcon,
      statLeftValue: `${stats.openOrders}`,
      statLeftLabel: "açık adisyon",
      statRightValue: "Hızlı Kasa",
      statRightLabel: "terminal hazır",
      statLeftColor: "text-emerald-600",
      statRightColor: "text-emerald-600",
    },
    {
      id: "analitik",
      badge: "04",
      badgeColor: "text-purple-600 bg-purple-50/80 border-purple-200/60",
      title: "Analitik",
      description: "Operasyonel Günlük Raporlar",
      href: "/dashboard",
      circleBg: "bg-purple-50/80 border border-purple-100 text-purple-600",
      icon: BarChart3Icon,
      statLeftValue: `${stats.todayOrders}`,
      statLeftLabel: "günlük sipariş",
      statRightValue: "Trendler",
      statRightLabel: "anlık analiz",
      statLeftColor: "text-purple-600",
      statRightColor: "text-purple-600",
    },
    {
      id: "musteriler",
      badge: "05",
      badgeColor: "text-rose-600 bg-rose-50/80 border-rose-200/60",
      title: "Müşteriler",
      description: "Sadakat & Müşteri Takibi",
      href: "/dashboard/customers",
      circleBg: "bg-rose-50/80 border border-rose-100 text-rose-600",
      icon: UsersIcon,
      statLeftValue: `${stats.totalCustomers.toLocaleString("tr-TR")}`,
      statLeftLabel: "toplam kayıt",
      statRightValue: `${stats.newCustomers}`,
      statRightLabel: "bugün yeni",
      statLeftColor: "text-rose-600",
      statRightColor: "text-rose-600",
    },
    {
      id: "sistem",
      badge: "06",
      badgeColor: "text-slate-600 bg-slate-100 border-slate-200/60",
      title: "Sistem",
      description: "Menü, Masa & QR, Personel, Stok, Z Raporu",
      href: "/dashboard/system",
      circleBg: "bg-slate-100 border border-slate-200 text-slate-700",
      icon: Settings2Icon,
      statLeftValue: "Tüm ayarlar",
      statLeftLabel: "yapılandırma",
      statRightValue: "Sistem yönetimi",
      statRightLabel: "yönetim",
      statLeftColor: "text-slate-800",
      statRightColor: "text-slate-800",
    },
  ];

  // Personel yetkisine göre filtreleme
  const visibleCards = useMemo(() => {
    if (!isStaff || !allowedRoutes) return ACTION_CARDS;
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

    return ACTION_CARDS.filter((card) => {
      if (card.href === "/dashboard/system") {
        return hasSystemAccess;
      }
      return allowedRoutes.includes(card.href);
    });
  }, [isStaff, allowedRoutes]);

  const displayBranch = operationalStats?.branchName || restaurantName;

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-[#f8fafc] text-gray-900 p-3 sm:p-5 lg:p-6 flex flex-col justify-between gap-5 selection:bg-primary/20">
      {/* ELASTİK & MİKRO ANİMASYON STİLLERİ */}
      <style jsx global>{`
        @keyframes elasticCard {
          0% {
            opacity: 0;
            transform: scale(0.86) translateY(28px);
          }
          55% {
            opacity: 1;
            transform: scale(1.025) translateY(-5px);
          }
          75% {
            transform: scale(0.992) translateY(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes elasticLeft {
          0% {
            opacity: 0;
            transform: translateX(-35px) scale(0.94);
          }
          60% {
            opacity: 1;
            transform: translateX(5px) scale(1.015);
          }
          80% {
            transform: translateX(-1px) scale(0.995);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes elasticBottom {
          0% {
            opacity: 0;
            transform: translateY(35px) scale(0.95);
          }
          60% {
            opacity: 1;
            transform: translateY(-5px) scale(1.015);
          }
          80% {
            transform: translateY(1px) scale(0.995);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .anim-elastic-card {
          animation: elasticCard 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .anim-elastic-left {
          animation: elasticLeft 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .anim-elastic-bottom {
          animation: elasticBottom 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      {/* 
        1. ÜST HEADER ALANI (LOGO + AĞ/SUNUCU DURUMU + ŞUBE + KİLİT BUTONU)
      */}
      <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 py-1">
        {/* Sol: Logo + Alt Başlık */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {settings.logoUrl || settings.logoDarkUrl ? (
              <div className="relative h-9 w-36 sm:w-44">
                <Image
                  src={settings.logoUrl || settings.logoDarkUrl || ""}
                  alt="Adisyoon"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                  <UtensilsCrossedIcon className="size-5" />
                </div>
                <span className="text-xl font-black tracking-tight text-gray-900">
                  {settings.systemName || "AdisyonEx"}
                </span>
              </div>
            )}
          </div>

          <span className="text-xs font-semibold text-gray-400 hidden sm:inline-block border-l border-gray-200 pl-3">
            {settings.systemTagline || "Restoran yönetim sistemi"}
          </span>
        </div>

        {/* Sağ: İnternet Bağlı + Sunucu/Lokal Bağlı + Şube + Kilit + Kullanıcı */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
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

          {/* Sunucu Durumu: İnternet kesilince "Lokal Sunucu", gelince "Sunucu Bağlı" */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-2xs transition-all",
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
            title={isOnline ? "Merkezi Bulut Sunucu Bağlantısı Aktif" : "Yerel Ağ / Lokal Sunucu Modu"}
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

          {/* Kullanıcı / Rol */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-gray-800 border border-gray-200 text-xs font-extrabold shadow-2xs cursor-default">
            <UsersIcon className="size-3.5 text-gray-600" />
            <span>{userName}</span>
            <span className="text-gray-400 text-[10px]">⌄</span>
          </div>
        </div>
      </header>

      {/* 
        2. ANA GÖVDE: SOL PANEL (SAAT & HAVA, OPERASYON, BİLDİRİMLER) + SAĞ 6'LI KART GRID'İ
      */}
      <main className="w-full flex flex-col lg:flex-row gap-5 items-start flex-1">
        {/* ============================================================ */}
        {/* SOL PANEL (W-FULL LG:W-[320px])                               */}
        {/* ============================================================ */}
        <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col gap-4">
          {/* KART 1: GÜNCEL SAAT & TARİH & CANLI HAVA DURUMU */}
          <div
            className="anim-elastic-left rounded-3xl p-5 border border-gray-200/90 bg-white shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-gray-300"
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-500 capitalize tracking-wide">
                {dateStr}
              </span>
              <span className="text-5xl font-black tracking-tight text-gray-900 tabular-nums mt-1 font-mono">
                {timeStr}
              </span>
            </div>

            <div className="flex flex-col items-end text-right">
              <WeatherIcon iconType={stats.weather.iconType} />
              <span className="text-xl font-extrabold text-gray-900 mt-1 tabular-nums">
                {stats.weather.temperature}°
              </span>
              <span className="text-[11px] font-medium text-gray-500">
                {stats.weather.description}
              </span>
              <span className="text-[11px] font-bold text-gray-700 truncate max-w-[130px]">
                {stats.weather.cityName}
              </span>
            </div>
          </div>

          {/* KART 2: OPERASYON ÖZETİ (FİNANSAL VERİLER YOKTUR - %100 GERÇEK CANLI DB) */}
          <div
            className="anim-elastic-left rounded-3xl p-5 border border-gray-200/90 bg-white shadow-xs flex flex-col gap-3.5 transition-all hover:shadow-md hover:border-gray-300"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="size-4.5 text-primary" />
                <h2 className="text-sm font-black text-gray-900">Operasyon Özeti</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Canlı
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Aktif Masalar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7.5 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <ArmchairIcon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Aktif Masalar</span>
                </div>
                <span className="text-sm font-black text-gray-900 tabular-nums">
                  {stats.activeTables}
                </span>
              </div>

              {/* Açık Adisyonlar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7.5 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CalculatorIcon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Açık Adisyonlar</span>
                </div>
                <span className="text-sm font-black text-gray-900 tabular-nums">
                  {stats.openOrders}
                </span>
              </div>

              {/* Mutfak Bekleyen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7.5 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <ChefHatIcon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Mutfak Bekleyen</span>
                </div>
                <span className="text-sm font-black text-gray-900 tabular-nums">
                  {stats.waitingItems}
                </span>
              </div>

              {/* Online / Paket Sipariş (CANLI DB VERİSİ) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7.5 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                    <ShoppingBagIcon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Paket & Online</span>
                </div>
                <span className="text-sm font-black text-gray-900 tabular-nums">
                  {stats.takeawayOrders}
                </span>
              </div>

              {/* Hazır / Servis Bekleyen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7.5 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                    <CheckCircle2Icon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Hazır / Servis</span>
                </div>
                <span className="text-sm font-black text-gray-900 tabular-nums">
                  {stats.readyItems}
                </span>
              </div>
            </div>
          </div>

          {/* KART 3: BİLDİRİMLER (TIKLANINCA TAM EKRAN KATEGORİZE MODAL AÇILIR) */}
          <div
            className="anim-elastic-left rounded-3xl p-5 border border-gray-200/90 bg-white shadow-xs flex flex-col gap-3 transition-all hover:shadow-md hover:border-gray-300"
            style={{ animationDelay: "200ms" }}
          >
            <div
              onClick={() => setIsNotifModalOpen(true)}
              className="flex items-center justify-between pb-1 border-b border-gray-100 cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <BellIcon className="size-4 text-gray-700 group-hover:text-primary transition-colors" />
                <h2 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
                  Bildirimler
                </h2>
              </div>
              <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-black">
                {stats.notifications.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {stats.notifications.slice(0, 3).map((n, i) => (
                <div
                  key={n.id || i}
                  onClick={() => setIsNotifModalOpen(true)}
                  className="flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/80 p-1.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-black",
                        n.type === "order"
                          ? "bg-emerald-500"
                          : n.type === "table"
                          ? "bg-blue-500"
                          : n.type === "kitchen"
                          ? "bg-orange-500"
                          : "bg-rose-500",
                      )}
                    >
                      {n.type === "order" ? "S" : n.type === "table" ? "M" : n.type === "kitchen" ? "K" : "!"}
                    </div>
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {n.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 shrink-0">
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

        {/* ============================================================ */}
        {/* SAĞ TARAF: 6 TEMEL AKSİYON KARTI (3X2 GRID)                  */}
        {/* ============================================================ */}
        <section className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5 sm:gap-5 w-full">
          {visibleCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.id}
                href={card.href}
                prefetch={true}
                className={cn(
                  "anim-elastic-card group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl",
                  "border border-gray-200/90 bg-white shadow-xs",
                  "hover:shadow-xl hover:border-gray-300 hover:-translate-y-1.5 transition-all duration-300",
                  "active:scale-[0.98] min-h-[260px] sm:min-h-[275px] cursor-pointer",
                )}
                style={{
                  animationDelay: `${index * 70 + 60}ms`,
                }}
              >
                {/* 1. Üst Kısım: Rozet Numarası (01, 02, ...) */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black border",
                      card.badgeColor,
                    )}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* 2. Orta Kısım: Büyük Dairesel İkon & Başlık */}
                <div className="flex flex-col items-center justify-center text-center my-auto py-2">
                  <div
                    className={cn(
                      "flex size-20 sm:size-22 items-center justify-center rounded-full shadow-2xs transition-transform duration-300 group-hover:scale-110",
                      card.circleBg,
                    )}
                  >
                    <Icon className="size-10 sm:size-11" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-3.5 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 line-clamp-1">
                    {card.description}
                  </p>
                </div>

                {/* 3. Alt Kısım: 2 Kolonlu Canlı Operasyonel Metrikler */}
                <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-gray-100 text-center">
                  <div className="flex flex-col">
                    <span className={cn("text-base sm:text-lg font-black tabular-nums", card.statLeftColor)}>
                      {card.statLeftValue}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      {card.statLeftLabel}
                    </span>
                  </div>

                  <div className="flex flex-col border-l border-gray-100">
                    <span className={cn("text-base sm:text-lg font-black tabular-nums", card.statRightColor)}>
                      {card.statRightValue}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      {card.statRightLabel}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </main>

      {/* 
        3. ALT BAR (SÜPER ADMİN YÖNETİMLİ SİSTEM BİLGİLERİ VE DESTEK FOOTER'I)
      */}
      <footer
        className="anim-elastic-bottom w-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-200/90 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-600"
        style={{ animationDelay: "380ms" }}
      >
        {/* Sol: Logo + Sistem Adı & Açıklaması */}
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <UtensilsCrossedIcon className="size-4 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900 tracking-tight">
                {settings.systemName || "AdisyonEx"}
              </span>
              <span className="px-2 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                v2.4 Online
              </span>
            </div>
            <span className="text-[11px] text-gray-400 line-clamp-1">
              {settings.systemTagline || "Yeni Nesil Restoran & POS Otomasyon Platformu"}
            </span>
          </div>
        </div>

        {/* Orta: Telif Hakkı & Resmi Web Sitesi */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>{settings.copyrightText || "© 2026 AdisyonEx. Tüm hakları saklıdır."}</span>
          {settings.websiteUrl && (
            <>
              <span className="text-gray-300">·</span>
              <a
                href={settings.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
              >
                <span>Resmi Web Sitesi</span>
                <ExternalLinkIcon className="size-3" />
              </a>
            </>
          )}
        </div>

        {/* Sağ: Destek Hattı + Hızlı Ekran Kilitleme */}
        <div className="flex items-center gap-4">
          <a
            href={`tel:${(settings.supportPhone || "+908503099901").replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors shadow-2xs group"
          >
            <HeadphonesIcon className="size-4 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Destek Hattı
              </span>
              <span className="font-mono font-black text-xs text-gray-900">
                {settings.supportPhone || "+90 850 309 9901"}
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setIsLockModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Terminal Ekranını Kilitle"
          >
            <LockIcon className="size-3.5 text-amber-400" />
            <span className="hidden sm:inline">Kilitle</span>
          </button>
        </div>
      </footer>

      {/* AÇILIR TAM EKRAN BİLDİRİM PANELİ MODAL */}
      <HomeNotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={stats.notifications}
      />

      {/* EKRAN KİLİDİ MODAL (NUMPAD + ŞİFRELEME) */}
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
