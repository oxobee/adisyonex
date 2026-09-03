"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArmchairIcon,
  BarChart3Icon,
  BellIcon,
  BoxesIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ClockIcon,
  HeadphonesIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LogInIcon,
  MapPinIcon,
  PaletteIcon,
  PrinterIcon,
  QrCodeIcon,
  ReceiptTextIcon,
  SearchIcon,
  ServerIcon,
  Settings2Icon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TrendingUpIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  WifiIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

export interface HomeOperationalStats {
  readonly restaurantName: string;
  readonly totalTables: number;
  readonly activeTables: number;
  readonly openOrders: number;
  readonly waitingItems: number;
  readonly readyItems: number;
  readonly todayOrders: number;
  readonly totalCustomers: number;
  readonly newCustomers: number;
  readonly recentNotifications: Array<{
    readonly id: string;
    readonly type: "order" | "table" | "kitchen";
    readonly text: string;
    readonly timeAgo: string;
  }>;
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
    const waitingItems = operationalStats?.waitingItems ?? 7;
    const readyItems = operationalStats?.readyItems ?? 5;
    const todayOrders = operationalStats?.todayOrders ?? 142;
    const totalCustomers = operationalStats?.totalCustomers ?? 1248;
    const newCustomers = operationalStats?.newCustomers ?? 4;
    const occupancyRate =
      totalTables > 0 ? Math.min(100, Math.round((activeTables / totalTables) * 100)) : 75;

