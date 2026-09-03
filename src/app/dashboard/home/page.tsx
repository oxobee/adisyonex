import { HomeScreen } from "@/components/dashboard/home-screen";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getSystemSettings } from "@/services/system-setting.service";
import { getSelfOrderShareInfo } from "@/services/restaurant-settings.service";
import { getManagerById } from "@/services/user.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ctx = await getManagerContextOrNull();
  const settings = await getSystemSettings();
  if (!ctx) {
    return <HomeScreen settings={settings} isAdmin={false} restaurantUsername={null} />;
  }
  const [user, share] = await Promise.all([
    getManagerById(ctx.userId).catch(() => null),
    getSelfOrderShareInfo(ctx.restaurantId).catch(() => null),
  ]);
  return <HomeScreen settings={settings} isAdmin={user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"} restaurantUsername={share?.username ?? null} />;
}
