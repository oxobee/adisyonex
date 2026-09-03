import type { SettleInput, SettleTableInput } from "@/lib/validators/order";
import { settleManyOrders, settleOrder } from "@/repositories/order.repository";
import { findActiveCustomerDiscount } from "@/repositories/customer.repository";
import { findRestaurantById } from "@/repositories/restaurant.repository";
import { clearTableDeviceLock } from "@/lib/table-device-lock";
import { computeBill } from "@/services/billing";
import {
  loadOwnedOrder,
  mapOrder,
  orderToBillLines,
  ORDER_NOT_OPEN,
  type OrderContext,
} from "@/services/order.service";
import type { OrderDTO } from "@/types/order";

export const PAYMENT_SHORT = "PAYMENT_SHORT";

const birthdayIsApproaching = (birthMonth: number | null, birthDay: number | null, daysBefore: number): boolean => {
  if (!birthMonth || !birthDay) return false;
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const birthday = new Date(Date.UTC(today.getUTCFullYear(), birthMonth - 1, birthDay));
  if (birthday.getTime() < start) birthday.setUTCFullYear(birthday.getUTCFullYear() + 1);
  return Math.floor((birthday.getTime() - start) / 86_400_000) <= daysBefore;
};

const resolveAutomaticDiscount = async (ctx: OrderContext, order: Awaited<ReturnType<typeof loadOwnedOrder>>) => {
  if (!order.customerId) return null;
  const [discount, restaurant] = await Promise.all([
    findActiveCustomerDiscount(order.customerId, new Date()),
    findRestaurantById(ctx.restaurantId),
  ]);
  if (discount) return { type: discount.type, value: Number(discount.value), reason: "Müşteri indirimi" } as const;
  if (restaurant?.birthdayAutomationEnabled && birthdayIsApproaching(order.customer?.birthMonth ?? null, order.customer?.birthDay ?? null, restaurant.birthdayDaysBefore)) {
    return { type: restaurant.birthdayDiscountType, value: Number(restaurant.birthdayDiscountValue), reason: "Doğum günü indirimi" } as const;
  }
  return null;
};

/** Compute the bill (with discount/comp), verify tender covers it, then settle. */
export const settle = async (
  ctx: OrderContext,
  input: SettleInput,
): Promise<OrderDTO> => {
  const order = await loadOwnedOrder(ctx.restaurantId, input.orderId);
  if (order.status !== "OPEN") {
    throw new Error(ORDER_NOT_OPEN);
  }

  const automaticDiscount = await resolveAutomaticDiscount(ctx, order);
  const effectiveDiscount = automaticDiscount ?? { type: input.discountType, value: input.discountValue, reason: input.discountReason ?? null };
  const bill = computeBill(orderToBillLines(order), effectiveDiscount);

  const paid = input.payments.reduce((sum, p) => sum + p.amount, 0);
  if (paid + 0.5 < bill.grandTotal) {
    throw new Error(PAYMENT_SHORT);
  }

  const settled = await settleOrder(input.orderId, ctx.restaurantId, {
    subtotal: bill.subtotal,
    taxTotal: bill.taxTotal,
    discountType: effectiveDiscount.type,
    discountValue: effectiveDiscount.value,
    discountReason: effectiveDiscount.reason,
    discountTotal: bill.discountTotal,
    compTotal: bill.compTotal,
    roundOff: bill.roundOff,
    grandTotal: bill.grandTotal,
    payments: input.payments.map((p) => ({
      mode: p.mode,
      amount: p.amount,
      tendered: p.tendered ?? null,
      reference: p.reference ?? null,
      receivedById: ctx.userId,
    })),
  });
  if (order.tableId) {
    await clearTableDeviceLock(order.tableId).catch(() => undefined);
  }
  return mapOrder(settled);
};

const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

interface PaymentPart {
  readonly mode: "CASH" | "UPI" | "CARD" | "OTHER";
  readonly amount: number;
  readonly reference: string | null;
}

/**
 * Waterfall-allocate a table's combined payments across its orders: fill each
 * order's grand total from the payment pool in turn, slicing a payment when it
 * spans an order boundary. Every returned order is fully covered and the
 * payment modes are preserved in aggregate.
 */
export const allocatePayments = (
  orders: readonly { orderId: string; grandTotal: number }[],
  payments: readonly PaymentPart[],
): Map<string, PaymentPart[]> => {
  const pool = payments.map((p) => ({ ...p, left: round2(p.amount) }));
  const result = new Map<string, PaymentPart[]>();
  for (const order of orders) {
    let need = round2(order.grandTotal);
    const slices: PaymentPart[] = [];
    for (const part of pool) {
      if (need <= 0.005) {
        break;
      }
      if (part.left <= 0.005) {
        continue;
      }
      const take = round2(Math.min(need, part.left));
      slices.push({ mode: part.mode, amount: take, reference: part.reference });
      part.left = round2(part.left - take);
      need = round2(need - take);
    }
    result.set(order.orderId, slices);
  }
  return result;
};

/** Settle every open order of a table with one combined (split) payment. */
export const settleTable = async (
  ctx: OrderContext,
  input: SettleTableInput,
): Promise<OrderDTO[]> => {
  const orders = await Promise.all(
    input.orderIds.map((id) => loadOwnedOrder(ctx.restaurantId, id)),
  );
  for (const order of orders) {
    if (order.status !== "OPEN") {
      throw new Error(ORDER_NOT_OPEN);
    }
  }

  const bills = await Promise.all(orders.map(async (order) => {
    const automaticDiscount = await resolveAutomaticDiscount(ctx, order);
    return {
      order,
      automaticDiscount,
      bill: computeBill(orderToBillLines(order), automaticDiscount ?? { type: "NONE", value: 0 }),
    };
  }));
  const combined = round2(bills.reduce((s, b) => s + b.bill.grandTotal, 0));
  const paid = round2(input.payments.reduce((s, p) => s + p.amount, 0));
  if (paid + 0.5 < combined) {
    throw new Error(PAYMENT_SHORT);
  }

  const allocation = allocatePayments(
    bills.map((b) => ({ orderId: b.order.id, grandTotal: b.bill.grandTotal })),
    input.payments.map((p) => ({
      mode: p.mode,
      amount: p.amount,
      reference: p.reference ?? null,
    })),
  );

  const settlements = bills.map((b) => ({
    orderId: b.order.id,
    data: {
      subtotal: b.bill.subtotal,
      taxTotal: b.bill.taxTotal,
      discountType: b.automaticDiscount?.type ?? "NONE",
      discountValue: b.automaticDiscount?.value ?? 0,
      discountReason: b.automaticDiscount?.reason ?? null,
      discountTotal: b.bill.discountTotal,
      compTotal: b.bill.compTotal,
      roundOff: b.bill.roundOff,
      grandTotal: b.bill.grandTotal,
      payments: (allocation.get(b.order.id) ?? []).map((s) => ({
        mode: s.mode,
        amount: s.amount,
        tendered: null,
        reference: s.reference,
        receivedById: ctx.userId,
      })),
    },
  }));

  const settled = await settleManyOrders(ctx.restaurantId, settlements);
  for (const ord of orders) {
    if (ord.tableId) {
      await clearTableDeviceLock(ord.tableId).catch(() => undefined);
    }
  }
  return settled.map(mapOrder);
};
