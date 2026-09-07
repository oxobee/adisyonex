import { HomeScreen, type HomeOperationalStats } from "@/components/dashboard/home-screen";
import type { HomeNotificationItem } from "@/components/dashboard/home-notifications-modal";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getStaffEffectiveRoutes } from "@/lib/staff";
import { getSystemSettings } from "@/services/system-setting.service";
import { getSelfOrderShareInfo } from "@/services/restaurant-settings.service";
import { getManagerById } from "@/services/user.service";
import { getLiveWeather } from "@/services/weather.service";
import { prisma } from "@/lib/prisma";
import { getTurkeyDayRange } from "@/services/z-report.service";
import { getReadyToServeItems } from "@/services/kitchen.service";

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
  let restaurantName = settings.systemName || "Oxonom POS";

  if (restaurantId) {
    try {
      const [
        restaurant,
        totalTables,
        activeTables,
        openOrders,
        takeawayOrders,
        waitingItems,
        readyItems,
        todayOrders,
        totalCustomers,
        newCustomers,
        recentOrders,
        activeTablesList,
        stockItems,
        urgentOrders,
        preparedItemsList,
        readyToServeItemsList,
      ] = await Promise.all([
        prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: {
            name: true,
            branchName: true,
            branchAddress: true,
            addressLine1: true,
            city: true,
            screenLockPin: true,
          },
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
        prisma.order.count({
          where: {
            restaurantId,
            status: "OPEN",
            orderType: { in: ["TAKEAWAY", "DELIVERY"] },
          },
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
          take: 6,
          select: {
            id: true,
            orderNumber: true,
            orderType: true,
            createdAt: true,
            table: { select: { label: true } },
          },
        }),
        prisma.diningTable.findMany({
          where: {
            restaurantId,
            deletedAt: null,
            orders: { some: { status: "OPEN" } },
          },
          take: 3,
          select: {
            id: true,
            label: true,
            orders: {
              where: { status: "OPEN" },
              select: { id: true, createdAt: true },
              take: 1,
            },
          },
        }),
        prisma.stockItem.findMany({
          where: {
            restaurantId,
            deletedAt: null,
            reorderLevel: { not: null },
          },
          select: {
            id: true,
            name: true,
            onHand: true,
            reorderLevel: true,
            unit: true,
          },
          take: 5,
        }),
        // Acil Garson Çağrısı ve Hesap İsteme Sorgusu
        prisma.order.findMany({
          where: {
            restaurantId,
            status: "OPEN",
            OR: [
              { note: { contains: "GARSON" } },
              { billRequestedAt: { not: null } },
            ],
          },
          select: {
            id: true,
            orderNumber: true,
            tableLabel: true,
            note: true,
            billRequestedAt: true,
            createdAt: true,
            table: { select: { label: true } },
          },
          take: 8,
        }),
        // Mutfakta Hazır Olan Ürünler
        prisma.orderItem.findMany({
          where: {
            order: { restaurantId, status: "OPEN" },
            state: "PREPARED",
          },
          select: {
            id: true,
            name: true,
            createdAt: true,
            order: {
              select: {
                id: true,
                orderNumber: true,
                tableLabel: true,
                table: { select: { label: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        getReadyToServeItems(restaurantId).catch(() => []),
      ]);

      if (restaurant?.name) {
        restaurantName = restaurant.name;
      }

      // Canlı Gerçek Hava Durumu (Open-Meteo)
      const weather = await getLiveWeather(
        restaurant?.branchAddress || restaurant?.addressLine1,
        restaurant?.city || restaurant?.branchName,
      );

      // Yalnızca Süper Admin tarafından gönderilen Sistem Bildirimleri
      const dbNotifications = await prisma.restaurantNotification.findMany({
        where: { restaurantId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const notifications: HomeNotificationItem[] = dbNotifications.map((n) => {
        const diffMinutes = Math.max(
          1,
          Math.round((Date.now() - new Date(n.createdAt).getTime()) / 60000),
        );
        let timeAgo = `${diffMinutes} dk önce`;
        if (diffMinutes >= 1440) {
          timeAgo = `${Math.floor(diffMinutes / 1440)} gün önce`;
        } else if (diffMinutes >= 60) {
          timeAgo = `${Math.floor(diffMinutes / 60)} sa önce`;
        }

        return {
          id: n.id,
          type: "system",
          title: n.title,
          description: n.message,
          message: n.message,
          timeAgo,
          targetUrl: n.buttonUrl || "/dashboard/home",
          buttonText: n.buttonText,
          buttonUrl: n.buttonUrl,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          readAt: n.readAt ? n.readAt.toISOString() : null,
        };
      });

      operationalStats = {
        restaurantName,
        branchName: restaurant?.branchName ?? null,
        branchAddress: restaurant?.branchAddress ?? null,
        screenLockPin: restaurant?.screenLockPin || "0000",
        totalTables: totalTables || 24,
        activeTables: activeTables || 0,
        openOrders: openOrders || 0,
        takeawayOrders: takeawayOrders || 0,
        waitingItems: waitingItems || 0,
        readyItems: readyItems || 0,
        todayOrders: todayOrders || 0,
        totalCustomers: totalCustomers || 0,
        newCustomers: newCustomers || 0,
        weather,
        notifications,
        readyToServeItems: readyToServeItemsList || [],
      };
    } catch (e) {
      console.error("Failed to load home operational stats:", e);
    }
  }

  if (staffCtx) {
    const [staffRecord] = await Promise.all([
      prisma.staff
        .findUnique({
          where: { id: staffCtx.staffId },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
            state: true,
            photoUrl: true,
          },
        })
        .catch(() => null),
    ]);
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
        userName={staffRecord?.name || staffCtx.name}
        userId={staffCtx.staffId}
        userPhone={staffRecord?.phone ?? null}
        userEmail={staffRecord?.email ?? null}
        userCity={staffRecord?.city ?? null}
        userState={staffRecord?.state ?? null}
        userPhotoUrl={staffRecord?.photoUrl ?? null}
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
      userId={managerCtx.userId}
      userPhone={user?.phone ?? null}
      userEmail={user?.email ?? null}
      userCity={null}
      userState={null}
      userPhotoUrl={null}
    />
  );
}
