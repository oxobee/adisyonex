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
  readonly tableSessionId?: string | null;
}

/**
 * Validates or initializes an authoritative server-side TableSession.
 *
 * Rules:
 * 1. If table has an ACTIVE TableSession:
 *    - If deviceId matches -> allow entry (same customer returning).
 *    - If deviceId differs -> locked! Show table occupied warning.
 * 2. If table has NO active TableSession and NO open orders:
 *    - Table is AVAILABLE (fresh customer).
 *    - Atomically generate a brand new ACTIVE TableSession.
 *    - Bind deviceId to this session.
 */
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

  // 1. Check for an active server-side TableSession
  const activeSession = await prisma.tableSession.findFirst({
    where: {
      restaurantId,
      tableId,
      status: "ACTIVE",
    },
    orderBy: { startedAt: "desc" },
  });

  // 2. Check for an active OPEN order on this table
  const openOrder = await prisma.order.findFirst({
    where: {
      restaurantId,
      tableId,
      status: "OPEN",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  // CASE 1: ACTIVE SESSION EXISTS
  if (activeSession) {
    if (!activeSession.deviceId) {
      // Unclaimed session (e.g. opened from POS), claim for this device
      await prisma.tableSession.update({
        where: { id: activeSession.id },
        data: { deviceId },
      });
      if (openOrder && !openOrder.placedById) {
        await prisma.order.update({
          where: { id: openOrder.id },
          data: { placedById: deviceId, tableSessionId: activeSession.id },
        });
      }
      return {
        isLocked: false,
        activeDeviceId: deviceId,
        tableLabel,
        tableSessionId: activeSession.id,
      };
    }

    if (activeSession.deviceId === deviceId) {
      // Same device is returning/refreshing
      if (openOrder && !openOrder.tableSessionId) {
        await prisma.order.update({
          where: { id: openOrder.id },
          data: { tableSessionId: activeSession.id },
        });
      }
      return {
        isLocked: false,
        activeDeviceId: deviceId,
        tableLabel,
        tableSessionId: activeSession.id,
      };
    }

    // Different device: LOCKED!
    return {
      isLocked: true,
      activeDeviceId: activeSession.deviceId,
      tableLabel,
      tableSessionId: activeSession.id,
    };
  }

  // CASE 2: NO ACTIVE SESSION, BUT OPEN ORDER EXISTS (e.g. Waiter opened tab on POS)
  if (openOrder) {
    const boundDeviceId = openOrder.placedById || deviceId;
    const newSession = await prisma.tableSession.create({
      data: {
        restaurantId,
        tableId,
        deviceId: boundDeviceId,
        status: "ACTIVE",
        startedAt: openOrder.createdAt || new Date(),
      },
    });

    await prisma.order.update({
      where: { id: openOrder.id },
      data: {
        tableSessionId: newSession.id,
        placedById: boundDeviceId,
      },
    });

    if (openOrder.placedById && openOrder.placedById !== deviceId) {
      return {
        isLocked: true,
        activeDeviceId: openOrder.placedById,
        tableLabel,
        tableSessionId: newSession.id,
      };
    }

    return {
      isLocked: false,
      activeDeviceId: deviceId,
      tableLabel,
      tableSessionId: newSession.id,
    };
  }

  // CASE 3: TABLE IS AVAILABLE & EMPTY -> CREATE NEW ACTIVE SESSION
  // Clean up any stale legacy otpChallenge entries
  const sessionKey = `tbl_lock_${tableId}`;
  await prisma.otpChallenge.deleteMany({
    where: { phone: sessionKey },
  }).catch(() => undefined);

  const freshSession = await prisma.tableSession.create({
    data: {
      restaurantId,
      tableId,
      deviceId,
      status: "ACTIVE",
      startedAt: new Date(),
    },
  });

  return {
    isLocked: false,
    activeDeviceId: deviceId,
    tableLabel,
    tableSessionId: freshSession.id,
  };
}

/**
 * Atomically marks all active table sessions as CLOSED and clears table locks.
 * Called when cashier settles bill, cancels order, or resets table.
 */
export async function clearTableDeviceLock(tableId: string): Promise<void> {
  const now = new Date();
  await Promise.all([
    // 1. Close all active TableSessions for this table
    prisma.tableSession.updateMany({
      where: {
        tableId,
        status: "ACTIVE",
      },
      data: {
        status: "CLOSED",
        closedAt: now,
      },
    }),
    // 2. Clear legacy locks
    prisma.otpChallenge.deleteMany({
      where: { phone: `tbl_lock_${tableId}` },
    }),
    // 3. Clear table bill request state
    prisma.diningTable.update({
      where: { id: tableId },
      data: { billRequestedAt: null },
    }).catch(() => undefined),
  ]);
}

/**
 * Verifies if a specific table session is currently ACTIVE.
 */
export async function isTableSessionActive(tableSessionId: string): Promise<boolean> {
  if (!tableSessionId) return false;
  const session = await prisma.tableSession.findUnique({
    where: { id: tableSessionId },
    select: { status: true },
  });
  return session?.status === "ACTIVE";
}
