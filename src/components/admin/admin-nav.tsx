"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  GlobeIcon,
  HeadphonesIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  SparklesIcon,
  StoreIcon,
  UsersIcon,
  UtensilsCrossedIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
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

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex w-60 shrink-0 flex-col border-r">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        {systemSettings?.faviconUrl || systemSettings?.logoUrl ? (
          <div className="relative size-6 shrink-0 overflow-hidden rounded-md">
            <Image
              src={systemSettings.faviconUrl || systemSettings.logoUrl || ""}
              alt="İkon"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <UtensilsCrossedIcon className="text-primary size-5" aria-hidden />
        )}
        {systemSettings?.logoUrl ? (
          <div className="relative h-6 max-w-[110px] w-full min-w-0 flex-1">
            <Image
              src={systemSettings.logoUrl}
              alt={systemSettings.systemName || "Logo"}
              fill
              className="object-contain object-left"
              unoptimized
            />
          </div>
        ) : (
          <span className="font-bold text-sm truncate">{systemSettings?.systemName || "ElitaleRestro"}</span>
        )}
        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded ml-auto shrink-0">
          Süper Admin
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t p-3">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
        >
          <UtensilsCrossedIcon className="size-4" aria-hidden />
          Restoran Paneline Dön
        </Link>
      </div>
    </aside>
  );
}
