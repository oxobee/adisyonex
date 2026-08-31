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

export const createTableAction = withManagerValidation(
  createTableSchema,
  (data, ctx) => createTable(ctx, data),
);

export const updateTableAction = withManagerValidation(
  updateTableSchema,
  (data, ctx) => updateTable(ctx, data),
);

export const deleteTableAction = withManagerValidation(
  deleteTableSchema,
  (data, ctx) => deleteTable(ctx, data),
);

export const transferTableAction = withManagerValidation(
  transferTableSchema,
  (data, ctx) => transferTableOrders(ctx.restaurantId, data.fromTableId, data.toTableId),
);

export const mergeTablesAction = withManagerValidation(
  mergeTableSchema,
  (data, ctx) => mergeTableOrders(ctx.restaurantId, data.sourceTableId, data.targetTableId),
);
