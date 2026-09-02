import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const DEVICE_COOKIE_NAME = "adisyoon_device_id";

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const store = await cookies();
    let id = store.get(DEVICE_COOKIE_NAME)?.value;
    if (!id) {
      id = randomUUID();
      try {
        store.set(DEVICE_COOKIE_NAME, id, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: false, // accessible to client JS as well
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      } catch {
        // Read-only cookies context
      }
    }
    return id;
  } catch {
    return randomUUID();
  }
}

export interface TableLockCheckResult {
  readonly isLocked: boolean;
  readonly activeDeviceId: string | null;
  readonly tableLabel: string;
}

export async function checkTableDeviceLock(
  restaurantId: string,
  tableId: string,
  deviceId: string,
): Promise<TableLockCheckResult> {
  // Find open order for this table
  const openOrder = await prisma.order.findFirst({
    where: {
      restaurantId,
      tableId,
      status: "OPEN",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!openOrder) {
    return { isLocked: false, activeDeviceId: null, tableLabel: "" };
  }

  // If order has no bound device, bind it to current device
  if (!openOrder.placedById) {
    await prisma.order.update({
      where: { id: openOrder.id },
      data: { placedById: deviceId },
    });
    return {
      isLocked: false,
      activeDeviceId: deviceId,
      tableLabel: openOrder.tableLabel || "",
    };
  }

  // If order is bound to another device, it's locked!
  if (openOrder.placedById !== deviceId) {
    return {
      isLocked: true,
      activeDeviceId: openOrder.placedById,
      tableLabel: openOrder.tableLabel || "",
    };
  }

  // Current device is the owner
  return {
    isLocked: false,
    activeDeviceId: deviceId,
    tableLabel: openOrder.tableLabel || "",
  };
}
