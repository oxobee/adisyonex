import { HomeScreen } from "@/components/dashboard/home-screen";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getStaffEffectiveRoutes } from "@/lib/staff";
import { getSystemSettings } from "@/services/system-setting.service";
import { getSelfOrderShareInfo } from "@/services/restaurant-settings.service";
import { getManagerById } from "@/services/user.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [managerCtx, staffCtx, settings] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
    getSystemSettings(),
  ]);

  if (staffCtx) {
    const effectiveRoutes = getStaffEffectiveRoutes(
      staffCtx.role,
      staffCtx.allowedRoutes,
    );
    return (
      <HomeScreen
        settings={settings}
        isAdmin={false}
        isStaff={true}
        staffRole={staffCtx.role}
        allowedRoutes={effectiveRoutes}
        restaurantUsername={null}
      />
    );
  }

  if (!managerCtx) {
    return (
      <HomeScreen
        settings={settings}
        isAdmin={false}
        isStaff={false}
        allowedRoutes={null}
        restaurantUsername={null}
      />
    );
  }

  const [user, share] = await Promise.all([
    getManagerById(managerCtx.userId).catch(() => null),
    getSelfOrderShareInfo(managerCtx.restaurantId).catch(() => null),
  ]);

  return (
    <HomeScreen
      settings={settings}
      isAdmin={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"}
      isStaff={false}
      allowedRoutes={null}
      restaurantUsername={share?.username ?? null}
    />
  );
}
