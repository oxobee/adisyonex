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
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
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
  LogInIcon,
  PaletteIcon,
} from "lucide-react"

import type { LicenseInfoDTO } from "@/services/license.service"
import type { SystemSettingsDTO } from "@/services/system-setting.service"

const navGroups = [
  {
    label: "Operasyon",
    items: [
      { title: "Anlık Durum", url: "/dashboard/orders", icon: <ReceiptTextIcon />, isHighlighted: true },
      { title: "Mutfak Ekranı", url: "/dashboard/kitchen", icon: <ChefHatIcon /> },
      { title: "POS / Kasa", url: "/dashboard/pos", icon: <CalculatorIcon /> },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { title: "Genel Bakış", url: "/dashboard", icon: <LayoutDashboardIcon /> },
      { title: "Menü", url: "/dashboard/menu", icon: <BookOpenIcon /> },
      { title: "Menü Tasarım", url: "/dashboard/menu-design", icon: <PaletteIcon /> },
      { title: "Masalar", url: "/dashboard/tables", icon: <ArmchairIcon /> },
      { title: "Personel", url: "/dashboard/staff", icon: <UsersIcon /> },
    ],
  },
  {
    label: "Müşteri & Stok",
    items: [
      { title: "Kayıtlı Müşteriler", url: "/dashboard/customers", icon: <GiftIcon /> },
      { title: "Stok & Envanter", url: "/dashboard/inventory", icon: <BoxesIcon /> },
    ],
  },
]

export function AppSidebar({
  user,
  license,
  systemSettings,
  allowedRoutes,
  restaurantUsername,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; contact: string; role?: string }
  license?: LicenseInfoDTO | null
  systemSettings?: Partial<SystemSettingsDTO> | null
  allowedRoutes?: readonly string[] | null
  restaurantUsername?: string | null
}) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN"

  const filteredGroups = React.useMemo(() => {
    if (!allowedRoutes || allowedRoutes.length === 0) return navGroups
    return navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => allowedRoutes.includes(item.url)),
      }))
      .filter((g) => g.items.length > 0)
  }, [allowedRoutes])

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
              {systemSettings?.faviconUrl || systemSettings?.logoUrl ? (
                <div className="relative size-7 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={systemSettings.faviconUrl || systemSettings.logoUrl || ""}
                    alt="İkon"
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
              {systemSettings?.logoUrl ? (
                <div className="relative h-6 max-w-[140px] w-full min-w-0 flex-1">
                  <Image
                    src={systemSettings.logoUrl}
                    alt={systemSettings.systemName || "Logo"}
                    fill
                    className="object-contain object-left"
                    unoptimized
                  />
                </div>
              ) : (
                <span className="text-sm font-black truncate">{systemSettings?.systemName || "AdisyonEx"}</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Categorized nav groups */}
        {filteredGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}

        {/* Personel Girişi — opens in new tab */}
        <StaffLoginButton restaurantUsername={restaurantUsername} />

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} license={license} />
      </SidebarFooter>
    </Sidebar>
  )
}

function StaffLoginButton({
  restaurantUsername,
}: {
  readonly restaurantUsername?: string | null
}) {
  const { setOpenMobile } = useSidebar()
  const loginUrl = restaurantUsername
    ? `/${restaurantUsername}/personals`
    : "/personelgiris"

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Personel Giriş Ekranı"
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all"
              render={
                <a
                  href={loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMobile(false)}
                />
              }
            >
              <LogInIcon className="text-emerald-600 dark:text-emerald-400 size-4" />
              <span className="font-bold">Personel Girişi</span>
              <span className="ml-auto text-[10px] text-muted-foreground border border-border/60 rounded px-1 py-0.5 font-bold shrink-0">
                ↗
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
