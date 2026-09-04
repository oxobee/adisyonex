"use server";

import { withValidation } from "@/actions/helpers";
import {
  createGuestSession,
  destroyGuestSession,
  getGuestSession,
} from "@/lib/guest-session";
import { getOrCreateDeviceId } from "@/lib/table-device-lock";
import {
  guestPlaceOrderSchema,
  guestRequestOtpSchema,
  guestVerifyOtpSchema,
} from "@/lib/validators/guest-order";
import {
  getGuestOrders,
  placeGuestOrder,
  resolveGuestOrderTarget,
} from "@/services/guest-order.service";
import { requestGuestOtp, verifyGuestOtp } from "@/services/guest-otp.service";
import { failure, success, type ActionResult } from "@/types";
import type { GuestOrderSummaryDTO, OrderDTO } from "@/types/order";
import { recordActivityLog } from "@/services/activity-log.service";

const GUEST_NOT_VERIFIED = "GUEST_NOT_VERIFIED";

/** Send a verification code to the guest, after checking the table is valid. */
export const guestRequestOtpAction = withValidation(
  guestRequestOtpSchema,
  async (data): Promise<void> => {
    await resolveGuestOrderTarget(data.username, data.tableId);
    await requestGuestOtp(data.phone);
  },
);

/** Verify the code and open a table-scoped guest session (once per seating). */
export const guestVerifyOtpAction = withValidation(
  guestVerifyOtpSchema,
  async (data): Promise<void> => {
    const target = await resolveGuestOrderTarget(data.username, data.tableId);
    await verifyGuestOtp(data.phone, data.code);
    await createGuestSession({
      restaurantId: target.restaurantId,
      tableId: target.tableId,
      phone: data.phone,
    });
  },
);

/** Place the order — directly creates table order (optionally attaches phone if verified). */
export const guestPlaceOrderAction = withValidation(
  guestPlaceOrderSchema,
  async (data): Promise<OrderDTO> => {
    const target = await resolveGuestOrderTarget(data.username, data.tableId);
    const session = await getGuestSession();
    const deviceId = await getOrCreateDeviceId();
    const order = await placeGuestOrder(
      {
        restaurantId: target.restaurantId,
        tableId: target.tableId,
        phone: session?.phone ?? "",
        deviceId,
        tableSessionId: data.tableSessionId,
      },
      data,
    );

    recordActivityLog({
      restaurantId: target.restaurantId,
      actorName: session?.phone ? `Müşteri (${session.phone})` : `Masa Misafiri (${target.tableLabel})`,
      actorRole: "MÜŞTERİ",
      category: "SİPARİŞ",
      action: "Yeni QR Siparişi Verildi",
      details: `${target.tableLabel} masasında ${data.items.length} çeşit ürün sipariş edildi.`,
    }).catch(() => {});

    return order;
  },
);

import { z } from "zod";
import {
  requestBillForTable,
  callWaiterForTable,
  dismissWaiterCall,
} from "@/services/guest-order.service";
import { prisma } from "@/lib/prisma";

export interface TableSessionStatusResult {
  readonly isClosed: boolean;
  readonly isActive: boolean;
  readonly tableLabel: string;
}

/** Check if the current table session is still active or has been closed by the cashier/admin. */
export const checkGuestTableSessionAction = async (data: {
  username: string;
  tableId: string;
  tableSessionId?: string | null;
}): Promise<ActionResult<TableSessionStatusResult>> => {
  try {
    const target = await resolveGuestOrderTarget(data.username, data.tableId);
    if (!target) {
      return success({ isClosed: true, isActive: false, tableLabel: "Masa" });
    }

    if (data.tableSessionId) {
      const session = await prisma.tableSession.findUnique({
        where: { id: data.tableSessionId },
        select: { status: true, tableId: true },
      });

      if (!session || session.status === "CLOSED" || session.tableId !== target.tableId) {
        return success({
          isClosed: true,
          isActive: false,
          tableLabel: target.tableLabel,
        });
      }

      return success({
        isClosed: false,
        isActive: true,
        tableLabel: target.tableLabel,
      });
    }

    // Fallback if no tableSessionId: check if table is empty / available
    const activeSession = await prisma.tableSession.findFirst({
      where: {
        restaurantId: target.restaurantId,
        tableId: target.tableId,
        status: "ACTIVE",
      },
    });
    const openOrder = await prisma.order.findFirst({
      where: {
        restaurantId: target.restaurantId,
        tableId: target.tableId,
        status: "OPEN",
        deletedAt: null,
      },
    });

    const isAvailable = !activeSession && !openOrder;
    return success({
      isClosed: isAvailable,
      isActive: !isAvailable,
      tableLabel: target.tableLabel,
    });
  } catch {
    return failure("Masa durumu doğrulanamadı.");
  }
};