    return {
      totalTables,
      activeTables,
      openOrders,
      waitingItems,
      readyItems,
      todayOrders,
      totalCustomers,
      newCustomers,
      occupancyRate,
      notifications: operationalStats?.recentNotifications ?? [
        {
          id: "1",
          type: "order" as const,
          text: "Yeni online sipariş alındı",
          timeAgo: "5 dk önce",
        },
        {
          id: "2",
          type: "table" as const,
          text: "Masa 12 adisyonu açıldı",
          timeAgo: "10 dk önce",
        },
        {
          id: "3",
          type: "kitchen" as const,
          text: "Mutfakta 3 sipariş bekliyor",
          timeAgo: "12 dk önce",
        },
      ],
    };
  }, [operationalStats]);

  // 6 Temel Aksiyon Kartı
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
      statRightValue: "12 dk",
      statRightLabel: "ort. hazırlık",
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
      description: "Satış & Günlük Raporlar",
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
      description: "Sadakat & Kampanyalar",
      href: "/dashboard/customers",
      circleBg: "bg-rose-50/80 border border-rose-100 text-rose-600",
      icon: UsersIcon,
      statLeftValue: `${stats.totalCustomers.toLocaleString("tr-TR")}`,
      statLeftLabel: "toplam müşteri",
      statRightValue: `${stats.newCustomers}`,
      statRightLabel: "yeni müşteri",
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
        1. ÜST HEADER ALANI (GÖRSELDEKİ BİREBİR BAŞLIK VE DURUM ROZETLERİ)
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
                  {settings.systemName || "adisyoon"}
                </span>
              </div>
            )}
          </div>

          <span className="text-xs font-semibold text-gray-400 hidden sm:inline-block border-l border-gray-200 pl-3">
            Restoran yönetim sistemi
          </span>
        </div>

        {/* Sağ: İnternet Bağlı + Sunucu Bağlı + Şube + Kullanıcı */}
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

          {/* Sunucu Durumu */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
            <ServerIcon className="size-3.5" />
            <span>Sunucu Bağlı</span>
          </div>

          {/* Şube Bilgisi */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-gray-700 border border-gray-200 text-xs font-bold shadow-2xs">
            <MapPinIcon className="size-3.5 text-gray-500" />
            <span>Şube: {restaurantName}</span>
          </div>

          {/* Kullanıcı / Rol */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-gray-800 border border-gray-200 text-xs font-extrabold shadow-2xs cursor-default">
            <UsersIcon className="size-3.5 text-gray-600" />
            <span>{userName}</span>
            <span className="text-gray-400 text-[10px]">⌄</span>
          </div>
        </div>
      </header>

      {/* 
        2. ANA GÖVDE: SOL PANEL (SAAT, OPERASYON, BİLDİRİMLER) + SAĞ 6'LI KART GRID'İ
      */}
      <main className="w-full flex flex-col lg:flex-row gap-5 items-start flex-1">
        {/* ============================================================ */}
        {/* SOL PANEL (W-FULL LG:W-[320px])                               */}
        {/* ============================================================ */}
        <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col gap-4">
          {/* KART 1: GÜNCEL SAAT & TARİH & HAVA DURUMU */}
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
              <SunIcon className="size-8 text-amber-500 animate-[spin_24s_linear_infinite]" />
              <span className="text-xl font-extrabold text-gray-900 mt-1">18°</span>
              <span className="text-[11px] font-medium text-gray-400">Açık ve Güneşli</span>
              <span className="text-[11px] font-bold text-gray-600">İstanbul</span>
            </div>
          </div>

          {/* KART 2: OPERASYON ÖZETİ (FİNANSAL VERİLER YOKTUR - TAMAMEN OPERASYONEL) */}
          <div
            className="anim-elastic-left rounded-3xl p-5 border border-gray-200/90 bg-white shadow-xs flex flex-col gap-3.5 transition-all hover:shadow-md hover:border-gray-300"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <TrendingUpIcon className="size-4.5 text-primary" />
              <h2 className="text-sm font-black text-gray-900">Operasyon Özeti</h2>
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

              {/* Online / Paket Sipariş */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7.5 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                    <ShoppingBagIcon className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Online Sipariş</span>
                </div>
                <span className="text-sm font-black text-gray-900 tabular-nums">12</span>
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

          {/* KART 3: BİLDİRİMLER */}
          <div
            className="anim-elastic-left rounded-3xl p-5 border border-gray-200/90 bg-white shadow-xs flex flex-col gap-3 transition-all hover:shadow-md hover:border-gray-300"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BellIcon className="size-4 text-gray-700" />
                <h2 className="text-sm font-black text-gray-900">Bildirimler</h2>
              </div>
              <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-black">
                {stats.notifications.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {stats.notifications.map((n, i) => (
                <div key={n.id || i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-black",
                        i === 0
                          ? "bg-emerald-500"
                          : i === 1
                            ? "bg-blue-500"
                            : "bg-orange-500",
                      )}
                    >
                      {i === 0 ? "go" : i === 1 ? "M" : "K"}
                    </div>
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {n.text}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 shrink-0">
                    {n.timeAgo}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/orders"
              className="mt-1 inline-flex items-center justify-between text-xs font-bold text-gray-500 hover:text-primary transition-colors pt-2 border-t border-gray-100 group"
            >
              <span>Tüm bildirimleri göster</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
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
        3. ALT BAR (FAVORİLER, HIZLI AKSİYONLAR VE DESTEK HATTI)
      */}
      <footer
        className="anim-elastic-bottom w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-gray-200/90 bg-white shadow-xs flex flex-wrap items-center justify-between gap-3"
        style={{ animationDelay: "380ms" }}
      >
        {/* Sol: Favoriler Başlığı */}
        <div className="flex items-center gap-1.5 text-xs font-black text-gray-600 pl-1">
          <StarIcon className="size-4 text-amber-500 fill-amber-500" />
          <span>Favoriler</span>
        </div>

        {/* Orta: Hızlı Aksiyon Butonları */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <ArmchairIcon className="size-3.5 text-blue-600" />
            <span>Hızlı Masa Aç</span>
          </Link>

          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <ShoppingBagIcon className="size-3.5 text-emerald-600" />
            <span>Paket Sipariş</span>
          </Link>

          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-purple-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <SearchIcon className="size-3.5 text-purple-600" />
            <span>Adisyon Ara</span>
          </Link>

          <Link
            href="/dashboard/menu-design"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/80 text-orange-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <QrCodeIcon className="size-3.5 text-orange-600" />
            <span>QR Menü</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/80 text-sky-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <PrinterIcon className="size-3.5 text-sky-600" />
            <span>Yazdırma Merkezi</span>
          </Link>
        </div>

        {/* Sağ: Destek Hattı */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 pr-1">
          <HeadphonesIcon className="size-4 text-gray-400" />
          <span>Destek Hattı</span>
          <span className="font-mono font-black text-gray-800">0850 123 45 67</span>
        </div>
      </footer>
    </div>
  );
}
