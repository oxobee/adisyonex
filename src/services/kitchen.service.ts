import {
  KITCHEN_ACTIVE_STATES,
  deriveKitchenStatus,
  kitchenAdvanceLabel,
} from "@/lib/kitchen";
import {
  advanceLineStates,
  findOrdersByRestaurant,
  type OrderWithRelations,
} from "@/repositories/order.repository";
import { ORDER_NOT_OPEN, loadOwnedOrder } from "@/services/order.service";
import { prisma } from "@/lib/prisma";
import type {
  KitchenTicketBatch,
  KitchenTicketDTO,
  KitchenTicketLine,
} from "@/types/kitchen";

type TicketItem = OrderWithRelations["items"][number];

const isActive = (state: string): boolean =>
  (KITCHEN_ACTIVE_STATES as readonly string[]).includes(state);

const mapLine = (item: TicketItem): KitchenTicketLine => ({
  id: item.id,
  name: item.name,
  variantName: item.variantName,
  quantity: item.quantity,
  lineNote: item.lineNote,
  modifiers: item.modifiers.map((m) => m.name),
  state: item.state as KitchenTicketLine["state"],
});

const toTicket = (order: OrderWithRelations): KitchenTicketDTO | null => {
  const active = order.items.filter((i) => isActive(i.state) || i.state === "UNSENT");
  if (active.length === 0) {
    return null;
  }

  // Group active lines by their exact firing time. The earliest batch is the
  // original ticket; anything fired later is an add-on.
  const byBatch = new Map<string, TicketItem[]>();
  for (const line of active) {
    const key = line.firedAt
      ? line.firedAt.toISOString()
      : (line.createdAt ? line.createdAt.toISOString() : "");
    const bucket = byBatch.get(key) ?? [];
    bucket.push(line);
    byBatch.set(key, bucket);
  }
  const keys = [...byBatch.keys()].sort();
  const batches: KitchenTicketBatch[] = keys.map((key, idx) => ({
    firedAt: key || null,
    isAddOn: idx > 0,
    isSelfOrder: (byBatch.get(key) ?? []).some(
      (l) => l.source === "SELF_ORDER",
    ),
    lines: (byBatch.get(key) ?? []).map(mapLine),
  }));

  const states = active.map((i) => i.state);
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    tableLabel: order.tableLabel,
    status: deriveKitchenStatus(states) ?? "READY",
    firstFiredAt: keys[0] || null,
    batches,
    advanceLabel: kitchenAdvanceLabel(states),
  };
};

/** Every OPEN order with at least one active kitchen line, oldest-fired first. */
export const listKitchenTickets = async (
  restaurantId: string,
): Promise<KitchenTicketDTO[]> => {
  // Self-healing: Auto-fire any stranded UNSENT lines in active orders so kitchen never misses them
  await prisma.orderItem.updateMany({
    where: {
      order: {
        restaurantId,
        status: "OPEN",
      },
      state: "UNSENT",
    },
    data: {
      state: "FIRED",
      firedAt: new Date(),
    },
  }).catch((err) => {
    console.error("Failed to auto-fire UNSENT items in kitchen tickets:", err);
  });

  const orders = await findOrdersByRestaurant(restaurantId, ["OPEN"]);
  return orders
    .map(toTicket)
    .filter((t): t is KitchenTicketDTO => t !== null)
    .sort((a, b) => (a.firstFiredAt ?? "").localeCompare(b.firstFiredAt ?? ""));
};

/**
 * Advance a whole ticket one step: FIRED lines start preparing, otherwise
 * PREPARING lines are marked ready. No-op once everything is prepared.
 */
export const advanceTicket = async (
  restaurantId: string,
  orderId: string,
): Promise<void> => {
  const order = await loadOwnedOrder(restaurantId, orderId);
  if (order.status !== "OPEN") {
    throw new Error(ORDER_NOT_OPEN);
  }
  if (order.items.some((i) => i.state === "UNSENT")) {
    await advanceLineStates(orderId, "UNSENT", "PREPARING");
  }
  const hasFired = order.items.some((i) => i.state === "FIRED");
  await advanceLineStates(
    orderId,
    hasFired ? "FIRED" : "PREPARING",
    hasFired ? "PREPARING" : "PREPARED",
  );
};

/** Waiter clears a ready ticket by marking its prepared lines served. */
export const markPickedUp = async (
  restaurantId: string,
  orderId: string,
): Promise<void> => {
  const order = await loadOwnedOrder(restaurantId, orderId);
  if (order.status !== "OPEN") {
    throw new Error(ORDER_NOT_OPEN);
  }
  await advanceLineStates(orderId, "PREPARED", "SERVED");
};

export interface ReadyToServeItemDTO {
  id: string;
  orderId: string;
  orderNumber: number;
  orderType: string;
  tableId: string | null;
  tableLabel: string;
  name: string;
  variantName: string | null;
  quantity: number;
  lineNote: string | null;
  modifiers: string[];
  firedAt: string | null;
  createdAt: string;
  elapsedMinutes: number;
  priorityOrder: number;
}

/**
 * Lists all dishes currently in PREPARED state (ready for pickup from the pass).
 * Sorted strictly by FIFO priority (oldest fired/created first) so waiters see exact processing priority.
 */
export const getReadyToServeItems = async (
  restaurantId: string,
): Promise<ReadyToServeItemDTO[]> => {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        restaurantId,
        status: "OPEN",
        deletedAt: null,
      },
      state: "PREPARED",
    },
    select: {
      id: true,
      orderId: true,
      name: true,
      variantName: true,
      quantity: true,
      lineNote: true,
      firedAt: true,
      createdAt: true,
      modifiers: {
        select: {
          name: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          orderType: true,
          tableId: true,
          tableLabel: true,
          createdAt: true,
          table: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      },
    },
    orderBy: [
      { firedAt: "asc" },
      { createdAt: "asc" },
    ],
  });

  const now = Date.now();
  return items.map((item, index) => {
    const timeToUse = item.firedAt
      ? new Date(item.firedAt).getTime()
      : new Date(item.createdAt).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((now - timeToUse) / 60000));
    const tableLabel =
      item.order.table?.label || item.order.tableLabel || `#${item.order.orderNumber}`;

    return {
      id: item.id,
      orderId: item.orderId,
      orderNumber: item.order.orderNumber,
      orderType: item.order.orderType,
      tableId: item.order.tableId,
      tableLabel,
      name: item.name,
      variantName: item.variantName,
      quantity: item.quantity,
      lineNote: item.lineNote,
      modifiers: item.modifiers.map((m) => m.name),
      firedAt: item.firedAt ? item.firedAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      elapsedMinutes,
      priorityOrder: index + 1,
    };
  });
};

/**
 * Marks individual or multiple items as SERVED when delivered by the waiter.
 */
export const markItemsServed = async (
  restaurantId: string,
  itemIds: string[],
): Promise<number> => {
  if (!itemIds || itemIds.length === 0) return 0;

  const result = await prisma.orderItem.updateMany({
    where: {
      id: { in: itemIds },
      order: {
        restaurantId,
        status: "OPEN",
        deletedAt: null,
      },
      state: "PREPARED",
    },
    data: {
      state: "SERVED",
    },
  });

  return result.count;
};

