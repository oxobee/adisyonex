"use server";

import { withManagerValidation } from "@/actions/helpers";
import {
  adjustStockSchema,
  bulkReceiveSchema,
  countStockSchema,
  createStockItemSchema,
  deleteStockItemSchema,
  updateStockItemSchema,
} from "@/lib/validators/inventory";
import {
  adjustStock,
  bulkReceive,
  countStock,
  createStockItem,
  deleteStockItem,
  updateStockItem,
} from "@/services/stock.service";
import { logActivity } from "@/services/activity-log.service";

export const createStockItemAction = withManagerValidation(
  createStockItemSchema,
  async (data, ctx) => {
    const res = await createStockItem(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Yeni Stok Kalemi Eklendi",
      details: `Hammadde: '${data.name}', Birim: ${data.unit}, Birim Maliyet: ₺${data.costPerUnit || 0}`,
    });
    return res;
  },
);

export const updateStockItemAction = withManagerValidation(
  updateStockItemSchema,
  async (data, ctx) => {
    const res = await updateStockItem(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Stok Kalemi Güncellendi",
      details: `Hammadde: '${data.name || 'Malzeme'}' bilgileri güncellendi.`,
    });
    return res;
  },
);

export const deleteStockItemAction = withManagerValidation(
  deleteStockItemSchema,
  async (data, ctx) => {
    await deleteStockItem(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Stok Kalemi Silindi",
      details: `Stok kalemi sistemden silindi (ID: ${data.id})`,
    });
  },
);

export const adjustStockAction = withManagerValidation(
  adjustStockSchema,
  async (data, ctx) => {
    const res = await adjustStock(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Stok Hareketi İşlendi",
      details: `İşlem: ${data.type}, Miktar: ${data.quantity}. Neden: ${data.reason || data.note || "Belirtilmedi"}`,
    });
    return res;
  },
);

export const bulkReceiveAction = withManagerValidation(
  bulkReceiveSchema,
  async (data, ctx) => {
    const res = await bulkReceive(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Toplu Mal Kabul Yapıldı",
      details: `${data.rows.length} kalem malzeme stoğa kabul edildi. Not: ${data.note || "Yok"}`,
    });
    return res;
  },
);

export const countStockAction = withManagerValidation(
  countStockSchema,
  async (data, ctx) => {
    const res = await countStock(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Stok Sayımı İşlendi",
      details: `Fiziki stok sayımı kaydedildi.`,
    });
    return res;
  },
);
