"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLinkIcon, LockIcon, LogOutIcon } from "lucide-react";

import { ConnectionStatus } from "@/components/shared/connection-status";
import { StaffLockModal } from "@/components/staff/staff-lock-modal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  WAITER: "Garson",
  KITCHEN: "Mutfak",
  CASHIER: "Kasa",
  MANAGEMENT: "Yönetici",
  OTHER: "Diğer",
  ADMIN: "Yönetici",
  STAFF: "Personel",
};

const SCREEN_NAV: Record<string, { label: string; icon: string }> = {
  "/dashboard/pos": { label: "POS / Kasa", icon: "💳" },
  "/dashboard/orders": { label: "Anlık Durum", icon: "📋" },
  "/dashboard/kitchen": { label: "Mutfak Ekranı", icon: "🍳" },
  "/dashboard/tables": { label: "Masalar", icon: "🪑" },
  "/dashboard/menu": { label: "Menü", icon: "📖" },
  "/dashboard/customers": { label: "Müşteriler", icon: "🎁" },
  "/dashboard/inventory": { label: "Stok & Envanter", icon: "📦" },
  "/dashboard/staff": { label: "Personel", icon: "👥" },
  "/dashboard": { label: "Yönetim Paneli", icon: "📊" },
  "/dashboard/settings": { label: "Ayarlar", icon: "⚙️" },
};

export interface StaffHeaderInfo {
  readonly name: string;
  readonly role: string;
  readonly employeeCode?: string;
  readonly photoUrl?: string | null;
  readonly allowedRoutes?: readonly string[] | null;
}

export function SiteHeader({
  staffLoginUsername,
  staffContext,
  isStaff = false,
  restaurantUsername,
}: {
  readonly staffLoginUsername?: string | null;
  readonly staffContext?: StaffHeaderInfo | null;
  readonly isStaff?: boolean;
  readonly restaurantUsername?: string | null;
}) {
  const pathname = usePathname();
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // STAFF HEADER: Fixed top bar with staff name and "Ekranı Kilitle" button
  if (isStaff && staffContext) {
    const initials =
      staffContext.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?";

    const allowed = staffContext.allowedRoutes && staffContext.allowedRoutes.length > 0
      ? staffContext.allowedRoutes
      : null;

    return (
      <>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur-md px-3 sm:px-6 shadow-xs gap-2">
          {/* Left: Staff Profile */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 shrink-0 overflow-hidden rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shadow-xs">
              {staffContext.photoUrl ? (
                <Image
                  src={staffContext.photoUrl}
                  alt={staffContext.name}
                  width={36}
                  height={36}
                  className="size-full object-cover"
                  unoptimized
                />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
              <span className="truncate text-sm sm:text-base font-black text-foreground">
                {staffContext.name}
              </span>
              <span className="shrink-0 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-extrabold uppercase">
                {ROLE_LABELS[staffContext.role] ?? staffContext.role}
              </span>
            </div>
          </div>

          {/* Center: Allowed Screens Navigation (if staff has multiple permitted screens) */}
          {allowed && allowed.length > 1 && (
            <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
              {allowed.map((route) => {
                const nav = SCREEN_NAV[route] ?? { label: route.replace("/dashboard/", ""), icon: "📄" };
                const isActive = pathname === route || pathname.startsWith(`${route}/`);
                return (
                  <Link
                    key={route}
                    href={route}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs scale-102"
                        : "bg-muted/70 text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{nav.icon}</span>
                    <span className="hidden md:inline">{nav.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: "Ekranı Kilitle" Lock Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLockModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border-primary/30 bg-primary/5 hover:bg-primary hover:text-primary-foreground text-primary font-bold text-xs sm:text-sm h-9 px-3 sm:px-4 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <LockIcon className="size-3.5 sm:size-4" />
              <span>Ekranı Kilitle</span>
            </Button>
          </div>
        </header>

        {/* Lock Modal */}
        <StaffLockModal
          isOpen={isLockModalOpen}
          onClose={() => setIsLockModalOpen(false)}
          staff={staffContext}
          restaurantUsername={restaurantUsername}
        />
      </>
    );
  }

  // MANAGER / ADMIN HEADER: Regular sidebar header with ConnectionStatus
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:gap-3 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-1 h-4 data-vertical:self-auto"
          />
          <h1 className="text-sm sm:text-base font-bold text-foreground">Adisyon & POS</h1>
        </div>

        {/* Live System Connection Indicator */}
        <div className="flex items-center gap-2">
          <ConnectionStatus />

          {staffLoginUsername ? (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-xl"
              render={
                <a
                  href={`/${staffLoginUsername}/personals`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLinkIcon className="size-4" />
              Personel Girişi
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
