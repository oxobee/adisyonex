"use server";

import { withManagerValidation } from "@/actions/helpers";
import {
  removeRecipeComponentSchema,
  setRecipeComponentSchema,
} from "@/lib/validators/inventory";
import {
  removeRecipeComponent,
  setRecipeComponent,
} from "@/services/recipe.service";
import { logActivity } from "@/services/activity-log.service";

export const setRecipeComponentAction = withManagerValidation(
  setRecipeComponentSchema,
  async (data, ctx) => {
    const res = await setRecipeComponent(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Reçete Bileşeni Eklendi/Güncellendi",
      details: `Ürün reçetesine malzeme tanımlandı. Miktar: ${data.quantity}`,
    });
    return res;
  },
);

export const removeRecipeComponentAction = withManagerValidation(
  removeRecipeComponentSchema,
  async (data, ctx) => {
    const res = await removeRecipeComponent(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "STOK",
      action: "Reçete Bileşeni Silindi",
      details: `Ürün reçetesinden malzeme çıkarıldı.`,
    });
    return res;
  },
);
