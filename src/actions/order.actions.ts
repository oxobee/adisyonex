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
import { success, failure, type ActionResult } from "@/types";
import { logActivity } from "@/services/activity-log.service";

export const createOrderAction = withManagerValidation(
  createOrderSchema,
  async (data, ctx) => {
    const order = await createOrder(ctx, data);
    const tableInfo = data.tableLabel ? `Masa '${data.tableLabel}'` : (data.orderType === "TAKEAWAY" ? "Gel-Al" : "Paket");
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "SİPARİŞ",
      action: "Yeni Sipariş Açıldı",
      details: `${tableInfo} için yeni sipariş oluşturuldu. (${data.items?.length || 0} kalem ürün)`,
    });
    return order;
  },
);

export const addItemsAction = withManagerValidation(addItemsSchema, async (data, ctx) => {
  const res = await addItems(ctx, data);
  await fireOrder(ctx, data.orderId).catch(() => undefined);
  await logActivity({
    restaurantId: ctx.restaurantId,
    category: "SİPARİŞ",
    action: "Siparişe Ürün Eklendi",
    details: `Siparişe ${data.items?.length || 0} yeni ürün kalemi eklendi ve mutfağa iletildi.`,
  });
  return res;
});

export const fireOrderAction = withManagerValidation(
  fireOrderSchema,
  async (data, ctx) => {
    const res = await fireOrder(ctx, data.orderId);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "SİPARİŞ",
      action: "Sipariş Mutfağa İletildi",
      details: `Sipariş mutfak ekranına (KDS) düşürüldü.`,
    });
    return res;
  },
);

export const serveLineAction = withManagerValidation(
  serveLineSchema,
  async (data, ctx) => {
    const res = await serveLine(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "SİPARİŞ",
      action: "Ürün Masaya Servis Edildi",
      details: `Sipariş kalemi servis edildi olarak işaretlendi.`,
    });
    return res;
  },
);

export const voidLineAction = withManagerValidation(voidLineSchema, async (data, ctx) => {
  const res = await voidLine(ctx, data);
  await logActivity({
    restaurantId: ctx.restaurantId,
    category: "SİPARİŞ",
    action: "Ürün Kalemi İptal Edildi (Void)",
    details: `Gerekçe: "${data.reason}"`,
  });
  return res;
});

export const voidOrderAction = withManagerValidation(
  voidOrderSchema,
  async (data, ctx) => {
    const res = await voidWholeOrder(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "SİPARİŞ",
      action: "Tüm Sipariş İptal Edildi (Adisyon İptali)",
      details: `Gerekçe: "${data.reason}"`,
    });
    return res;
  },
);

export const settleOrderAction = withManagerValidation(settleSchema, async (data, ctx) => {
  const res = await settle(ctx, data);
  const paymentModes = data.payments.map((p) => `${p.mode}: ₺${p.amount}`).join(", ");
  await logActivity({
    restaurantId: ctx.restaurantId,
    category: "KASA",
    action: "Hesap Tahsil Edildi",
    details: `Tahsilat tamamlandı. Ödemeler: ${paymentModes}`,
  });
  return res;
});

export const settleTableAction = withManagerValidation(
  settleTableSchema,
  async (data, ctx) => {
    const res = await settleTable(ctx, data);
    const paymentModes = data.payments.map((p) => `${p.mode}: ₺${p.amount}`).join(", ");
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "KASA",
      action: "Masa Hesabı Kapatıldı",
      details: `Masa hesabı kapatıldı. Ödemeler: ${paymentModes}`,
    });
    return res;
  },
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

/** Deliver specific order lines (e.g. selected packaged goods). */
export const deliverOrderLinesAction = async (data: {
  lineIds: string[];
}): Promise<ActionResult<{ success: boolean; count: number }>> => {
  try {
    if (!data.lineIds || data.lineIds.length === 0) {
      return success({ success: true, count: 0 });
    }
    const res = await prisma.orderItem.updateMany({
      where: { id: { in: data.lineIds } },
      data: { state: "SERVED" },
    });
    return success({ success: true, count: res.count });
  } catch (error) {
    return failure<{ success: boolean; count: number }>(
      error instanceof Error ? error.message : "Teslim işlemi başarısız.",
    );
  }
};