/** The guest's table orders with live kitchen & bill status. */
export const guestMyOrdersAction = async (targetParam?: {
  username: string;
  tableId: string;
  tableSessionId?: string | null;
}): Promise<ActionResult<GuestOrderSummaryDTO[]>> => {
  try {
    if (targetParam?.tableSessionId) {
      const sess = await prisma.tableSession.findUnique({
        where: { id: targetParam.tableSessionId },
        select: { status: true },
      });
      if (sess && sess.status === "CLOSED") {
        return failure<GuestOrderSummaryDTO[]>("TABLE_SESSION_EXPIRED");
      }
    }

    const session = await getGuestSession();
    if (session) {
      return success(
        await getGuestOrders(
          session.restaurantId,
          session.phone,
          session.tableId,
        ),
      );
    }
    if (targetParam?.username && targetParam?.tableId) {
      const target = await resolveGuestOrderTarget(
        targetParam.username,
        targetParam.tableId,
      );
      return success(
        await getGuestOrders(target.restaurantId, "", target.tableId),
      );
    }
    return failure<GuestOrderSummaryDTO[]>(GUEST_NOT_VERIFIED);
  } catch (error) {
    return failure<GuestOrderSummaryDTO[]>(
      error instanceof Error ? error.message : "Something went wrong",
    );
  }
};

/** Request the bill for the table from the QR menu. */
export const guestRequestBillAction = withValidation(
  z.object({
    username: z.string().min(1),
    tableId: z.string().min(1),
  }),
  async (data) => {
    const target = await resolveGuestOrderTarget(data.username, data.tableId);
    await requestBillForTable(target.restaurantId, target.tableId);
    recordActivityLog({
      restaurantId: target.restaurantId,
      actorName: `Misafir (${target.tableLabel})`,
      actorRole: "MÜŞTERİ",
      category: "MASA",
      action: "Hesap İstendi",
      details: `${target.tableLabel} masası hesap istedi.`,
    }).catch(() => {});
    return { success: true };
  },
);

/** Call a waiter for the table from the QR menu. */
export const guestCallWaiterAction = withValidation(
  z.object({
    username: z.string().min(1),
    tableId: z.string().min(1),
  }),
  async (data) => {
    const target = await resolveGuestOrderTarget(data.username, data.tableId);
    await callWaiterForTable(target.restaurantId, target.tableId, target.tableLabel);
    recordActivityLog({
      restaurantId: target.restaurantId,
      actorName: `Misafir (${target.tableLabel})`,
      actorRole: "MÜŞTERİ",
      category: "MASA",
      action: "Garson Çağrıldı",
      details: `${target.tableLabel} masası garson çağırdı.`,
    }).catch(() => {});
    return { success: true };
  },
);

/** Dismiss a waiter call alert for an order. */
export const dismissWaiterCallAction = async (
  data: { orderId: string },
): Promise<ActionResult<{ success: boolean }>> => {
  try {
    const res = await dismissWaiterCall(data.orderId);
    return success(res);
  } catch (error) {
    return failure<{ success: boolean }>(
      error instanceof Error ? error.message : "Çağrı kapatılamadı",
    );
  }
};

/** Log the guest out by clearing their session cookie. */
export const guestLogoutAction = async (): Promise<void> => {
  await destroyGuestSession();
};
