"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn, isActiveRoute } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isHighlighted?: boolean
  }[]
}) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isLive = item.url === "/dashboard/orders" || item.isHighlighted;
            const active = isActiveRoute(pathname, item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={active}
                  className={cn(
                    isLive &&
                      "bg-primary/10 border border-primary/30 text-primary font-bold shadow-xs hover:bg-primary/20 hover:border-primary/50 transition-all",
                  )}
                  render={<Link href={item.url} />}
                >
                  {item.icon}
                  <span className={cn(isLive && "font-bold text-foreground")}>{item.title}</span>
                  {isLive && (
                    <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CANLI
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
