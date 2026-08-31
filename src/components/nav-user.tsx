"use client";

import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BellIcon,
  CircleUserRoundIcon,
  CrownIcon,
  EllipsisVerticalIcon,
  InfinityIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";

import { logoutAction } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";
import type { LicenseInfoDTO } from "@/services/license.service";

export function NavUser({
  user,
  license,
}: {
  user: {
    name: string;
    contact: string;
  };
  license?: LicenseInfoDTO | null;
}) {
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

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
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "group flex w-full text-left transition-all duration-200 outline-none select-none cursor-pointer",
              isCollapsed
                ? "items-center justify-center p-2 rounded-xl hover:bg-muted"
                : "flex-col gap-2.5 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/30 p-3 shadow-xs hover:border-border hover:shadow-md active:scale-[0.99]",
            )}
          >
            {/* Top Row: User Avatar + Name + More Icon */}
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
                  <EllipsisVerticalIcon className="size-4 shrink-0 text-muted-foreground/80 group-hover:text-foreground transition-colors" />
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

                {/* AI Credits Bar */}
                <div className="flex items-center justify-between rounded-xl bg-muted/60 px-2.5 py-1 text-xs">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                    <SparklesIcon className="size-3 text-amber-500" />
                    AI Kredisi:
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400 text-xs tabular-nums">
                    {aiBalance} Kredi
                  </span>
                </div>
              </div>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-64 rounded-2xl p-1.5 shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="flex items-center gap-2.5 text-left text-sm">
                  <Avatar className="size-9 rounded-xl border border-primary/20 bg-primary/10">
                    <AvatarFallback className="rounded-xl text-xs font-black text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-sm leading-tight">
                    <span className="block truncate font-bold text-foreground">{user.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.contact}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* License & AI Info Summary */}
            <div className="p-2 flex flex-col gap-1.5 bg-muted/40 rounded-xl my-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Lisans Planı:</span>
                <span className="font-bold text-foreground">{license?.planLabel || "Deneme Sürümü"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Kalan Gün:</span>
                <span className={cn("font-bold tabular-nums", isExpired ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                  {isLifetime ? "Süresiz" : isExpired ? "Doldu" : `${days} Gün`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Kalan AI Kredisi:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {aiBalance} Kredi
                </span>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer rounded-xl font-medium"
                onClick={() => router.push("/dashboard/ai-studio")}
              >
                <SparklesIcon className="size-4 text-amber-500 mr-2" />
                Yapay Zeka Stüdyosu
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer rounded-xl font-medium"
                onClick={() => router.push("/dashboard/settings")}
              >
                <CircleUserRoundIcon className="size-4 mr-2" />
                Hesap & Restoran Ayarları
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer rounded-xl font-medium"
                onClick={() => router.push("/dashboard/orders")}
              >
                <BellIcon className="size-4 mr-2" />
                Sipariş Bildirimleri
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer rounded-xl font-medium text-destructive focus:text-destructive"
              onClick={() => void logoutAction()}
            >
              <LogOutIcon className="size-4 mr-2" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
