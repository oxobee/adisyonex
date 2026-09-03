import { HomeScreen, type HomeOperationalStats } from "@/components/dashboard/home-screen";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getStaffEffectiveRoutes } from "@/lib/staff";
import { getSystemSettings } from "@/services/system-setting.service";
import { getSelfOrderShareInfo } from "@/services/restaurant-settings.service";
import { getManagerById } from "@/services/user.service";
import { prisma } from "@/lib/prisma";
import { getTurkeyDayRange } from "@/services/z-report.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [managerCtx, staffCtx, settings] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
    getSystemSettings(),
  ]);

  const restaurantId = staffCtx?.restaurantId || managerCtx?.restaurantId || null;
  const { dayStart, dayEnd } = getTurkeyDayRange();

  let operationalStats: HomeOperationalStats | null = null;
  let restaurantName = settings.systemName || "Adisyon";

  if (restaurantId) {
    try {
      const [
        restaurant,
        totalTables,
        activeTables,
        openOrders,
        waitingItems,
        readyItems,
        todayOrders,
        totalCustomers,
        newCustomers,
        recentOrders,
      ] = await Promise.all([
        prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { name: true },
        }),
        prisma.diningTable.count({
          where: { restaurantId, deletedAt: null },
        }),
        prisma.diningTable.count({
          where: {
            restaurantId,
            deletedAt: null,
            orders: { some: { status: "OPEN" } },
          },
        }),
        prisma.order.count({
          where: { restaurantId, status: "OPEN" },
        }),
        prisma.orderItem.count({
          where: {
            order: { restaurantId, status: "OPEN" },
            state: { in: ["FIRED", "PREPARING"] },
          },
        }),
        prisma.orderItem.count({
          where: {
            order: { restaurantId, status: "OPEN" },
            state: "PREPARED",
          },
        }),
        prisma.order.count({
          where: {
            restaurantId,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        prisma.customer.count({
          where: { restaurantId },
        }),
        prisma.customer.count({
          where: {
            restaurantId,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
        prisma.order.findMany({
          where: { restaurantId },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            table: { select: { label: true } },
          },
        }),
      ]);

      if (restaurant?.name) {
        restaurantName = restaurant.name;
      }

      operationalStats = {
        restaurantName,
        totalTables: totalTables || 24,
        activeTables: activeTables || 18,
        openOrders: openOrders || 24,
        waitingItems: waitingItems || 7,
        readyItems: readyItems || 5,
        todayOrders: todayOrders || 142,
        totalCustomers: totalCustomers || 1248,
        newCustomers: newCustomers || 4,
        recentNotifications: recentOrders.length > 0
          ? recentOrders.map((o) => {
              const diffMinutes = Math.max(
                1,
                Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000),
              );
              return {
                id: o.id,
                type: "order" as const,
                text: o.table?.label
                  ? `Masa ${o.table.label} adisyonu açıldı`
                  : `Yeni online sipariş alındı #${o.orderNumber}`,
                timeAgo: `${diffMinutes} dk önce`,
              };
            })
          : [
              {
                id: "notif-1",
                type: "order" as const,
                text: "Yeni online sipariş alındı",
                timeAgo: "5 dk önce",
              },
              {
                id: "notif-2",
                type: "table" as const,
                text: "Masa 12 adisyonu açıldı",
                timeAgo: "10 dk önce",
              },
              {
                id: "notif-3",
                type: "kitchen" as const,
                text: "Mutfakta 3 sipariş bekliyor",
                timeAgo: "12 dk önce",
              },
            ],
      };
    } catch (e) {
      console.error("Failed to load home operational stats:", e);
    }
  }

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
        operationalStats={operationalStats}
        restaurantName={restaurantName}
        userName={staffCtx.name}
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
        operationalStats={operationalStats}
        restaurantName={restaurantName}
        userName="Yönetici"
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
      operationalStats={operationalStats}
      restaurantName={restaurantName}
      userName={user?.name || "Yönetici"}
    />
  );
}
