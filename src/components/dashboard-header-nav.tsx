"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArmchairIcon,
  BookOpenIcon,
  BoxesIcon,
  CalculatorIcon,
  ChefHatIcon,
  CircleUserRoundIcon,
  ExternalLinkIcon,
  GiftIcon,
  HeadphonesIcon,
  InfinityIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";

import { logoutAction } from "@/actions/auth.actions";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { SalesRepCard } from "@/components/license/sales-rep-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, isActiveRoute } from "@/lib/utils";
import type { LicenseInfoDTO } from "@/services/license.service";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

interface NavItemConfig {
  readonly title: string;
  readonly url: string;
  readonly icon: React.ReactNode;
  readonly iconBg: string;
  readonly iconColor: string;
}

const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    title: "Anlık Durum",
    url: "/dashboard/orders",
    icon: <ReceiptTextIcon className="size-4.5" />,
    iconBg: "bg-amber-500/15 group-hover:bg-amber-500/25",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Mutfak",
    url: "/dashboard/kitchen",
    icon: <ChefHatIcon className="size-4.5" />,
    iconBg: "bg-rose-500/15 group-hover:bg-rose-500/25",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    title: "POS / Kasa",
    url: "/dashboard/pos",
    icon: <CalculatorIcon className="size-4.5" />,
    iconBg: "bg-emerald-500/15 group-hover:bg-emerald-500/25",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Genel Bakış",
    url: "/dashboard",
    icon: <LayoutDashboardIcon className="size-4.5" />,
    iconBg: "bg-sky-500/15 group-hover:bg-sky-500/25",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    title: "Masalar",
    url: "/dashboard/tables",
    icon: <ArmchairIcon className="size-4.5" />,
    iconBg: "bg-violet-500/15 group-hover:bg-violet-500/25",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Menü",
    url: "/dashboard/menu",
    icon: <BookOpenIcon className="size-4.5" />,
    iconBg: "bg-teal-500/15 group-hover:bg-teal-500/25",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    title: "Personel",
    url: "/dashboard/staff",
    icon: <UsersIcon className="size-4.5" />,
    iconBg: "bg-orange-500/15 group-hover:bg-orange-500/25",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    title: "Stok",
    url: "/dashboard/inventory",
    icon: <BoxesIcon className="size-4.5" />,
    iconBg: "bg-slate-500/15 group-hover:bg-slate-500/25",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  {
    title: "Müşteriler",
    url: "/dashboard/customers",
    icon: <GiftIcon className="size-4.5" />,
    iconBg: "bg-pink-500/15 group-hover:bg-pink-500/25",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
];

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSalesRepModalOpen, setIsSalesRepModalOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  // Close profile dropdown on outside click or escape
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const initials =
    user.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "UU";

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
      {/* 1. TOP SUB-HEADER BAR (Desktop & Tablet): En üst ince menü barı */}
      <div className="hidden lg:flex h-8 w-full items-center justify-between border-b border-border/60 bg-muted/40 px-4 lg:px-6 text-[11px] font-semibold text-muted-foreground select-none">
        {/* Left: Süper Admin | Personel Girişi | Hesabım */}
        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <>
              <Link
                href="/admin"
                prefetch={true}
                className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors cursor-pointer"
              >
                <ShieldCheckIcon className="size-3.5" />
                <span>Süper Admin</span>
              </Link>
              <span className="text-border/80">|</span>
            </>
          )}

          {restaurantUsername && (
            <>
              <a
                href={`/${restaurantUsername}/personals`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                <ExternalLinkIcon className="size-3" />
                <span>Personel Girişi</span>
              </a>
              <span className="text-border/80">|</span>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(true);
            }}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            <UserIcon className="size-3" />
            <span>Hesabım</span>
          </button>
        </div>

        {/* Right: Live Connection Dot (Sistem aktif yazısı gizlendi) */}
        <div className="flex items-center gap-2">
          <ConnectionStatus showLabel={false} />
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-2xl transition-all shadow-xs">
        <div className="flex h-16 w-full items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
          {/* 1. Left: Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((p) => !p)}
              className="flex size-9 items-center justify-center rounded-2xl border border-border/80 bg-muted/50 text-foreground hover:bg-muted xl:hidden transition-all active:scale-95 cursor-pointer"
              aria-label="Menüyü Aç"
            >
              <MenuIcon className="size-5" />
            </button>

            {/* Brand Logo */}
            <Link
              href="/dashboard/orders"
              prefetch={true}
              className="flex items-center gap-2.5 group select-none cursor-pointer"
            >
              {systemSettings?.faviconUrl || systemSettings?.logoUrl ? (
                <div className="relative size-9 shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-0.5 group-hover:scale-105 transition-transform">
                  <Image
                    src={systemSettings.faviconUrl || systemSettings.logoUrl || ""}
                    alt="Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <UtensilsCrossedIcon className="size-5" />
                </div>
              )}

              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {systemSettings?.systemName || "AdisyonEx"}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground -mt-0.5">
                  Restoran Yönetimi
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Middle: Navigation items in button/squircle style (Image-inspired layout) */}
          <nav className="hidden xl:flex items-center gap-1.5 flex-1 justify-center max-w-5xl">
            {NAV_ITEMS.map((item) => {
              const active = isActiveRoute(pathname, item.url);
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  prefetch={true}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-all duration-200 select-none cursor-pointer border",
                    active
                      ? "bg-card text-foreground border-primary/50 shadow-md shadow-primary/10 scale-[1.03] ring-1 ring-primary/20"
                      : "bg-muted/30 border-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border hover:shadow-xs active:scale-95",
                  )}
                >
                  {/* Colorful Rounded Icon Box */}
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 shadow-2xs",
                      item.iconBg,
                      item.iconColor,
                      active && "scale-105 shadow-xs",
                    )}
                  >
                    {item.icon}
                  </div>

                  <span className="tracking-tight whitespace-nowrap">{item.title}</span>

                  {/* Active Bottom Indicator Pill */}
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary animate-in zoom-in-75 duration-200" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. Right: ONLY Profile Photo Avatar with Popover */}
          <div className="flex items-center gap-3 shrink-0">
            <div ref={profileRef} className="relative">
              {/* Profile Avatar Button ONLY */}
              <button
                type="button"
                onClick={() => setIsProfileOpen((p) => !p)}
                className={cn(
                  "relative flex size-10 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/30 ring-2 ring-primary/15 bg-gradient-to-br from-primary/20 via-amber-500/10 to-primary/10 text-primary shadow-xs hover:scale-105 hover:ring-primary/40 active:scale-95 transition-all duration-200 cursor-pointer select-none outline-none",
                  isProfileOpen && "ring-primary/60 border-primary scale-105 shadow-md",
                )}
                aria-label="Profil Menüsü"
              >
                <Avatar className="size-full rounded-2xl">
                  <AvatarFallback className="rounded-2xl text-xs font-black text-primary bg-transparent">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* Categorized Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-76 sm:w-84 z-50 overflow-hidden rounded-3xl border border-border/80 bg-card p-3 text-card-foreground shadow-2xl backdrop-blur-2xl ring-1 ring-primary/10 animate-in fade-in-0 zoom-in-95 duration-150">
                  {/* Top Profile Header with X Close Button */}
                  <div className="flex items-center justify-between p-2 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 shrink-0 rounded-2xl border border-primary/30 ring-2 ring-primary/20 bg-primary/10 text-primary shadow-xs">
                        <AvatarFallback className="rounded-2xl text-sm font-black text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
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
                      className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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

        {/* 3. Mobile Navigation Drawer / Dropdown */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-border/80 bg-background/98 backdrop-blur-2xl p-4 animate-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NAV_ITEMS.map((item) => {
                const active = isActiveRoute(pathname, item.url);
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl p-3 text-xs font-bold transition-all border",
                      active
                        ? "bg-card text-foreground border-primary shadow-sm ring-1 ring-primary/20"
                        : "bg-muted/30 border-border/70 text-foreground hover:border-primary/40",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-lg",
                        item.iconBg,
                        item.iconColor,
                      )}
                    >
                      {item.icon}
                    </div>
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}

              {restaurantUsername && (
                <a
                  href={`/${restaurantUsername}/personals`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl p-3 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                >
                  <ExternalLinkIcon className="size-4" />
                  <span>Personel Girişi</span>
                </a>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-2xl p-3 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 col-span-2 sm:col-span-1"
                >
                  <ShieldCheckIcon className="size-4" />
                  <span>Süper Admin Paneli</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Sales Representative Card Modal */}
      <Dialog open={isSalesRepModalOpen} onOpenChange={setIsSalesRepModalOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-primary/20">
          <DialogHeader className="mb-1 text-left">
            <div className="flex items-center gap-1.5 text-primary mb-0.5">
              <HeadphonesIcon className="size-4" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                Özel Müşteri Danışmanı
              </span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black">
              Yetkili Satış & Lisans Temsilciniz
            </DialogTitle>
          </DialogHeader>

          <SalesRepCard salesRep={license?.salesRep} />
        </DialogContent>
      </Dialog>
    </>
  );
}
