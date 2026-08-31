"use client"

import * as React from "react"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  UtensilsCrossedIcon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  ChefHatIcon,
  CalculatorIcon,
  BookOpenIcon,
  ArmchairIcon,
  BoxesIcon,
  UsersIcon,
  Settings2Icon,
  CircleHelpIcon,
  ShieldCheckIcon,
  GiftIcon,
} from "lucide-react"

const navMain = [
  { title: "Anlık Durum", url: "/dashboard/orders", icon: <ReceiptTextIcon />, isHighlighted: true },
  { title: "Mutfak Ekranı", url: "/dashboard/kitchen", icon: <ChefHatIcon /> },
  { title: "Yönetim Paneli", url: "/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "POS / Kasa", url: "/dashboard/pos", icon: <CalculatorIcon /> },
  { title: "Menü", url: "/dashboard/menu", icon: <BookOpenIcon /> },
  { title: "Masalar", url: "/dashboard/tables", icon: <ArmchairIcon /> },
  { title: "Kayıtlı Müşteriler", url: "/dashboard/customers", icon: <GiftIcon /> },
  { title: "Stok & Envanter", url: "/dashboard/inventory", icon: <BoxesIcon /> },
  { title: "Personel", url: "/dashboard/staff", icon: <UsersIcon /> },
]

import type { LicenseInfoDTO } from "@/services/license.service"
import type { SystemSettingsDTO } from "@/services/system-setting.service"

export function AppSidebar({
  user,
  license,
  systemSettings,
  allowedRoutes,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; contact: string; role?: string }
  license?: LicenseInfoDTO | null
  systemSettings?: Partial<SystemSettingsDTO> | null
  allowedRoutes?: readonly string[] | null
}) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN"
  
  const filteredNavMain = React.useMemo(() => {
    if (!allowedRoutes || allowedRoutes.length === 0) return navMain;
    return navMain.filter((item) => allowedRoutes.includes(item.url));
  }, [allowedRoutes]);

  const navSecondary = [
    ...(isAdmin
      ? [{ title: "Süper Yönetici Paneli", url: "/admin", icon: <ShieldCheckIcon /> }]
      : []),
    ...(!allowedRoutes || allowedRoutes.includes("/dashboard/settings")
      ? [{ title: "Ayarlar", url: "/dashboard/settings", icon: <Settings2Icon /> }]
      : []),
    { title: "Yardım Al", url: "#", icon: <CircleHelpIcon /> },
  ]
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5! h-11"
              render={<a href="/dashboard" />}
            >
              {systemSettings?.logoUrl ? (
                <div className="relative size-7 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={systemSettings.logoUrl}
                    alt={systemSettings.systemName || "Logo"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UtensilsCrossedIcon className="size-4!" />
                </div>
              )}
              <span className="text-sm font-black truncate">{systemSettings?.systemName || "ElitaleRestro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} license={license} />
      </SidebarFooter>
    </Sidebar>
  )
}
