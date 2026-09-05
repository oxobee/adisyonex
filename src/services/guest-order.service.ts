import type { GuestPlaceOrderInput } from "@/lib/validators/guest-order";
import { prisma } from "@/lib/prisma";
import { deriveKitchenStatus } from "@/lib/kitchen";
import { checkTableDeviceLock, type TableLockCheckResult } from "@/lib/table-device-lock";
import {
  findOrdersForGuest,
  createOrder as createOrderRepo,
  maxOrderNumber,
  type OrderWithRelations,
} from "@/repositories/order.repository";
import { findRestaurantByUsername } from "@/repositories/restaurant.repository";
import { findTablesByRestaurant } from "@/repositories/table.repository";
import { computeBill } from "@/services/billing";
import { getMenu } from "@/services/menu-item.service";
import {
  addItems,
  createOrder,
  fireOrder,
  listOrders,
  type OrderContext,
} from "@/services/order.service";
import { resolveTableForOrder } from "@/services/table.service";
import type { MenuDTO } from "@/types/menu";
import type { GuestOrderSummaryDTO, OrderDTO } from "@/types/order";

export const GUEST_ORDER_RESTAURANT_NOT_FOUND = "GUEST_ORDER_RESTAURANT_NOT_FOUND";
export const GUEST_ORDER_DISABLED = "GUEST_ORDER_DISABLED";
export const GUEST_ORDER_TABLE_INVALID = "GUEST_ORDER_TABLE_INVALID";

export interface GuestOrderTarget {
  readonly restaurantId: string;
  readonly tableId: string;
  readonly tableLabel: string;
}

/**
 * Validate that a restaurant (by username) has self-ordering enabled and that
 * the table belongs to it. Shared by the OTP + place-order guest actions.
 */
export const resolveGuestOrderTarget = async (
  username: string,
  tableId: string,
): Promise<GuestOrderTarget> => {
  const restaurant = await findRestaurantByUsername(username);
  if (!restaurant || restaurant.deletedAt || !restaurant.isActive) {
    throw new Error(GUEST_ORDER_RESTAURANT_NOT_FOUND);
  }
  if (!restaurant.selfOrderEnabled) {
    throw new Error(GUEST_ORDER_DISABLED);
  }
  let table: { id: string; label: string };
  try {
    table = await resolveTableForOrder(restaurant.id, tableId);
  } catch {
    throw new Error(GUEST_ORDER_TABLE_INVALID);
  }
  return {
    restaurantId: restaurant.id,
    tableId: table.id,
    tableLabel: table.label,
  };
};

export interface GuestOrderActor {
  readonly restaurantId: string;
  readonly tableId: string;
  readonly phone: string;
  readonly deviceId?: string;
  readonly tableSessionId?: string | null;
}

/**
 * Place a verified guest's dine-in order. If the table already has an open
 * order, append the items and fire them as an add-on batch; otherwise create a
 * new open order. Lines are tagged `SELF_ORDER`. No staff-accept gate (v1).
 */
export const placeGuestOrder = async (
  actor: GuestOrderActor,
  input: GuestPlaceOrderInput,
): Promise<OrderDTO> => {
  // Authoritative server-side TableSession validation
  if (actor.tableSessionId) {
    const session = await prisma.tableSession.findUnique({
      where: { id: actor.tableSessionId },
      select: { status: true, tableId: true },
    });
    if (!session || session.status !== "ACTIVE" || session.tableId !== actor.tableId) {
      throw new Error("TABLE_SESSION_EXPIRED");
    }
  }

  const ctx: OrderContext = {
    restaurantId: actor.restaurantId,
    userId: actor.deviceId ?? null,
    staffId: null,
    source: "SELF_ORDER",
  };

  const open = await listOrders(actor.restaurantId, ["OPEN"]);
  const existing = open.find((o) => o.tableId === actor.tableId);
  if (existing) {
    const updateData: { placedById?: string; tableSessionId?: string } = {};
    if (actor.deviceId && !existing.placedById) {
      updateData.placedById = actor.deviceId;
    }
    if (actor.tableSessionId && !existing.tableSessionId) {
      updateData.tableSessionId = actor.tableSessionId;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.order.update({
        where: { id: existing.id },
        data: updateData,
      });
    }
    await addItems(ctx, { orderId: existing.id, items: input.items });
    return fireOrder(ctx, existing.id);
  }

  const created = await createOrder(ctx, {
    orderType: "DINE_IN",
    tableId: actor.tableId,
    idempotencyKey: input.idempotencyKey,
    customerPhone: actor.phone,
    customerId: input.customerId ?? undefined,
    note: input.note,
    items: input.items,
  });

  if (actor.tableSessionId) {
    await prisma.order.update({
      where: { id: created.id },
      data: { tableSessionId: actor.tableSessionId },
    }).catch(() => undefined);
  }

  return created;
};

