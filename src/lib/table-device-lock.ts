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
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
          httpOnly: false,
        });
      } catch {
        // Ignored in read-only render contexts
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
  const table = await prisma.diningTable.findUnique({
    where: { id: tableId },
    select: { label: true },
  });
  const tableLabel = table?.label || "Masa";

  // 1. Check if there is an active OPEN order on this table
  const openOrder = await prisma.order.findFirst({
    where: {
      restaurantId,
      tableId,
      status: "OPEN",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (openOrder) {
    // If order has no bound device, bind it to current device
    if (!openOrder.placedById) {
      await prisma.order.update({
        where: { id: openOrder.id },
        data: { placedById: deviceId },
      });
      return {
        isLocked: false,
        activeDeviceId: deviceId,
        tableLabel: openOrder.tableLabel || tableLabel,
      };
    }

    // If order is bound to another device, it is LOCKED
    if (openOrder.placedById !== deviceId) {
      return {
        isLocked: true,
        activeDeviceId: openOrder.placedById,
        tableLabel: openOrder.tableLabel || tableLabel,
      };
    }

    return {
      isLocked: false,
      activeDeviceId: deviceId,
      tableLabel: openOrder.tableLabel || tableLabel,
    };
  }

  // 2. Check active table session claim (when customer sits and opens menu before ordering)
  const sessionKey = `tbl_lock_${tableId}`;
  const now = new Date();
  const existingClaim = await prisma.otpChallenge.findFirst({
    where: { phone: sessionKey },
  });

  if (existingClaim) {
    if (existingClaim.expiresAt > now) {
      // Session is active
      if (existingClaim.codeHash !== deviceId) {
        return {
          isLocked: true,
          activeDeviceId: existingClaim.codeHash,
          tableLabel,
        };
      }
      // Same device: refresh session for 90 minutes
      await prisma.otpChallenge.update({
        where: { id: existingClaim.id },
        data: { expiresAt: new Date(Date.now() + 90 * 60 * 1000) },
      });
      return {
        isLocked: false,
        activeDeviceId: deviceId,
        tableLabel,
      };
    }
  }

  // No active claim or expired: current device claims this table
  const twoHoursLater = new Date(Date.now() + 90 * 60 * 1000);
  if (existingClaim) {
    await prisma.otpChallenge.update({
      where: { id: existingClaim.id },
      data: {
        codeHash: deviceId,
        expiresAt: twoHoursLater,
        attempts: 0,
      },
    });
  } else {
    await prisma.otpChallenge.create({
      data: {
        phone: sessionKey,
        codeHash: deviceId,
        expiresAt: twoHoursLater,
        attempts: 0,
      },
    });
  }

  return {
    isLocked: false,
    activeDeviceId: deviceId,
    tableLabel,
  };
}

/** Clear table device lock when table bill is settled or order is voided. */
export async function clearTableDeviceLock(tableId: string): Promise<void> {
  const sessionKey = `tbl_lock_${tableId}`;
  await prisma.otpChallenge.deleteMany({
    where: { phone: sessionKey },
  });
}
