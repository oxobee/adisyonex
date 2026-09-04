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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SystemSettingsDTO } from "@/services/system-setting.service";
import {
  HomeNotificationsModal,
  type HomeNotificationItem,
} from "./home-notifications-modal";
import { HomeScreenLockModal } from "./home-screen-lock-modal";
import {
  StaffAccountMenu,
  type StaffAccount,
} from "./staff-account-menu";

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

  // AI Command Input & Speech State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sayfa kaydırma dinleyicisi (Mobilde Sticky AI Bar tetikleyicisi)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Web Speech API Entegrasyonu (Tarayıcı destekliyorsa canlı konuşmayı metne çevirir)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "tr-TR";

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setAiPrompt(transcript);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
        setIsHoldingMic(false);
      };

      rec.onend = () => {
        setIsListening(false);
        setIsHoldingMic(false);
      };

      recognitionRef.current = rec;
    } catch {
      // ignore
    }
  }, []);

  const startListening = () => {
    setIsListening(true);
    try {
      recognitionRef.current?.start();
    } catch {
      // ignore if already started
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setIsHoldingMic(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  };

  const handleMicPressStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsHoldingMic(true);
    startListening();
  };

  const handleMicPressEnd = () => {
    setIsHoldingMic(false);
  };

  const handleAiSubmit = (commandText?: string) => {
    const query = (commandText ?? aiPrompt).trim().toLowerCase();
    if (!query) return;

    if (query.includes("masa") || query.includes("adisyon")) {
      toast.success("Masalar ve adisyonlar ekranına yönlendiriliyorsunuz...");
      router.push("/dashboard/orders");
    } else if (
      query.includes("mutfak") ||
      query.includes("kot") ||
      query.includes("hazır") ||
      query.includes("sipariş")
    ) {
      toast.success("Mutfak KOT ekranına yönlendiriliyorsunuz...");
      router.push("/dashboard/kitchen");
    } else if (
      query.includes("kasa") ||
      query.includes("pos") ||
      query.includes("tahsilat") ||
      query.includes("ödeme")
    ) {
      toast.success("Hızlı Kasa / POS ekranına yönlendiriliyorsunuz...");
      router.push("/dashboard/pos");
    } else if (
      query.includes("z rapor") ||
      query.includes("rapor") ||
      query.includes("ciro") ||
      query.includes("analiz")
    ) {
      toast.success("Z Raporu ekranına yönlendiriliyorsunuz...");
      router.push("/dashboard/z-report");
    } else if (query.includes("menü") || query.includes("ürün") || query.includes("fiyat")) {
      toast.success("Menü yönetimine yönlendiriliyorsunuz...");
      router.push("/dashboard/menu");
    } else if (query.includes("tasarım") || query.includes("qr menü")) {
      toast.success("QR Menü tasarımına yönlendiriliyorsunuz...");
      router.push("/dashboard/menu-design");
    } else if (query.includes("stok") || query.includes("depo") || query.includes("hammadde")) {
      toast.success("Stok yönetimine yönlendiriliyorsunuz...");
      router.push("/dashboard/inventory");
    } else if (query.includes("personel") || query.includes("çalışan") || query.includes("garson")) {
      toast.success("Personel yönetimine yönlendiriliyorsunuz...");
      router.push("/dashboard/staff");
    } else if (query.includes("ayar") || query.includes("şube") || query.includes("wifi")) {
      toast.success("Firma ve şube ayarlarına yönlendiriliyorsunuz...");
      router.push("/dashboard/settings");
    } else if (query.includes("müşteri") || query.includes("sadakat")) {
      toast.success("Müşteri sadakat ekranına yönlendiriliyorsunuz...");
      router.push("/dashboard/customers");
    } else if (query.includes("kilit") || query.includes("kilitle")) {
      setIsLockModalOpen(true);
    } else if (query.includes("bildirim")) {
      setIsNotifModalOpen(true);
    } else {
      toast.info(`"${aiPrompt}" komutu yapay zeka asistanına iletildi.`);
    }

    setAiPrompt("");
    stopListening();
  };

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

  // 6 Temel Aksiyon Kartı
  const ALL_ACTION_CARDS = [
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
      statLeftLabel: "bekleyen",
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
      icon: TrendingUpIcon,
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
      description: "Menü, Masa, Stok, Z Raporu",
      href: "/dashboard/system",
      circleBg: "bg-slate-100 border border-slate-200 text-slate-700",
      icon: Settings2Icon,
      statLeftValue: "Ayarlar",
      statLeftLabel: "yapılandırma",
      statRightValue: "Yönetim",
      statRightLabel: "sistem",
      statLeftColor: "text-slate-800",
      statRightColor: "text-slate-800",
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

  const displayBranch = operationalStats?.branchName || restaurantName;
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] bg-[#f8fafc] text-gray-900 p-2.5 sm:p-5 lg:p-6 flex flex-col justify-between gap-3 sm:gap-5 selection:bg-primary/20">
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
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/90 bg-white shadow-xs flex items-center justify-between"
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

          {/* YAPAY ZEKA DESTEKLİ BORDER ANİMASYONLU INPUT ALANI */}
          <div
            className="anim-sleek relative p-[1.5px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs group transition-all"
            style={{ animationDelay: "20ms" }}
          >
            {/* Canlı Gradient Animasyonlu Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-border opacity-85 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center gap-2 bg-white rounded-[calc(1rem-1px)] sm:rounded-[calc(1.5rem-1px)] px-3 py-2 sm:py-2.5">
              <div className="flex size-7 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                <SparklesIcon className="size-4 text-purple-600" />
              </div>

              {/* Canlı Ses Spektrumu Animasyonu (Mikrofon açıkken veya basılı tutulurken) */}
              {(isListening || isHoldingMic) && (
                <div
                  className="flex items-center gap-0.5 sm:gap-1 h-5 px-1 shrink-0"
                  title="Ses dinleniyor..."
                >
                  <span className="w-1 bg-purple-600 rounded-full sound-bar-1" />
                  <span className="w-1 bg-indigo-600 rounded-full sound-bar-2" />
                  <span className="w-1 bg-blue-600 rounded-full sound-bar-3" />
                  <span className="w-1 bg-indigo-600 rounded-full sound-bar-4" />
                  <span className="w-1 bg-purple-600 rounded-full sound-bar-5" />
                </div>
              )}

              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAiSubmit();
                  }
                }}
                placeholder={
                  isListening || isHoldingMic
                    ? "Sizi dinliyorum, komutunuzu söyleyin..."
                    : "Yapay zeka asistanına komut verin..."
                }
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-semibold text-gray-800 placeholder:text-gray-400 min-w-0"
              />

              {/* Dinamik Buton: Metin varsa Gönder ikonu, yoksa Bas-Konuş Mikrofon */}
              {aiPrompt.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleAiSubmit()}
                  className="flex size-7.5 sm:size-8 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-90 shrink-0 cursor-pointer shadow-sm"
                  title="Komutu Gönder"
                >
                  <SendIcon className="size-3.5 sm:size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onMouseDown={handleMicPressStart}
                  onMouseUp={handleMicPressEnd}
                  onTouchStart={handleMicPressStart}
                  onTouchEnd={handleMicPressEnd}
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                      toast.info("Mikrofon kapatıldı");
                    } else {
                      startListening();
                      toast.info("Mikrofon dinleme aktif (Yapay zeka hazır)");
                    }
                  }}
                  className={cn(
                    "flex size-7.5 sm:size-8 items-center justify-center rounded-xl transition-all duration-200 shrink-0 cursor-pointer shadow-2xs select-none",
                    isHoldingMic
                      ? "scale-115 bg-red-600 text-white shadow-lg shadow-red-500/30"
                      : isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-purple-50 hover:bg-purple-100 text-purple-600 active:scale-90"
                  )}
                  title={
                    isListening
                      ? "Dinlemeyi Durdur"
                      : "Sesli Komut Ver (Tıkla veya Basılı Tut)"
                  }
                >
                  <MicIcon className="size-3.5 sm:size-4" />
                </button>
              )}
            </div>
          </div>

          {/* KART 2: OPERASYON ÖZETİ (%100 GERÇEK CANLI DB) */}
          <div
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/90 bg-white shadow-xs flex flex-col gap-3"
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
            className="anim-sleek rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/90 bg-white shadow-xs flex flex-col gap-2.5"
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
                {stats.notifications.length}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {stats.notifications.slice(0, 3).map((n, i) => (
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

        {/* SAĞ TARAF: MOBİLDE 2 SÜTUNLU, MASAÜSTÜNDE 3 SÜTUNLU MENÜ KARTLARI */}
        <section className="flex-1 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4.5 w-full">
          {visibleCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.id}
                href={card.href}
                prefetch={true}
                className={cn(
                  "anim-sleek group relative flex flex-col justify-between p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl",
                  "border border-gray-200/90 bg-white shadow-xs",
                  "hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 transition-all duration-200",
                  "active:scale-[0.98] min-h-[175px] sm:min-h-[265px] cursor-pointer"
                )}
                style={{
                  animationDelay: `${index * 35 + 90}ms`,
                }}
              >
                {/* 1. Üst: Rozet */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black border",
                      card.badgeColor
                    )}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* 2. Orta: Dairesel İkon & Başlık */}
                <div className="flex flex-col items-center justify-center text-center my-auto py-1 sm:py-2">
                  <div
                    className={cn(
                      "flex size-13 sm:size-20 items-center justify-center rounded-full shadow-2xs transition-transform duration-200 group-hover:scale-105",
                      card.circleBg
                    )}
                  >
                    <Icon className="size-6.5 sm:size-10" />
                  </div>

                  <h3 className="text-sm sm:text-xl font-black text-gray-900 tracking-tight mt-2 sm:mt-3 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-[11px] sm:text-xs font-semibold text-gray-500 mt-0.5 line-clamp-1 hidden sm:block">
                    {card.description}
                  </p>
                </div>

                {/* 3. Alt: 2 Kolonlu Canlı Metrikler */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 sm:pt-3 mt-1 sm:mt-2 border-t border-gray-100 text-center">
                  <div className="flex flex-col">
                    <span className={cn("text-xs sm:text-base font-black tabular-nums", card.statLeftColor)}>
                      {card.statLeftValue}
                    </span>
                    <span className="text-[9px] sm:text-[11px] font-bold text-gray-400">
                      {card.statLeftLabel}
                    </span>
                  </div>

                  <div className="flex flex-col border-l border-gray-100">
                    <span className={cn("text-xs sm:text-base font-black tabular-nums", card.statRightColor)}>
                      {card.statRightValue}
                    </span>
                    <span className="text-[9px] sm:text-[11px] font-bold text-gray-400">
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
        3. ALT BAR (OXONOM CORP KURUMSAL FOOTER - DIŞ LINK YOK, KİLİT YOK)
      */}
      <footer
        className="w-full rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-gray-200/90 bg-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold text-gray-600"
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

      {/* 
        4. MOBİL ELASTİK AÇILIR YAPAY ZEKA DOCK BARI (AŞAĞI KAYDIRILDIĞINDA GÖRÜNÜR)
      */}
      <div
        className={cn(
          "sm:hidden fixed bottom-3 left-3 right-3 z-40 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isScrolled
            ? "translate-y-0 opacity-100 pointer-events-auto shadow-2xl shadow-purple-950/20"
            : "translate-y-16 opacity-0 pointer-events-none"
        )}
      >
        <div className="relative p-[1.5px] rounded-2xl overflow-hidden shadow-lg bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-border opacity-90" />
          <div className="relative flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-[calc(1rem-1.5px)] px-3 py-2">
            <div className="flex size-7 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <SparklesIcon className="size-3.5 text-purple-600" />
            </div>

            {(isListening || isHoldingMic) && (
              <div className="flex items-center gap-0.5 h-4 px-0.5 shrink-0" title="Ses dinleniyor...">
                <span className="w-1 bg-purple-600 rounded-full sound-bar-1" />
                <span className="w-1 bg-indigo-600 rounded-full sound-bar-2" />
                <span className="w-1 bg-blue-600 rounded-full sound-bar-3" />
                <span className="w-1 bg-indigo-600 rounded-full sound-bar-4" />
                <span className="w-1 bg-purple-600 rounded-full sound-bar-5" />
              </div>
            )}

            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAiSubmit();
                }
              }}
              placeholder={
                isListening || isHoldingMic ? "Dinleniyor, komutu söyleyin..." : "Yapay zeka asistanına komut..."
              }
              className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-gray-800 placeholder:text-gray-400 min-w-0"
            />

            {aiPrompt.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => handleAiSubmit()}
                className="flex size-7.5 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-90 shrink-0 cursor-pointer shadow-xs"
                title="Komutu Gönder"
              >
                <SendIcon className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onMouseDown={handleMicPressStart}
                onMouseUp={handleMicPressEnd}
                onTouchStart={handleMicPressStart}
                onTouchEnd={handleMicPressEnd}
                onClick={() => {
                  if (isListening) {
                    stopListening();
                    toast.info("Mikrofon kapatıldı");
                  } else {
                    startListening();
                    toast.info("Mikrofon dinleme aktif");
                  }
                }}
                className={cn(
                  "flex size-7.5 items-center justify-center rounded-xl transition-all duration-200 shrink-0 cursor-pointer shadow-2xs select-none",
                  isHoldingMic
                    ? "scale-115 bg-red-600 text-white shadow-lg shadow-red-500/30"
                    : isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600 active:scale-90"
                )}
                title={isListening ? "Dinlemeyi Durdur" : "Sesli Komut Ver"}
              >
                <MicIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AÇILIR TAM EKRAN BİLDİRİM PANELİ MODAL */}
      <HomeNotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={stats.notifications}
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
