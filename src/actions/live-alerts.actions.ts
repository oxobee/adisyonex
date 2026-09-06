"use server";

import { prisma } from "@/lib/prisma";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { success, failure, type ActionResult } from "@/types";

export interface LiveAlertDTO {
  readonly id: string;
  readonly type: "WAITER_CALL" | "BILL_REQUEST" | "NEW_ORDER" | "KITCHEN_READY" | "ADMIN_NOTIFICATION";
  readonly title: string;
  readonly message: string;
  readonly tableLabel?: string | null;
  readonly createdAt: string;
  readonly targetUrl: string;
  readonly buttonText?: string | null;
  readonly notifId?: string;
}

export async function getLatestLiveAlertsAction(): Promise<ActionResult<readonly LiveAlertDTO[]>> {
  try {
    const staff = await getStaffContextOrNull().catch(() => null);
    const manager = await getManagerContextOrNull().catch(() => null);
    const restaurantId = staff?.restaurantId || manager?.restaurantId;

    if (!restaurantId) {
      return success([]);
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const [urgentOrders, recentNewOrders, preparedItems, unreadAdminNotifs] = await Promise.all([
      // 1. Garson Çağrısı ve Hesap İsteme
      prisma.order.findMany({
        where: {
          restaurantId,
          status: "OPEN",
          deletedAt: null,
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
        take: 15,
        orderBy: { updatedAt: "desc" },
      }),

      // 2. Yeni Gelen Açık Siparişler (Son 10 dk içinde oluşturulanlar)
      prisma.order.findMany({
        where: {
          restaurantId,
          status: "OPEN",
          deletedAt: null,
          createdAt: { gte: tenMinutesAgo },
        },
        select: {
          id: true,
          orderNumber: true,
          tableLabel: true,
          createdAt: true,
          table: { select: { label: true } },
          _count: { select: { items: true } },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),

      // 3. Mutfakta Hazır Olan Ürünler (Servis bekleyenler)
      prisma.orderItem.findMany({
        where: {
          order: {
            restaurantId,
            status: "OPEN",
            deletedAt: null,
          },
          state: "PREPARED",
          createdAt: { gte: tenMinutesAgo },
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
        take: 10,
        orderBy: { createdAt: "desc" },
      }),

      // 4. Süper Admin'den Restorana Özel Gönderilen Bildirimler
      prisma.restaurantNotification.findMany({
        where: {
          restaurantId,
          isRead: false,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const alerts: LiveAlertDTO[] = [];

    // Süper Admin Bildirimleri
    for (const n of unreadAdminNotifs) {
      alerts.push({
        id: `admin-notif-${n.id}`,
        type: "ADMIN_NOTIFICATION",
        title: `📢 ${n.title}`,
        message: n.message,
        createdAt: n.createdAt.toISOString(),
        targetUrl: n.buttonUrl || "/dashboard/home",
        buttonText: n.buttonText || "İncele",
        notifId: n.id,
      });
    }

    // Garson Çağrıları
    for (const o of urgentOrders) {
      const label = o.table?.label || o.tableLabel || `#${o.orderNumber}`;
      if (o.note?.includes("GARSON")) {
        alerts.push({
          id: `waiter-${o.id}`,
          type: "WAITER_CALL",
          title: `🛎️ Masa ${label} Garson Çağırıyor!`,
          message: "Müşteri servis personeli bekliyor. Lütfen masaya yönleniniz.",
          tableLabel: label,
          createdAt: o.createdAt.toISOString(),
          targetUrl: "/dashboard/orders",
        });
      }
      if (o.billRequestedAt) {
        alerts.push({
          id: `bill-${o.id}`,
          type: "BILL_REQUEST",
          title: `💳 Masa ${label} Hesap İstiyor!`,
          message: "Müşteri hesap / POS fişi talep etti.",
          tableLabel: label,
          createdAt: o.createdAt.toISOString(),
          targetUrl: "/dashboard/orders",
        });
      }
    }

    // Yeni Gelen Siparişler (en az 1 ürünü olanlar)
    for (const o of recentNewOrders) {
      if (o._count.items > 0) {
        const label = o.table?.label || o.tableLabel || `#${o.orderNumber}`;
        alerts.push({
          id: `order-new-${o.id}`,
          type: "NEW_ORDER",
          title: `📦 Masa ${label} Yeni Sipariş!`,
          message: `${o._count.items} adet ürün siparişe eklendi.`,
          tableLabel: label,
          createdAt: o.createdAt.toISOString(),
          targetUrl: "/dashboard/orders",
        });
      }
    }

    // Hazır Tabaklar
    for (const item of preparedItems) {
      const label =
        item.order?.table?.label || item.order?.tableLabel || `#${item.order?.orderNumber || ""}`;
      alerts.push({
        id: `prep-${item.id}`,
        type: "KITCHEN_READY",
        title: `🍽️ ${item.name} Servise Hazır!`,
        message: `Masa ${label} için hazırlandı, teslim ediniz.`,
        tableLabel: label,
        createdAt: item.createdAt.toISOString(),
        targetUrl: "/dashboard/kitchen",
      });
    }

    return success(alerts);
  } catch (error) {
    console.error("Live Alerts Error:", error);
    return failure("Canlı bildirimler alınamadı");
  }
}

export async function markAdminNotificationReadAction(notificationId: string): Promise<ActionResult<void>> {
  try {
    await prisma.restaurantNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return success(undefined);
  } catch (e) {
    return failure("Bildirim güncellenemedi");
  }
}
