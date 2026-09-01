"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  GlobeIcon,
  HeadphonesIcon,
  LayoutDashboardIcon,
  MenuIcon,
  Settings2Icon,
  SparklesIcon,
  StoreIcon,
  UsersIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

const NAV = [
  { title: "Genel Bakış", href: "/admin", icon: LayoutDashboardIcon },
  { title: "Satış Temsilcileri", href: "/admin/sales-reps", icon: HeadphonesIcon },
  { title: "Restoranlar", href: "/admin/restaurants", icon: StoreIcon },
  { title: "Kullanıcılar", href: "/admin/users", icon: UsersIcon },
  { title: "AI Stüdyo & Krediler", href: "/admin/ai-studio", icon: SparklesIcon },
  { title: "Sistem & SEO Ayarları", href: "/admin/system", icon: Settings2Icon },
] as const;

const isActive = (pathname: string, href: string): boolean =>
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

export function AdminNav({
  systemSettings,
}: {
  readonly systemSettings?: Partial<SystemSettingsDTO> | null;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const brandContent = (
    <div className="flex items-center gap-2.5">
      {systemSettings?.faviconUrl || systemSettings?.logoUrl ? (
        <div className="relative size-7 shrink-0 overflow-hidden rounded-lg border border-primary/20 bg-primary/10 p-0.5 shadow-xs">
          <Image
            src={systemSettings.faviconUrl || systemSettings.logoUrl || ""}
            alt="İkon"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UtensilsCrossedIcon className="size-4" aria-hidden />
        </div>
      )}
      {systemSettings?.logoUrl ? (
        <div className="relative h-6 max-w-[120px] w-full min-w-0 flex-1">
          <Image
            src={systemSettings.logoUrl}
            alt={systemSettings.systemName || "Logo"}
            fill
            className="object-contain object-left"
            unoptimized
          />
        </div>
      ) : (
        <span className="font-black text-sm tracking-tight text-foreground truncate">
          {systemSettings?.systemName || "ElitaleRestro"}
        </span>
      )}
      <span className="text-primary text-[10px] font-black uppercase tracking-wider bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md ml-auto shrink-0">
        Süper Admin
      </span>
    </div>
  );

  const navLinks = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-black"
                : "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]",
            )}
          >
            <item.icon className={cn("size-4 shrink-0", active ? "text-primary-foreground" : "text-primary")} aria-hidden />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* MOBILE TOP BAR (Hidden on Desktop) */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-card/95 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {brandContent}
        </div>

        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="ml-2 rounded-xl text-foreground hover:bg-muted shrink-0 cursor-pointer"
          aria-label="Menüyü Aç"
        >
          {isMobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </Button>
      </header>

      {/* MOBILE SLIDE-OUT DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative flex w-4/5 max-w-xs flex-col border-r bg-card shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="min-w-0 flex-1 pr-2">
                {brandContent}
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {navLinks}
            </div>

            <div className="mt-auto border-t p-3 bg-muted/30">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <UtensilsCrossedIcon className="size-4 text-primary" aria-hidden />
                <span>Restoran Paneline Dön</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="hidden md:flex bg-sidebar text-sidebar-foreground w-64 shrink-0 flex-col border-r min-h-screen sticky top-0">
        <div className="flex h-16 items-center border-b px-4">
          {brandContent}
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {navLinks}
        </div>

        <div className="mt-auto border-t p-4 bg-sidebar-accent/30">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 text-xs font-bold text-foreground shadow-xs hover:border-primary/40 hover:text-primary transition-all active:scale-[0.98]"
          >
            <UtensilsCrossedIcon className="size-4 text-primary" aria-hidden />
            <span>Restoran Paneline Dön</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
