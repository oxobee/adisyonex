"use server";

import { withOperatorValidation } from "@/actions/helpers";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
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

    // Check if we are settling an existing open order (e.g. from an occupied table)
    let targetOrderId = data.orderId;
    if (!targetOrderId && data.tableId) {
      const openOrder = await prisma.order.findFirst({
        where: {
          restaurantId: ctx.restaurantId,
          tableId: data.tableId,
          status: "OPEN",
        },
        select: { id: true },
      });
      if (openOrder) {
        targetOrderId = openOrder.id;
      }
    }

    if (targetOrderId) {
      // Settle the existing open order
      const settled = await settle(orderCtx, {
        orderId: targetOrderId,
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
    }
 
    const effectiveOrderChannel = data.callSessionId
      ? "phone"
      : (data.orderChannel || "pos");
    const effectiveOrderChannelProvider = data.orderChannelProvider || null;

    let customerId = data.customerId;
    if (!customerId && data.customerPhone) {
      const normPhone = normalizePhoneNumber(data.customerPhone) || data.customerPhone;
      try {
        const existingCust = await prisma.customer.findFirst({
          where: {
            restaurantId: ctx.restaurantId,
            phone: normPhone,
          },
        });
        if (existingCust) {
          customerId = existingCust.id;
          if (!existingCust.firstOrderChannel) {
            await prisma.customer.update({
              where: { id: existingCust.id },
              data: { firstOrderChannel: effectiveOrderChannel },
            });
          }
        } else if (data.customerName) {
          const newCust = await prisma.customer.create({
            data: {
              restaurantId: ctx.restaurantId,
              phone: normPhone,
              name: data.customerName,
              customerSource: effectiveOrderChannel,
              customerSourceProvider: effectiveOrderChannelProvider,
              firstOrderChannel: effectiveOrderChannel,
              ...(data.customerAddress
                ? {
                    addresses: {
                      create: {
                        restaurantId: ctx.restaurantId,
                        title: "Kayıtlı Adres",
                        address: data.customerAddress,
                        isDefault: true,
                      },
                    },
                  }
                : {}),
            },
          });
          customerId = newCust.id;
        }
      } catch (err) {
        console.error("Failed to resolve customer for cashier order:", err);
      }
    }

    // 1. Create order
    const order = await createOrder(orderCtx, {
      idempotencyKey: data.idempotencyKey,
      orderType: data.orderType,
      tableId: data.tableId,
      tableLabel: data.tableLabel,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      customerId,
      orderChannel: effectiveOrderChannel,
      orderChannelProvider: effectiveOrderChannelProvider,
      note: data.note,
      items: data.items,
    });

    // Link and update CallSession if order came from Caller ID / Phone Order
    if (data.callSessionId) {
      try {
        await prisma.callSession.update({
          where: { id: data.callSessionId },
          data: {
            orderId: order.id,
            status: "ANSWERED",
            ...(customerId ? { customerId } : {}),
            answeredAt: new Date(),
          },
        });
      } catch (err) {
        console.error("Failed to link callSession to order:", err);
      }
    }

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
