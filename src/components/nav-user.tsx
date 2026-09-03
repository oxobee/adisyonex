"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CircleUserRoundIcon,
  EllipsisVerticalIcon,
  HeadphonesIcon,
  InfinityIcon,
  LogOutIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

import { logoutAction } from "@/actions/auth.actions";
import { directStaffLogoutAction } from "@/actions/staff-auth.actions";
import { SalesRepCard } from "@/components/license/sales-rep-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { LicenseInfoDTO } from "@/services/license.service";

export function NavUser({
  user,
  license,
}: {
  user: {
    name: string;
    contact: string;
    role?: string;
  };
  license?: LicenseInfoDTO | null;
}) {
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isOpen, setIsOpen] = useState(false);
  const [isSalesRepModalOpen, setIsSalesRepModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  // STAFF ONLY PROFILE CARD (No dropdown, no license/credits, only direct logout button)
  if (user.role === "STAFF") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/30 p-3 shadow-xs",
              isCollapsed && "p-2 justify-center",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="size-9 shrink-0 rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
                <AvatarFallback className="rounded-xl text-xs font-black text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-foreground leading-tight">
                    {user.name}
                  </span>
                  <span className="inline-block mt-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 text-[10px] font-black uppercase truncate">
                    {user.contact || "Personel"}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={async () => {
                  await directStaffLogoutAction();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-2.5 py-1.5 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                title="Çıkış Yap"
              >
                <LogOutIcon className="size-3.5" />
                <span>Çıkış</span>
              </button>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const plan = license?.plan || "TRIAL";
  const days = license?.daysRemaining ?? 0;
  const isLifetime = plan === "LIFETIME" || days === 9999;
  const isExpired = days <= 0 && !isLifetime;
  const isExpiringSoon = days <= 7 && !isLifetime && !isExpired;
  const aiBalance = license?.aiBalance ?? 0;

  // Plan badge formatting
  const planBadge =
    plan === "YEARLY"
      ? { label: "👑 Yıllık Pro", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30" }
      : plan === "MONTHLY"
        ? { label: "💎 Aylık", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30" }
        : plan === "LIFETIME"
          ? { label: "♾️ Süresiz", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30" }
          : { label: "⚡ Deneme", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30" };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div ref={menuRef} className="relative w-full">
          {/* Manager Profile Card / Trigger */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
              }
            }}
            className={cn(
              "group flex w-full text-left transition-all duration-200 outline-none select-none cursor-pointer",
              isCollapsed
                ? "items-center justify-center p-2 rounded-xl hover:bg-muted"
                : "flex-col gap-2.5 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/30 p-3 shadow-xs hover:border-border hover:shadow-md active:scale-[0.99]",
            )}
          >
            {/* Top Row: User Avatar + Name + 3 Dots Button */}
            <div className="flex w-full items-center gap-3">
              <Avatar className="size-9 shrink-0 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/20 via-amber-500/10 to-primary/10 text-primary shadow-xs">
                <AvatarFallback className="rounded-xl text-xs font-black text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {user.name}
                    </span>
                    <span className="block truncate text-[11px] font-medium text-muted-foreground">
                      {user.contact}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg hover:bg-muted/80 text-muted-foreground/80 group-hover:text-foreground transition-colors",
                      isOpen && "bg-muted text-foreground",
                    )}
                  >
                    <EllipsisVerticalIcon className="size-4" />
                  </div>
                </>
              )}
            </div>

            {/* Bottom Row: Remaining Days & AI Credits Badges */}
            {!isCollapsed && (
              <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
                <div className="flex items-center justify-between gap-1.5">
                  {/* License Badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight shadow-2xs",
                      planBadge.color,
                    )}
                  >
                    {planBadge.label}
                  </span>

                  {/* Remaining Days Counter */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold tabular-nums tracking-tight",
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

                {/* AI Balance Bar */}
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <SparklesIcon className="size-3 text-amber-500" />
                    <span>AI Kredisi:</span>
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    {aiBalance} Kredi
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3-Dots Popup Menu */}
          {isOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 z-50 overflow-hidden rounded-2xl border border-border bg-popover/95 p-1.5 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="flex items-center justify-between p-2 border-b border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-7 shrink-0 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-foreground">
                      {user.name}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {user.contact}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-0.5 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/dashboard/settings");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <CircleUserRoundIcon className="size-4 text-primary" />
                  <span>Hesap & Profil Ayarları</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsSalesRepModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer text-left"
                >
                  <HeadphonesIcon className="size-4 text-primary" />
                  <span>Yetkili Satış Temsilcim</span>
                </button>

                <div className="my-1 border-t border-border/50" />

                <button
                  type="button"
                  onClick={async () => {
                    setIsOpen(false);
                    await logoutAction();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
                >
                  <LogOutIcon className="size-4" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          )}

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
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
