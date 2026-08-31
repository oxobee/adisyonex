"use server";

import { z } from "zod";
import { withManagerValidation } from "@/actions/helpers";
import { idSchema } from "@/lib/validators/shared";
import {
  addItemsSchema,
  createOrderSchema,
  fireOrderSchema,
  serveLineSchema,
  settleSchema,
  settleTableSchema,
  voidLineSchema,
  voidOrderSchema,
} from "@/lib/validators/order";
import {
  addItems,
  createOrder,
  fireOrder,
  loadOwnedOrder,
  serveLine,
  voidLine,
  voidWholeOrder,
} from "@/services/order.service";
import { advanceLineStates, findOrdersByRestaurant } from "@/repositories/order.repository";
import { settle, settleTable } from "@/services/settlement.service";

export const createOrderAction = withManagerValidation(
  createOrderSchema,
  (data, ctx) => createOrder(ctx, data),
);

export const addItemsAction = withManagerValidation(addItemsSchema, (data, ctx) =>
  addItems(ctx, data),
);

export const fireOrderAction = withManagerValidation(
  fireOrderSchema,
  (data, ctx) => fireOrder(ctx, data.orderId),
);

export const serveLineAction = withManagerValidation(
  serveLineSchema,
  (data, ctx) => serveLine(ctx, data),
);

export const voidLineAction = withManagerValidation(voidLineSchema, (data, ctx) =>
  voidLine(ctx, data),
);

export const voidOrderAction = withManagerValidation(
  voidOrderSchema,
  (data, ctx) => voidWholeOrder(ctx, data),
);

export const settleOrderAction = withManagerValidation(settleSchema, (data, ctx) =>
  settle(ctx, data),
);

export const settleTableAction = withManagerValidation(
  settleTableSchema,
  (data, ctx) => settleTable(ctx, data),
);

export const advanceOrderStateAction = withManagerValidation(
  z.object({
    orderId: idSchema,
    fromState: z.enum(["UNSENT", "FIRED", "PREPARING", "PREPARED", "SERVED", "VOID"]),
    toState: z.enum(["UNSENT", "FIRED", "PREPARING", "PREPARED", "SERVED", "VOID"]),
  }),
  async (data, ctx) => {
    await loadOwnedOrder(ctx.restaurantId, data.orderId);
    await advanceLineStates(data.orderId, data.fromState, data.toState);
  },
);

import { prisma } from "@/lib/prisma";

export const deliverTableOrdersAction = withManagerValidation(
  z.object({
    tableId: idSchema,
  }),
  async (data, ctx) => {
    const orders = await findOrdersByRestaurant(ctx.restaurantId, ["OPEN"]);
    const tableOrders = orders.filter((o) => o.tableId === data.tableId);
    
    for (const ord of tableOrders) {
      const activeItems = ord.items.filter((i) => i.state !== "SERVED" && i.state !== "VOID");
      const unservedCooked = activeItems.filter((i) => i.itemType !== "PACKAGED_GOODS");
      const unservedPackaged = activeItems.filter((i) => i.itemType === "PACKAGED_GOODS");
      
      const hasCookingFood = unservedCooked.some(
        (i) => i.state === "FIRED" || i.state === "UNSENT" || i.state === "PREPARING"
      );
      
      if (hasCookingFood && unservedPackaged.length > 0) {
        // Mixed order: Deliver packaged items first, keep cooked food preparing in kitchen
        const packagedIds = unservedPackaged.map((i) => i.id);
        await prisma.orderItem.updateMany({
          where: { id: { in: packagedIds } },
          data: { state: "SERVED" },
        });
      } else {
        // Only cooked food ready (or only packaged items, or everything ready): Deliver all ready items
        const deliverableIds = activeItems
          .filter((i) => i.itemType === "PACKAGED_GOODS" || i.state === "PREPARED" || !hasCookingFood)
          .map((i) => i.id);
        if (deliverableIds.length > 0) {
          await prisma.orderItem.updateMany({
            where: { id: { in: deliverableIds } },
            data: { state: "SERVED" },
          });
        }
      }
    }
  },
);
