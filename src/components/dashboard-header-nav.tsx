"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
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

  const isMainScreen = pathname === "/dashboard/home";
  const isAdmin =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "MANAGER";

  const currentTitle =
    ROUTE_TITLES[pathname] ||
    (pathname.startsWith("/dashboard/orders/")
      ? "Sipariş Detayı"
      : pathname.startsWith("/dashboard/inventory/")
        ? "Stok Detayı"
        : pathname.startsWith("/dashboard/ai-studio")
          ? "Yapay Zeka Stüdyosu"
          : "Yönetim Paneli");

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
      <header className="sticky top-0 z-40 w-full h-14 border-b border-border/70 bg-background/90 dark:bg-zinc-950/90 backdrop-blur-xl transition-all select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex h-full w-full items-center justify-between px-3 sm:px-5 lg:px-6 gap-3">
          {/* SOL BOLUM */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <Link
              href="/dashboard/home"
              prefetch={true}
              className="flex items-center select-none cursor-pointer group shrink-0"
              title="Ana Ekran"
            >
              {systemSettings?.logoUrl || systemSettings?.logoDarkUrl ? (
                <div className="relative h-8 sm:h-9 w-36 sm:w-44 max-w-[190px]">
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

            {!isMainScreen && (
              <Link
                href="/dashboard/home"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background/90 hover:bg-muted/90 text-foreground font-black text-xs shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all active:scale-95 cursor-pointer group shrink-0 ml-auto"
                title="Ana Ekrana Don"
              >
                <XIcon className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform stroke-[2.5]" />
              </Link>
            )}
          </div>

          {/* ORTA BOLUM */}
          {!isMainScreen && (
            <div className="hidden md:flex items-center justify-center flex-1 min-w-0 pointer-events-none">
              <span className="text-xs font-bold text-muted-foreground/85 tracking-tight truncate px-3 py-1 rounded-full bg-muted/40 border border-border/40">
                {currentTitle}
              </span>
            </div>
          )}

          {/* SAG BOLUM */}
          {isAdmin && isMainScreen && (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Online gostergesi */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-border/50">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500",
                  )}
                />
                <span className="text-[10px] font-bold text-muted-foreground hidden sm:block">
                  {isOnline ? "Online" : "Cevrimdisi"}
                </span>
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
                  aria-label="Profil Menusu"
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

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-76 sm:w-84 z-50 overflow-hidden rounded-3xl border border-border/80 bg-card p-3 text-card-foreground shadow-2xl backdrop-blur-2xl ring-1 ring-primary/10 animate-in fade-in-0 zoom-in-95 duration-150">
                    {/* Profil basligi */}
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
                          <div className="flex flex-wrap gap-1 mt-0.5">
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
                                  <span>Suresiz</span>
                                </>
                              ) : isExpired ? (
                                <span>Suresi Doldu</span>
                              ) : (
                                <>
                                  <span>{days} Gun Kaldi</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Kredisi */}
                    <div className="flex items-center justify-between text-xs font-bold p-2 pt-2 border-b border-border/40">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <SparklesIcon className="size-3.5 text-amber-500" />
                        <span>AI Kredisi:</span>
                      </span>
                      <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                        {aiBalance} Kredi
                      </span>
                    </div>

                    {/* Menu butonlari */}
                    <div className="flex flex-col gap-1 pt-1">
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
                        <span>Yapay Zeka Studyosu</span>
                      </button>

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
                        <span>Hesap ve Profil Ayarlari</span>
                      </button>

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
                        <span>Yetkili Satis Temsilcim</span>
                      </button>

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
                        <span>Cikis Yap</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Satis Temsilcisi Modal */}
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
            <span>Musteri ve Satis Temsilciniz</span>
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <SalesRepCard />
        </div>
      </DialogContent>
    </Dialog>
  );
}
