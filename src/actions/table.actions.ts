"use server";

import { withManagerValidation } from "@/actions/helpers";
import {
  createTableSchema,
  deleteTableSchema,
  mergeTableSchema,
  transferTableSchema,
  updateTableSchema,
} from "@/lib/validators/table";
import {
  createTable,
  deleteTable,
  mergeTableOrders,
  transferTableOrders,
  updateTable,
} from "@/services/table.service";
import { logActivity } from "@/services/activity-log.service";

export const createTableAction = withManagerValidation(
  createTableSchema,
  async (data, ctx) => {
    const res = await createTable(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MASA",
      action: "Yeni Masa Eklendi",
      details: `Masa '${res?.label || data.label}' oluşturuldu. (Bölüm: ${res?.section || data.section || "Genel"}, Koltuk: ${res?.seats || data.seats || 4})`,
    });
    return res;
  },
);

export const updateTableAction = withManagerValidation(
  updateTableSchema,
  async (data, ctx) => {
    const res = await updateTable(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MASA",
      action: "Masa Güncellendi",
      details: `Masa '${res?.label || data.label || data.id}' güncellendi. (Koltuk: ${res?.seats || data.seats || 4}, Bölüm: ${res?.section || data.section || "Genel"})`,
    });
    return res;
  },
);

export const deleteTableAction = withManagerValidation(
  deleteTableSchema,
  async (data, ctx) => {
    await deleteTable(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MASA",
      action: "Masa Silindi",
      details: `Masa sistemden silindi. (Masa ID: ${data.id})`,
    });
  },
);

export const transferTableAction = withManagerValidation(
  transferTableSchema,
  async (data, ctx) => {
    const res = await transferTableOrders(ctx.restaurantId, data.fromTableId, data.toTableId);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MASA",
      action: "Masa Taşındı (Transfer)",
      details: `Masa siparişleri başka masaya transfer edildi.`,
    });
    return res;
  },
);

export const mergeTablesAction = withManagerValidation(
  mergeTableSchema,
  async (data, ctx) => {
    const res = await mergeTableOrders(ctx.restaurantId, data.sourceTableId, data.targetTableId);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MASA",
      action: "Masalar Birleştirildi",
      details: `İki masanın siparişleri birleştirildi.`,
    });
    return res;
  },
);
