"use server";

import { z } from "zod";
import { withOperatorValidation, withStaffValidation } from "@/actions/helpers";
import { kitchenTicketSchema } from "@/lib/validators/order";
import {
  advanceTicket,
  markPickedUp,
  getReadyToServeItems,
  markItemsServed,
  type ReadyToServeItemDTO,
} from "@/services/kitchen.service";

/** Kitchen advances a whole ticket one step (start / mark ready). */
export const advanceTicketAction = withStaffValidation(
  kitchenTicketSchema,
  (data, ctx) => advanceTicket(ctx.restaurantId, data.orderId),
  { role: "KITCHEN" },
);

/** Waiter clears a ready ticket after collecting it from the pass. */
export const markPickedUpAction = withStaffValidation(
  kitchenTicketSchema,
  (data, ctx) => markPickedUp(ctx.restaurantId, data.orderId),
  { role: "WAITER" },
);

/**
 * Get all ready to serve items sorted by FIFO order priority.
 * Accessible by Waiter and Managers.
 */
export const getReadyToServeItemsAction = withOperatorValidation(
  z.object({}).optional(),
  async (_data, ctx) => getReadyToServeItems(ctx.restaurantId),
);

/**
 * Mark one or more items as SERVED when delivered to table.
 */
export const markItemsServedAction = withOperatorValidation(
  z.object({
    itemIds: z.array(z.string().min(1)).min(1),
  }),
  async (data, ctx) => markItemsServed(ctx.restaurantId, data.itemIds),
);