export interface GuestOrderPageData {
  readonly restaurantId: string;
  readonly restaurantName: string;
  readonly logoUrl: string | null;
  readonly username: string;
  readonly tableId: string;
  readonly tableLabel: string;
  readonly tableSessionId?: string | null;
  readonly menu: MenuDTO;
  readonly showItemImages?: boolean | null;
  readonly qrMenuTheme?: string | null;
  readonly qrPrimaryColor?: string | null;
  readonly qrSecondaryColor?: string | null;
  readonly qrSlidersEnabled?: boolean | null;
  readonly qrAiEnabled?: boolean | null;
  readonly qrSliders?: readonly object[] | null;
  readonly qrGreetingTitle?: string | null;
  readonly qrGreetingSubtitle?: string | null;
  readonly qrHomeSections?: readonly object[] | null;
  readonly wifiSsid?: string | null;
  readonly wifiPassword?: string | null;
}

export interface EmptyTableDTO {
  readonly id: string;
  readonly label: string;
  readonly section: string | null;
  readonly seats: number | null;
}

export type GuestOrderPageResult =
  | { readonly status: "ok"; readonly data: GuestOrderPageData }
  | { readonly status: "not_found" }
  | { readonly status: "disabled"; readonly restaurantName: string }
  | { readonly status: "invalid_table"; readonly restaurantName: string }
  | {
      readonly status: "table_occupied";
      readonly restaurantName: string;
      readonly logoUrl: string | null;
      readonly tableLabel: string;
      readonly username: string;
      readonly primaryColor: string;
      readonly emptyTables: readonly EmptyTableDTO[];
    };

/**
 * Load everything the public `/order/[username]` page needs, returning a
 * discriminated status instead of throwing so the page can render friendly
 * fallbacks (disabled / invalid table) without redirecting.
 */
