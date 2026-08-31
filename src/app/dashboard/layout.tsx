import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireUserId } from "@/lib/auth-helpers"
import { getManagerContextOrNull } from "@/lib/manager-auth"
import { serializeForClient } from "@/lib/utils"
import { getRestaurantLicenseInfo, type LicenseInfoDTO } from "@/services/license.service"
import { getRestaurantProfile, getSelfOrderShareInfo } from "@/services/restaurant-settings.service"
import { getSystemSettings, type SystemSettingsDTO } from "@/services/system-setting.service"
import { getManagerById } from "@/services/user.service"

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await requireUserId()
  const [user, ctx, systemSettings] = await Promise.all([
    getManagerById(userId),
    getManagerContextOrNull(),
    getSystemSettings().catch(() => null),
  ])

  let share = null
  let licenseInfo: LicenseInfoDTO | null = null
  let brandColor: string | null = null

  if (ctx) {
    try {
      const [s, l, p] = await Promise.all([
        getSelfOrderShareInfo(ctx.restaurantId).catch(() => null),
        getRestaurantLicenseInfo(ctx.restaurantId).catch(() => null),
        getRestaurantProfile(ctx.restaurantId).catch(() => null),
      ])
      share = s
      licenseInfo = l
      brandColor = p?.brandColor ?? null
    } catch (e) {
      console.error("Failed to load restaurant context in layout:", e)
    }
  }

  return (
    <>
      {brandColor && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${brandColor} !important;
                --ring: ${brandColor} !important;
                --sidebar-primary: ${brandColor} !important;
                --sidebar-ring: ${brandColor} !important;
              }
              .dark {
                --primary: ${brandColor} !important;
                --ring: ${brandColor} !important;
                --sidebar-primary: ${brandColor} !important;
                --sidebar-ring: ${brandColor} !important;
              }
            `,
          }}
        />
      )}
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
          user={{
            name: user?.name ?? "Manager",
            contact: user?.phone ?? user?.email ?? "",
            role: user?.role,
          }}
          license={licenseInfo ? serializeForClient(licenseInfo) : null}
          systemSettings={systemSettings ? serializeForClient(systemSettings) : null}
        />
        <SidebarInset>
          <SiteHeader staffLoginUsername={share?.username ?? null} />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
