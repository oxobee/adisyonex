"use client"

import * as React from "react"

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
  CalculatorIcon,
  BookOpenIcon,
  ArmchairIcon,
  BoxesIcon,
  UsersIcon,
  Settings2Icon,
  CircleHelpIcon,
  ShieldCheckIcon,
  GiftIcon,
  SparklesIcon,
} from "lucide-react"

const navMain = [
  { title: "Yönetim Paneli", url: "/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "POS / Kasa", url: "/dashboard/pos", icon: <CalculatorIcon /> },
  { title: "Anlık Durum", url: "/dashboard/orders", icon: <ReceiptTextIcon /> },
  { title: "Menü", url: "/dashboard/menu", icon: <BookOpenIcon /> },
  { title: "Masalar", url: "/dashboard/tables", icon: <ArmchairIcon /> },
  { title: "Kayıtlı Müşteriler", url: "/dashboard/customers", icon: <GiftIcon /> },
  { title: "Stok & Envanter", url: "/dashboard/inventory", icon: <BoxesIcon /> },
  { title: "Personel", url: "/dashboard/staff", icon: <UsersIcon /> },
]

import type { LicenseInfoDTO } from "@/services/license.service"

export function AppSidebar({
  user,
  license,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; contact: string; role?: string }
  license?: LicenseInfoDTO | null
}) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN"
  const navSecondary = [
    ...(isAdmin
      ? [{ title: "Süper Yönetici Paneli", url: "/admin", icon: <ShieldCheckIcon /> }]
      : []),
    { title: "Ayarlar", url: "/dashboard/settings", icon: <Settings2Icon /> },
    { title: "Yardım Al", url: "#", icon: <CircleHelpIcon /> },
  ]
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <UtensilsCrossedIcon className="size-5!" />
              <span className="text-base font-semibold">ElitaleRestro</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} license={license} />
      </SidebarFooter>
    </Sidebar>
  )
}
