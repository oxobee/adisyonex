"use server";

import { withOperatorValidation } from "@/actions/helpers";
import { quickCashierSaleSchema } from "@/lib/validators/order";
import { createOrder, type OrderContext } from "@/services/order.service";
import { settle } from "@/services/settlement.service";

export const quickCashierSaleAction = withOperatorValidation(
  quickCashierSaleSchema,
  async (data, ctx) => {
    const orderCtx: OrderContext = {
      restaurantId: ctx.restaurantId,
      userId: ctx.userId ?? null,
      staffId: ctx.staffId ?? null,
    };

    // 1. Create order
    const order = await createOrder(orderCtx, {
      idempotencyKey: data.idempotencyKey,
      orderType: data.orderType,
      tableId: data.tableId,
      tableLabel: data.tableLabel,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      note: data.note,
      items: data.items,
    });

    // 2. Immediately settle and close order
    const settled = await settle(orderCtx, {
      orderId: order.id,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountReason: data.discountReason,
      payments: data.payments,
    });

    const paidAmount = data.payments.reduce((s, p) => s + p.amount, 0);
    const tenderedAmount = data.payments.reduce((s, p) => s + (p.tendered ?? p.amount), 0);
    const changeAmount = Math.max(0, tenderedAmount - settled.grandTotal);

    return {
      order: settled,
      orderId: settled.id,
      orderNumber: settled.orderNumber,
      grandTotal: settled.grandTotal,
      paidAmount,
      tenderedAmount,
      changeAmount,
      invoiceUrl: `/dashboard/orders/${settled.id}/invoice`,
      kotUrl: `/dashboard/orders/${settled.id}/kot`,
    };
  },
);
