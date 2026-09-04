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
  let restaurantName = settings.systemName || "AdisyonEx";

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
      ]);

      if (restaurant?.name) {
        restaurantName = restaurant.name;
      }

      // Canlı Gerçek Hava Durumu (Open-Meteo)
      const weather = await getLiveWeather(
        restaurant?.branchAddress || restaurant?.addressLine1,
        restaurant?.city || restaurant?.branchName,
      );

      // Kategorize Edilmiş Gerçek Canlı Bildirimler (Öncelikli)
      const notifications: HomeNotificationItem[] = [];

      // 1. ÖNCELİKLİ: Garson Çağrıları ([GARSON_CAGIRILDI])
      const waiterCalls = urgentOrders.filter((o) => o.note?.includes("GARSON"));
      for (const o of waiterCalls) {
        const tableTxt = o.table?.label || o.tableLabel || `#${o.orderNumber}`;
        notifications.push({
          id: `waiter-${o.id}`,
          type: "table",
          title: `🛎️ Masa ${tableTxt} Garson Çağırıyor!`,
          description: "Müşteri servis personeli bekliyor. Lütfen masaya yönleniniz.",
          timeAgo: "Acil",
          targetUrl: "/dashboard/orders",
        });
      }

      // 2. ÖNCELİKLİ: Hesap İsteme Bildirimleri (billRequestedAt)
      const billRequests = urgentOrders.filter((o) => !!o.billRequestedAt);
      for (const o of billRequests) {
        const tableTxt = o.table?.label || o.tableLabel || `#${o.orderNumber}`;
        notifications.push({
          id: `bill-${o.id}`,
          type: "order",
          title: `💳 Masa ${tableTxt} Hesap İstiyor`,
          description: "Müşteri hesap/pos fişi talep etti, adisyon kapatmaya hazır.",
          timeAgo: "Hesap",
          targetUrl: "/dashboard/orders",
        });
      }

      // 3. ÖNCELİKLİ: Mutfaktan Yeni Çıkan Hazır Ürünler (PREPARED)
      for (const item of preparedItemsList) {
        const tableTxt =
          item.order?.table?.label || item.order?.tableLabel || `#${item.order?.orderNumber || ""}`;
        notifications.push({
          id: `prep-${item.id}`,
          type: "kitchen",
          title: `🍽️ ${item.name} Servise Hazır!`,
          description: `Masa ${tableTxt} için mutfaktan çıktı, masaya teslim ediniz.`,
          timeAgo: "Hazır",
          targetUrl: "/dashboard/kitchen",
        });
      }

      // 4. Genel Mutfak Hazırlık Özeti Bildirimleri
      if (waitingItems > 0 && notifications.length < 15) {
        notifications.push({
          id: "kitchen-waiting",
          type: "kitchen",
          title: `Mutfakta ${waitingItems} Ürün Hazırlanıyor`,
          description: "KOT fişleri mutfak kuyruğunda beklemede",
          timeAgo: "Canlı",
          targetUrl: "/dashboard/kitchen",
        });
      }

      // 5. Yeni Gelen Siparişler
      for (const o of recentOrders) {
        const diffMinutes = Math.max(
          1,
          Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000),
        );
        notifications.push({
          id: `order-${o.id}`,
          type: "order",
          title: o.table?.label
            ? `Masa ${o.table.label} Adisyonu Açıldı`
            : `Paket Sipariş #${o.orderNumber}`,
          description:
            o.orderType === "TAKEAWAY"
              ? "Paket servis siparişi işleme alındı"
              : o.orderType === "DELIVERY"
              ? "Online kurye teslimat adisyonu"
              : "Masa servisi devam ediyor",
          timeAgo: `${diffMinutes} dk önce`,
          targetUrl: "/dashboard/orders",
        });
      }

      // 6. Masa Bildirimleri
      for (const t of activeTablesList) {
        const orderTime = t.orders[0]?.createdAt;
        const diffMinutes = orderTime
          ? Math.max(1, Math.round((Date.now() - new Date(orderTime).getTime()) / 60000))
          : 5;
        notifications.push({
          id: `table-${t.id}`,
          type: "table",
          title: `Masa ${t.label} Dolu`,
          description: `Masa servisi aktif, adisyon işlem görüyor`,
          timeAgo: `${diffMinutes} dk önce`,
          targetUrl: "/dashboard/orders",
        });
      }

      // 7. Kritik Stok Uyarıları
      for (const item of stockItems) {
        if (Number(item.onHand) <= Number(item.reorderLevel)) {
          notifications.push({
            id: `stock-${item.id}`,
            type: "stock",
            title: `${item.name} Kritik Seviyede`,
            description: `Kalan: ${item.onHand} ${item.unit} (Kritik Eşik: ${item.reorderLevel})`,
            timeAgo: "Uyarı",
            targetUrl: "/dashboard/inventory",
          });
        }
      }

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