export const loadGuestOrderPage = async (
  username: string,
  tableId: string | undefined,
  deviceId?: string,
): Promise<GuestOrderPageResult> => {
  const restaurant = await findRestaurantByUsername(username);
  if (!restaurant || restaurant.deletedAt || !restaurant.isActive) {
    return { status: "not_found" };
  }
  if (!restaurant.selfOrderEnabled) {
    return { status: "disabled", restaurantName: restaurant.name };
  }
  if (!tableId) {
    return { status: "invalid_table", restaurantName: restaurant.name };
  }
  let table: { id: string; label: string };
  if (tableId === "preview") {
    const allTables = await findTablesByRestaurant(restaurant.id);
    const firstTable = allTables.find((t) => t.isActive) || allTables[0];
    if (firstTable) {
      table = { id: firstTable.id, label: firstTable.label };
    } else {
      table = { id: "preview-table", label: "Masa 1" };
    }
  } else {
    try {
      table = await resolveTableForOrder(restaurant.id, tableId);
    } catch {
      return { status: "invalid_table", restaurantName: restaurant.name };
    }
  }

  // Device Lock Check: If the table is active and occupied by another device
  let lockCheck: TableLockCheckResult | null = null;
  if (tableId !== "preview" && deviceId) {
    lockCheck = await checkTableDeviceLock(
      restaurant.id,
      table.id,
      deviceId,
    );
    if (lockCheck.isLocked) {
      const openOrders = await listOrders(restaurant.id, ["OPEN"]);
      const occupiedTableIds = new Set(
        openOrders.map((o) => o.tableId).filter(Boolean),
      );
      const allTables = await findTablesByRestaurant(restaurant.id);
      const emptyTables: EmptyTableDTO[] = allTables
        .filter((t) => t.isActive && !t.deletedAt && !occupiedTableIds.has(t.id))
        .map((t) => ({
          id: t.id,
          label: t.label,
          section: t.section,
          seats: t.seats,
        }));

      return {
        status: "table_occupied",
        restaurantName: restaurant.name,
        logoUrl: restaurant.logoUrl,
        tableLabel: lockCheck.tableLabel || table.label,
        username: restaurant.username ?? username,
        primaryColor: restaurant.qrPrimaryColor || "#FF5500",
        emptyTables,
      };
    }
  }

  // If customer opens the table QR link, ensure the table is marked as active/occupied in the system
  if (tableId !== "preview") {
    try {
      const existingOpen = await prisma.order.findFirst({
        where: {
          restaurantId: restaurant.id,
          tableId: table.id,
          status: "OPEN",
          deletedAt: null,
        },
      });
      if (!existingOpen) {
        const orderNum = (await maxOrderNumber(restaurant.id)) + 1;
        await createOrderRepo({
          restaurantId: restaurant.id,
          orderNumber: orderNum,
          idempotencyKey: `table-session-init-${table.id}-${Date.now()}`,
          orderType: "DINE_IN",
          tableId: table.id,
          tableLabel: table.label,
          tableSessionId: lockCheck?.tableSessionId || undefined,
          customerName: null,
          customerPhone: null,
          customerAddress: null,
          placedById: deviceId || null,
          placedByStaffId: null,
          items: [],
          note: "📱 Müşteri QR menüyü açtı (Masa Oturumu)",
        });
      } else if (lockCheck?.tableSessionId && !existingOpen.tableSessionId) {
        await prisma.order.update({
          where: { id: existingOpen.id },
          data: {
            tableSessionId: lockCheck.tableSessionId,
            placedById: existingOpen.placedById || deviceId || null,
          },
        }).catch(() => undefined);
      }
    } catch (e) {
      console.error("Failed to initialize table session on QR open:", e);
    }
  }

  const menu = await getMenu(restaurant.id);
  return {
    status: "ok",
    data: {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      logoUrl: restaurant.logoUrl,
      username: restaurant.username ?? username,
      tableId: table.id,
      tableLabel: table.label,
      tableSessionId: lockCheck?.tableSessionId || null,
      menu,
      showItemImages: restaurant.showItemImages ?? true,
      qrMenuTheme: restaurant.qrMenuTheme || "MODERN",
      qrPrimaryColor: restaurant.qrPrimaryColor || "#FF5500",
      qrSecondaryColor: restaurant.qrSecondaryColor || "#FFF7ED",
      qrSlidersEnabled: restaurant.qrSlidersEnabled ?? true,
      qrAiEnabled: restaurant.qrAiEnabled ?? true,
      qrSliders: (restaurant.qrSliders as readonly object[]) ?? null,
      qrGreetingTitle: restaurant.qrGreetingTitle || "Bugün Ne Yemek İstersiniz?",
      qrGreetingSubtitle: restaurant.qrGreetingSubtitle || "Hoş Geldiniz 👋",
      qrHomeSections: (restaurant.qrHomeSections as readonly object[]) ?? null,
      wifiSsid: restaurant.wifiSsid ?? null,
      wifiPassword: restaurant.wifiPassword ?? null,
    },
  };
};

const GUEST_ORDER_LIMIT = 15;

const num = (v: unknown): number => Number(v);

