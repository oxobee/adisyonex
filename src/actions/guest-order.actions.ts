"use server";

import { withValidation } from "@/actions/helpers";
import {
  createGuestSession,
  destroyGuestSession,
  getGuestSession,
} from "@/lib/guest-session";
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
    return placeGuestOrder(
      {
        restaurantId: target.restaurantId,
        tableId: target.tableId,
        phone: session?.phone ?? "",
      },
      data,
    );
  },
);

import { z } from "zod";
import { requestBillForTable } from "@/services/guest-order.service";

/** The guest's table orders with live kitchen & bill status. */
export const guestMyOrdersAction = async (targetParam?: {
  username: string;
  tableId: string;
}): Promise<ActionResult<GuestOrderSummaryDTO[]>> => {
  try {
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
    return { success: true };
  },
);

/** Log the guest out by clearing their session cookie. */
export const guestLogoutAction = async (): Promise<void> => {
  await destroyGuestSession();
};
