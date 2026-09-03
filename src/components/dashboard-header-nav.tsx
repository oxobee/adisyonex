"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeftIcon,
  ArmchairIcon,
  BookOpenIcon,
  BoxesIcon,
  CalculatorIcon,
  ChefHatIcon,
  CircleUserRoundIcon,
  ExternalLinkIcon,
  GiftIcon,
  HomeIcon,
  HeadphonesIcon,
  InfinityIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LogOutIcon,
  PaletteIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";

import { logoutAction } from "@/actions/auth.actions";
import { SalesRepCard } from "@/components/license/sales-rep-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, isActiveRoute } from "@/lib/utils";
import type { LicenseInfoDTO } from "@/services/license.service";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

interface ModuleConfig {
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly icon: React.ReactNode;
  readonly iconBg: string;
  readonly iconColor: string;
}

export const MODULE_ITEMS: readonly ModuleConfig[] = [
  {
    title: "Ana Ekran",
    url: "/dashboard/home",
    icon: <HomeIcon className="size-4.5" />,
    iconBg: "bg-red-500/15 group-hover:bg-red-500/25",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    title: "Anlık Durum",
    description: "Canlı masa doluluğu ve açık adisyonlar",
    url: "/dashboard/orders",
    icon: <ReceiptTextIcon className="size-5" />,
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Mutfak",
    description: "Mutfak sipariş hazırlık ekranı (KDS)",
    url: "/dashboard/kitchen",
    icon: <ChefHatIcon className="size-5" />,
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    title: "POS / Kasa",
    description: "Hızlı sipariş oluşturma ve hesap alma",
    url: "/dashboard/pos",
    icon: <CalculatorIcon className="size-5" />,
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Genel Bakış",
    description: "Günlük ciro, satış raporları ve istatistikler",
    url: "/dashboard",
    icon: <LayoutDashboardIcon className="size-5" />,
    iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    title: "Masalar",
    description: "Salon planı, masa ve bölge yönetimi",
    url: "/dashboard/tables",
    icon: <ArmchairIcon className="size-5" />,
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Menü",
    description: "Kategoriler, ürünler ve fiyat yönetimi",
    url: "/dashboard/menu",
    icon: <BookOpenIcon className="size-5" />,
    iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    title: "Menü Tasarım",
    description: "QR menü teması, renk ve banner ayarları",
    url: "/dashboard/menu-design",
    icon: <PaletteIcon className="size-5" />,
    iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Personel",
    description: "Çalışan listesi, roller ve giriş PIN'leri",
    url: "/dashboard/staff",
    icon: <UsersIcon className="size-5" />,
    iconBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    title: "Stok",
    description: "Hammadde envanteri ve reçete takibi",
    url: "/dashboard/inventory",
    icon: <BoxesIcon className="size-5" />,
    iconBg: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  {
    title: "Müşteriler",
    description: "Müşteri sadakat profili ve doğum günleri",
    url: "/dashboard/customers",
    icon: <GiftIcon className="size-5" />,
    iconBg: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
];

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard/orders": "Anlık Durum & Masalar",
  "/dashboard/kitchen": "Mutfak Ekranı (KDS)",
  "/dashboard/pos": "POS / Hızlı Kasa",
  "/dashboard": "Genel Bakış & Raporlar",
  "/dashboard/tables": "Masalar & Salon Planı",
  "/dashboard/menu": "Menü & Ürün Yönetimi",
  "/dashboard/menu-design": "QR Menü Tasarımı",
  "/dashboard/staff": "Personel Yönetimi",
  "/dashboard/inventory": "Stok & Envanter",
  "/dashboard/customers": "Müşteriler & Sadakat",
  "/dashboard/settings": "Restoran Ayarları",
  "/dashboard/ai-studio": "Yapay Zeka Stüdyosu",
};

export function DashboardHeaderNav({
  user,
  license,
  systemSettings,
  restaurantUsername,
}: {
  readonly user: {
    readonly name: string;
    readonly contact: string;
    readonly role?: string;
  };
  readonly license?: LicenseInfoDTO | null;
  readonly systemSettings?: Partial<SystemSettingsDTO> | null;
  readonly restaurantUsername?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isSalesRepModalOpen, setIsSalesRepModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);
  const appLauncherRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  // Check if current screen is the Main Screen (Ana Ekran)
  const isMainScreen = pathname === "/dashboard/orders";

  // Current page display title
  const currentTitle =
    ROUTE_TITLES[pathname] ||
    (pathname.startsWith("/dashboard/orders/")
      ? "Sipariş Detayı"
      : pathname.startsWith("/dashboard/inventory/")
        ? "Stok Detayı"
        : pathname.startsWith("/dashboard/ai-studio")
          ? "Yapay Zeka Stüdyosu"
          : "Yönetim Paneli");

  // Track online/offline status in real-time
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

  // Close profile and app launcher dropdowns on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (appLauncherRef.current && !appLauncherRef.current.contains(e.target as Node)) {
        setIsAppLauncherOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
        setIsAppLauncherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const plan = license?.plan || "TRIAL";
  const days = license?.daysRemaining ?? 0;
  const isLifetime = plan === "LIFETIME" || days === 9999;
  const isExpired = days <= 0 && !isLifetime;
  const isExpiringSoon = days <= 7 && !isLifetime && !isExpired;
  const aiBalance = license?.aiBalance ?? 0;

  const planBadge =
    plan === "YEARLY"
      ? { label: "👑 Yıllık Pro", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30" }
      : plan === "MONTHLY"
        ? { label: "💎 Aylık", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30" }
        : plan === "LIFETIME"
          ? { label: "♾️ Süresiz", color: "text-purple-600 dark:text-purple-400 border-purple-500/25 bg-purple-500/10" }
          : { label: "⚡ Deneme", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" };

  return (
    <>
      {/* 
        DESKTOP OS WINDOW TITLEBAR (macOS / Modern Desktop SaaS Style)
        Unified, single-row, ultra-clean header without cluttered navigation menus.
      */}
      <header className="sticky top-0 z-40 w-full h-13 sm:h-14 border-b border-border/70 bg-background/85 dark:bg-zinc-950/85 backdrop-blur-xl transition-all select-none shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <div className="flex h-full w-full items-center justify-between px-3 sm:px-5 lg:px-6 gap-3">
          {/* 
            LEFT SECTION:
            1. Desktop Window Traffic Light Controls (🔴 🟡 🟢)
            2. System Brand Logo & Name
            3. "Ana Ekran" Back Button (Active on ALL sub-pages)
            4. "Modüller" Launcher (Active on Ana Ekran)
          */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            {/* macOS Window Traffic Lights */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 pr-1">
              <span
                className="size-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-opacity hover:opacity-80"
                title="Pencere"
              />
              <span
                className="size-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-opacity hover:opacity-80"
                title="Küçült"
              />
              <span
                className="size-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-opacity hover:opacity-80"
                title="Büyüt"
              />
            </div>

            <div className="hidden sm:block h-4 w-px bg-border/80 shrink-0" />

            {/* System Brand Logo & Name */}
            <Link
              href="/dashboard/orders"
              prefetch={true}
              className="flex items-center gap-2 select-none cursor-pointer group shrink-0"
              title="Ana Ekran"
            >
              {systemSettings?.faviconUrl || systemSettings?.logoUrl ? (
                <div className="relative size-7.5 shrink-0 overflow-hidden rounded-lg group-hover:scale-105 transition-transform">
                  <Image
                    src={systemSettings.faviconUrl || systemSettings.logoUrl || ""}
                    alt="Logo"
                    fill
                    className="object-contain"
                    sizes="32px"
                    priority
                  />
                </div>
              ) : (
                <div className="flex size-7.5 items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                  <UtensilsCrossedIcon className="size-4.5" />
                </div>
              )}

              <span className="text-sm font-black tracking-tight text-foreground group-hover:text-primary transition-colors hidden xs:inline">
                {systemSettings?.systemName || "AdisyonEx"}
              </span>
            </Link>

            {/* 
              SUB-PAGE HEADER ACTION:
              "Ana Ekran" yazılı geri gelme ikonu olan buton
              (Ana ekran hariç diğer tüm menülerde görünür)
            */}
            {!isMainScreen && (
              <Link
                href="/dashboard/orders"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background/90 hover:bg-muted/90 text-foreground font-black text-xs shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all active:scale-95 cursor-pointer group shrink-0"
                title="Ana Ekrana Dön"
              >
                <ArrowLeftIcon className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
                <span>Ana Ekran</span>
              </Link>
            )}

            {/* 
              MAIN SCREEN ACTION:
              "Modüller" / App Launcher Popover Button
              (Sadece Ana Ekranda görünür)
            */}
            {isMainScreen && (
              <div ref={appLauncherRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAppLauncherOpen((p) => !p)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all active:scale-95 cursor-pointer shadow-2xs",
                    isAppLauncherOpen
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "border-border/80 bg-background/90 hover:bg-muted/90 text-foreground hover:border-primary/40",
                  )}
                  aria-label="Modüller"
                >
                  <LayoutGridIcon className="size-3.5 stroke-[2.5]" />
                  <span>Modüller</span>
                </button>

                {/* Desktop App Launcher Modal / Grid Dropdown */}
                {isAppLauncherOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 z-50 overflow-hidden rounded-3xl border border-border/80 bg-card p-3 text-card-foreground shadow-2xl backdrop-blur-2xl ring-1 ring-primary/10 animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="flex items-center justify-between p-2 pb-2.5 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                          ❖
                        </span>
                        <span className="text-xs font-black text-foreground">Sistem Modülleri</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAppLauncherOpen(false)}
                        className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Kapat"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2.5 max-h-[70vh] overflow-y-auto pr-0.5">
                      {MODULE_ITEMS.map((mod) => (
                        <Link
                          key={mod.url}
                          href={mod.url}
                          prefetch={true}
                          onClick={() => setIsAppLauncherOpen(false)}
                          className="flex items-start gap-2.5 p-2.5 rounded-2xl border border-border/60 hover:border-primary/40 hover:bg-muted/70 hover:shadow-xs transition-all group active:scale-98 cursor-pointer"
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 shadow-2xs",
                              mod.iconBg,
                            )}
                          >
                            {mod.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                              {mod.title}
                            </h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {mod.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 
            CENTER SECTION:
            Subtle desktop window breadcrumb/title indicating current screen
          */}
          {!isMainScreen && (
            <div className="hidden md:flex items-center justify-center flex-1 min-w-0 pointer-events-none">
              <span className="text-xs font-bold text-muted-foreground/85 tracking-tight truncate px-3 py-1 rounded-full bg-muted/40 border border-border/40">
                {currentTitle}
              </span>
            </div>
          )}

          {/* 
            RIGHT SECTION:
            1. Sistemin Online olduğunu gösteren canlı yeşil ikon
            2. Süper Admin / Personel Girişi (Opsiyonel & Kompakt)
            3. Profilim Butonu (Avatar + Açılır Menü)
          */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sistemin Online Olduğunu Gösteren İkon */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black tracking-tight select-none shrink-0 shadow-2xs transition-colors",
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400",
              )}
              title={isOnline ? "Sistem Çevrimiçi & Senkronize" : "İnternet Bağlantısı Yok"}
            >
              <span className="relative flex size-2 shrink-0">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={cn(
                    "relative inline-flex rounded-full size-2",
                    isOnline ? "bg-emerald-500" : "bg-red-500",
                  )}
                />
              </span>
              <span className="hidden xs:inline">{isOnline ? "Online" : "Çevrimdışı"}</span>
            </div>

            {/* Subtle Admin / Staff shortcut */}
            {isAdmin && (
              <Link
                href="/admin"
                prefetch={true}
                className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                title="Süper Admin Paneli"
              >
                <ShieldCheckIcon className="size-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {restaurantUsername && (
              <a
                href={`/${restaurantUsername}/personals`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                title="Personel Girişi Sayfasını Yeni Sekmede Aç"
              >
                <ExternalLinkIcon className="size-3" />
                <span>Personel</span>
              </a>
            )}

            {/* Profilim Butonu */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((p) => !p)}
                className={cn(
                  "relative flex items-center gap-2 p-1 pl-1 sm:pr-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/80 hover:border-foreground/30 active:scale-95 transition-all cursor-pointer select-none outline-none shadow-2xs",
                  isProfileOpen && "border-primary ring-2 ring-primary/20 bg-muted",
                )}
                aria-label="Profil Menüsü"
              >
                <div className="relative size-7 sm:size-8 rounded-lg overflow-hidden bg-muted/40 border border-border/60 shrink-0">
                  <Image
                    src="/default-avatar.png"
                    alt={user.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                    priority
                  />
                </div>
                <div className="hidden sm:flex flex-col items-start text-left min-w-0">
                  <span className="text-xs font-black text-foreground truncate max-w-[110px] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground truncate leading-none">
                    Profilim
                  </span>
                </div>
              </button>

              {/* Categorized Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-76 sm:w-84 z-50 overflow-hidden rounded-3xl border border-border/80 bg-card p-3 text-card-foreground shadow-2xl backdrop-blur-2xl ring-1 ring-primary/10 animate-in fade-in-0 zoom-in-95 duration-150">
                  {/* Top Profile Header with X Close Button */}
                  <div className="flex items-center justify-between p-2 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-10 shrink-0 rounded-xl border border-border/70 overflow-hidden bg-muted/40 shadow-xs">
                        <Image
                          src="/default-avatar.png"
                          alt={user.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-foreground truncate">
                          {user.name}
                        </h4>
                        <p className="text-xs font-semibold text-muted-foreground truncate">
                          {user.contact}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Kapat"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>

                  {/* Kategori 1: 📊 Lisans & Paket Durumu */}
                  <div className="my-2.5 p-2.5 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs",
                          planBadge.color,
                        )}
                      >
                        {planBadge.label}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tabular-nums",
                          isExpired
                            ? "bg-destructive/10 text-destructive border-destructive/25"
                            : isExpiringSoon
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : isLifetime
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
                        )}
                      >
                        {isLifetime ? (
                          <>
                            <InfinityIcon className="size-2.5" />
                            <span>Süresiz</span>
                          </>
                        ) : isExpired ? (
                          <span>⛔ Süresi Doldu</span>
                        ) : (
                          <>
                            <span>⏳</span>
                            <span>{days} Gün Kaldı</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <SparklesIcon className="size-3.5 text-amber-500" />
                        <span>AI Kredisi:</span>
                      </span>
                      <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                        {aiBalance} Kredi
                      </span>
                    </div>
                  </div>

                  {/* Kategori 2: 🚀 Hızlı Erişim & Ayarlar */}
                  <div className="flex flex-col gap-1 pt-1">
                    {/* Yapay Zeka Stüdyosu */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/dashboard/ai-studio");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-xs font-bold text-foreground hover:bg-muted/80 hover:text-primary transition-all active:scale-98 cursor-pointer text-left group"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                        <SparklesIcon className="size-4" />
                      </div>
                      <span>Yapay Zeka Stüdyosu</span>
                    </button>

                    {/* Hesap & Profil Ayarları */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/dashboard/settings");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-xs font-bold text-foreground hover:bg-muted/80 hover:text-primary transition-all active:scale-98 cursor-pointer text-left group"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <CircleUserRoundIcon className="size-4" />
                      </div>
                      <span>Hesap & Profil Ayarları</span>
                    </button>

                    {/* Yetkili Satış Temsilcim */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsSalesRepModalOpen(true);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-xs font-bold text-foreground hover:bg-muted/80 hover:text-primary transition-all active:scale-98 cursor-pointer text-left group"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <HeadphonesIcon className="size-4" />
                      </div>
                      <span>Yetkili Satış Temsilcim</span>
                    </button>

                    {/* Kategori 3: 🔒 Oturum Kapat */}
                    <div className="my-1 border-t border-border/50" />
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await logoutAction();
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-xs font-black text-destructive hover:bg-destructive/10 transition-all active:scale-98 cursor-pointer text-left group"
                    >
                      <div className="flex size-8 items-center justify-center rounded-xl bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
                        <LogOutIcon className="size-4" />
                      </div>
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Satış Temsilcisi Modal */}
      <SalesRepModal
        open={isSalesRepModalOpen}
        onOpenChange={setIsSalesRepModalOpen}
      />
    </>
  );
}

function SalesRepModal({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-2 shadow-2xl">
        <DialogHeader className="p-4 pb-2 border-b bg-muted/30">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <HeadphonesIcon className="size-4.5 text-primary" />
            <span>Müşteri & Satış Temsilciniz</span>
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <SalesRepCard />
        </div>
      </DialogContent>
    </Dialog>
  );
}
