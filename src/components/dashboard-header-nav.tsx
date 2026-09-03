"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeftIcon,
  CircleUserRoundIcon,
  HeadphonesIcon,
  InfinityIcon,
  LogOutIcon,
  SparklesIcon,
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
import { cn } from "@/lib/utils";
import type { LicenseInfoDTO } from "@/services/license.service";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard/home": "Ana Ekran",
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
  const [isSalesRepModalOpen, setIsSalesRepModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);

  // Check if current screen is the Main Screen (Ana Ekran)
  const isMainScreen = pathname === "/dashboard/home";

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

  // Close profile dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
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
        CLEAN SAAS OS WINDOW TITLEBAR
        Single-row, minimalist header:
        - Yatay Sistem Logosu
        - Geri gelme ikonu olan "Ana Ekran" butonu (alt sayfalarda)
        - Canlı "Online" durum ikonu
        - "Profilim" butonu
      */}
      <header className="sticky top-0 z-40 w-full h-14 border-b border-border/70 bg-background/90 dark:bg-zinc-950/90 backdrop-blur-xl transition-all select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex h-full w-full items-center justify-between px-3 sm:px-5 lg:px-6 gap-3">
          {/* 
            SOL BÖLÜM:
            1. Yatay Sistem Logosu (AdisyonEx)
            2. "Ana Ekran" Geri Gelme Butonu (Ana ekran hariç tüm sayfalarda)
          */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            {/* Yatay Sistem Logosu */}
            <Link
              href="/dashboard/home"
              prefetch={true}
              className="flex items-center select-none cursor-pointer group shrink-0"
              title="Ana Ekran"
            >
              {systemSettings?.logoUrl || systemSettings?.logoDarkUrl ? (
                <div className="relative h-8 sm:h-9 w-36 sm:w-44 max-w-[190px]">
                  {/* Light Mode Logo (Açık tema / Siyah logo) */}
                  {systemSettings?.logoUrl && (
                    <Image
                      src={systemSettings.logoUrl}
                      alt={systemSettings?.systemName || "AdisyonEx"}
                      fill
                      className={cn(
                        "object-contain object-left",
                        systemSettings.logoDarkUrl && "dark:hidden",
                      )}
                      priority
                      sizes="(max-width: 640px) 144px, 176px"
                    />
                  )}

                  {/* Dark Mode Logo (Koyu tema / Beyaz logo) */}
                  {systemSettings?.logoDarkUrl && (
                    <Image
                      src={systemSettings.logoDarkUrl}
                      alt={systemSettings?.systemName || "AdisyonEx"}
                      fill
                      className={cn(
                        "object-contain object-left",
                        systemSettings.logoUrl ? "hidden dark:block" : "block",
                      )}
                      priority
                      sizes="(max-width: 640px) 144px, 176px"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {systemSettings?.faviconUrl ? (
                    <div className="relative size-8 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={systemSettings.faviconUrl}
                        alt="Logo"
                        fill
                        className="object-contain"
                        sizes="32px"
                      />
                    </div>
                  ) : (
                    <div className="flex size-8 items-center justify-center text-primary">
                      <UtensilsCrossedIcon className="size-5" />
                    </div>
                  )}
                  <span className="text-base font-black tracking-tight text-foreground">
                    {systemSettings?.systemName || "AdisyonEx"}
                  </span>
                </div>
              )}
            </Link>

            {/* 
              SUB-PAGE HEADER ACTION:
              "Ana Ekran" yazılı geri gelme ikonu olan buton
              (Ana ekran hariç diğer tüm menülerde görünür)
            */}
            {!isMainScreen && (
              <Link
                href="/dashboard/home"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background/90 hover:bg-muted/90 text-foreground font-black text-xs shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all active:scale-95 cursor-pointer group shrink-0"
                title="Ana Ekrana Dön"
              >
                <ArrowLeftIcon className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
                <span>Ana Ekran</span>
              </Link>
            )}
          </div>

          {/* 
            ORTA BÖLÜM:
            Alt sayfalarda hafif sayfa başlığı göstergesi
          */}
          {!isMainScreen && (
            <div className="hidden md:flex items-center justify-center flex-1 min-w-0 pointer-events-none">
              <span className="text-xs font-bold text-muted-foreground/85 tracking-tight truncate px-3 py-1 rounded-full bg-muted/40 border border-border/40">
                {currentTitle}
              </span>
            </div>
          )}

          {/* 
            SAĞ BÖLÜM:
            1. Sistemin Online olduğunu gösteren canlı yeşil ikon
            2. Profilim Butonu (Avatar + Açılır Menü)
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
                <div className="relative size-7.5 sm:size-8 rounded-lg overflow-hidden bg-muted/40 border border-border/60 shrink-0">
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
