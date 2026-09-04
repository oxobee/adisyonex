import { DashboardHeaderNav } from "@/components/dashboard-header-nav"
import { SiteHeader } from "@/components/site-header"
import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/auth-helpers"
import { getManagerContextOrNull } from "@/lib/manager-auth"
import { serializeForClient } from "@/lib/utils"
import { getRestaurantLicenseInfo, type LicenseInfoDTO } from "@/services/license.service"
import { getRestaurantProfile, getSelfOrderShareInfo } from "@/services/restaurant-settings.service"
import { getStaffContextOrNull } from "@/lib/staff-auth"
import { getSystemSettings, type SystemSettingsDTO } from "@/services/system-setting.service"
import { getManagerById } from "@/services/user.service"

import { LicenseExpiredModal } from "@/components/license/license-expired-modal"
import { GlobalEscNavigation } from "@/components/dashboard/global-esc-navigation"
import { OfflineSyncManager } from "@/components/shared/offline-sync-manager"

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const staffCtx = await getStaffContextOrNull().catch(() => null);
  const userId = await getCurrentUserId();

  if (!staffCtx && !userId) {
    redirect("/login");
  }

  const [user, ctx, systemSettings] = await Promise.all([
    userId ? getManagerById(userId).catch(() => null) : null,
    getManagerContextOrNull(),
    getSystemSettings().catch(() => null),
  ])

  let share = null
  let licenseInfo: LicenseInfoDTO | null = null
  let brandColor: string | null = null

  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;

  if (restaurantId) {
    try {
      const [s, l, p] = await Promise.all([
        getSelfOrderShareInfo(restaurantId).catch(() => null),
        getRestaurantLicenseInfo(restaurantId).catch(() => null),
        getRestaurantProfile(restaurantId).catch(() => null),
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
      <GlobalEscNavigation />
      <OfflineSyncManager />
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

      {staffCtx ? (
        /* Staff Mode: Full width with dedicated staff header (Name + Ekranı Kilitle) */
        <div className="flex min-h-screen w-full flex-col bg-background">
          <SiteHeader
            isStaff={true}
            staffContext={{
              name: staffCtx.name,
              role: staffCtx.role,
              employeeCode: staffCtx.employeeCode,
              allowedRoutes: staffCtx.allowedRoutes,
            }}
            restaurantUsername={share?.username ?? null}
          />
          <main className="flex-1 w-full">{children}</main>

          {/* License Expired Blur Overlay Modal */}
          {licenseInfo && licenseInfo.isExpired && (
            <LicenseExpiredModal
              licenseInfo={serializeForClient(licenseInfo)}
              isStaff={true}
            />
          )}
        </div>
      ) : (
        /* Manager / Admin Mode: Sleek Top Header Navigation Bar without side menu */
        <div className="flex min-h-screen w-full flex-col bg-background">
          <DashboardHeaderNav
            user={{
              name: user?.name || "Manager",
              contact: user?.phone || user?.email || "",
              role: user?.role,
            }}
            license={licenseInfo ? serializeForClient(licenseInfo) : null}
            systemSettings={systemSettings ? serializeForClient(systemSettings) : null}
            restaurantUsername={share?.username ?? null}
          />
          <main className="flex-1 w-full">{children}</main>

          {/* License Expired Blur Overlay Modal */}
          {licenseInfo && licenseInfo.isExpired && (
            <LicenseExpiredModal
              licenseInfo={serializeForClient(licenseInfo)}
              isStaff={false}
            />
          )}
        </div>
      )}
    </>
  )
}