const toGuestSummary = (o: OrderWithRelations): GuestOrderSummaryDTO => {
  const active = o.items.filter((i) => i.state !== "VOID");
  const total =
    o.status === "COMPLETED"
      ? num(o.grandTotal)
      : computeBill(
          active.map((i) => ({
            unitPrice: num(i.unitPrice),
            modifiersDelta: i.modifiers.reduce(
              (s, m) => s + num(m.priceDelta),
              0,
            ),
            quantity: i.quantity,
            taxRate: num(i.taxRate),
            taxInclusive: i.taxInclusive,
            isComp: i.isComp,
          })),
        ).grandTotal;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    orderType: o.orderType,
    tableLabel: o.tableLabel,
    status: o.status,
    kitchenStatus: deriveKitchenStatus(active.map((i) => i.state)),
    billRequestedAt: o.billRequestedAt ? o.billRequestedAt.toISOString() : null,
    itemCount: active.reduce((s, i) => s + i.quantity, 0),
    total,
    lines: active.map((i) => ({
      name: i.name,
      variantName: i.variantName,
      quantity: i.quantity,
      state: i.state,
    })),
  };
};

/**
 * A verified guest's own orders (by phone) plus any order on their current
 * table, most recent first — as a PII-free summary with live kitchen status.
 */
export const getGuestOrders = async (
  restaurantId: string,
  phone: string,
  tableId: string,
): Promise<GuestOrderSummaryDTO[]> => {
  const orders = await findOrdersForGuest(
    restaurantId,
    phone,
    tableId,
    GUEST_ORDER_LIMIT,
  );
  return orders
    .map(toGuestSummary)
    .filter((o) => o.lines.length > 0);
};

export const requestBillForTable = async (
  restaurantId: string,
  tableId: string,
): Promise<{ success: boolean }> => {
  const now = new Date();

  // Set billRequestedAt on all open orders for this table
  await prisma.order.updateMany({
    where: {
      restaurantId,
      tableId,
      status: "OPEN",
      deletedAt: null,
    },
    data: {
      billRequestedAt: now,
    },
  });

  // Also stamp on the dining table record
  await prisma.diningTable.updateMany({
    where: {
      id: tableId,
      restaurantId,
    },
    data: {
      billRequestedAt: now,
    },
  });

  return { success: true };
};

export const callWaiterForTable = async (
  restaurantId: string,
  tableId: string,
  tableLabel?: string,
): Promise<{ success: boolean }> => {
  const existing = await prisma.order.findFirst({
    where: {
      restaurantId,
      tableId,
      status: "OPEN",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const waiterTag = "[GARSON_CAGIRILDI]";

  if (existing) {
    const currentNote = existing.note || "";
    if (!currentNote.includes(waiterTag)) {
      const updatedNote = currentNote
        ? `${waiterTag} ${currentNote}`
        : `${waiterTag} Müşteri masaya servis personeli çağırdı.`;
      await prisma.order.update({
        where: { id: existing.id },
        data: { note: updatedNote },
      });
    }
  } else {
    // Create an initial open order for the table to signal the waiter call
    const maxOrder = await prisma.order.aggregate({
      where: { restaurantId },
      _max: { orderNumber: true },
    });
    const orderNumber = (maxOrder._max.orderNumber ?? 0) + 1;

    await prisma.order.create({
      data: {
        restaurantId,
        orderNumber,
        idempotencyKey: `waiter_call_${tableId}_${Date.now()}`,
        orderType: "DINE_IN",
        tableId,
        tableLabel: tableLabel || null,
        note: `${waiterTag} Müşteri masaya servis personeli çağırdı.`,
        items: { create: [] },
      },
    });
  }

  return { success: true };
};

export const dismissWaiterCall = async (
  orderId: string,
): Promise<{ success: boolean }> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { success: false };

  // If the order has no items (created only to signal waiter call), void it
  if (order.items.length === 0) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "VOID", voidReason: "Garson çağrısı tamamlandı" },
    });
    return { success: true };
  }

  // Otherwise, strip the waiter tag from note
  const updatedNote = (order.note || "")
    .replace("[GARSON_CAGIRILDI]", "")
    .replace("GARSON_CAGIRILDI", "")
    .replace("[GARSON ÇAĞIRILDI]", "")
    .trim();

  await prisma.order.update({
    where: { id: orderId },
    data: { note: updatedNote || null },
  });

  return { success: true };
};
