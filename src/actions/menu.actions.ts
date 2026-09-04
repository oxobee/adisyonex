"use server";

import { withManagerValidation } from "@/actions/helpers";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import {
  createMenuCategorySchema,
  createMenuItemSchema,
  createModifierGroupSchema,
  deleteMenuItemImageSchema,
  disableItemSchema,
  idOnlySchema,
  reenableItemSchema,
  updateMenuCategorySchema,
  updateMenuItemSchema,
  updateModifierGroupSchema,
} from "@/lib/validators/menu";
import { disableItem, reenableItem } from "@/services/menu-availability.service";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/services/menu-category.service";
import {
  addItemImageForRestaurant,
  removeItemImageForRestaurant,
} from "@/services/menu-image.service";
import {
  createItem,
  deleteItem,
  duplicateItem,
  updateItem,
} from "@/services/menu-item.service";
import { createGroup, deleteGroup, updateGroup } from "@/services/modifier.service";
import { failure, success, type ActionResult } from "@/types";
import { logActivity } from "@/services/activity-log.service";

// ------------------------------------------------------------- categories ---

export const createCategoryAction = withManagerValidation(
  createMenuCategorySchema,
  async (data, ctx) => {
    const res = await createCategory(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Yeni Kategori Eklendi",
      details: `Kategori: '${data.name}' oluşturuldu.`,
    });
    return res;
  },
);

export const updateCategoryAction = withManagerValidation(
  updateMenuCategorySchema,
  async (data, ctx) => {
    const res = await updateCategory(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Kategori Güncellendi",
      details: `Kategori: '${data.name}' bilgileri güncellendi.`,
    });
    return res;
  },
);

export const deleteCategoryAction = withManagerValidation(
  idOnlySchema,
  async (data, ctx) => {
    await deleteCategory(ctx.restaurantId, data.id);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Kategori Silindi",
      details: `Kategori silindi (ID: ${data.id})`,
    });
  },
);

// ------------------------------------------------------------------ items ---

export const createItemAction = withManagerValidation(
  createMenuItemSchema,
  async (data, ctx) => {
    const res = await createItem(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Yeni Ürün Eklendi",
      details: `Menüye '${data.name}' eklendi. Fiyat: ₺${data.price}`,
    });
    return res;
  },
);

export const updateItemAction = withManagerValidation(
  updateMenuItemSchema,
  async (data, ctx) => {
    const res = await updateItem(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Ürün Güncellendi",
      details: `'${data.name || 'Ürün'}' güncellendi. Yeni Fiyat: ₺${data.price}`,
    });
    return res;
  },
);

export const deleteItemAction = withManagerValidation(
  idOnlySchema,
  async (data, ctx) => {
    await deleteItem(ctx.restaurantId, data.id);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Ürün Silindi",
      details: `Ürün menüden silindi (ID: ${data.id})`,
    });
  },
);

export const duplicateItemAction = withManagerValidation(
  idOnlySchema,
  async (data, ctx) => {
    const res = await duplicateItem(ctx.restaurantId, data.id);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Ürün Kopyalandı",
      details: `Ürün kopyası oluşturuldu (ID: ${data.id})`,
    });
    return res;
  },
);

// -------------------------------------------------------- modifier groups ---

export const createGroupAction = withManagerValidation(
  createModifierGroupSchema,
  async (data, ctx) => {
    const res = await createGroup(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Seçenek Grubu Eklendi",
      details: `'${data.name}' seçenek grubu oluşturuldu.`,
    });
    return res;
  },
);

export const updateGroupAction = withManagerValidation(
  updateModifierGroupSchema,
  async (data, ctx) => {
    const res = await updateGroup(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Seçenek Grubu Güncellendi",
      details: `'${data.name}' grubu güncellendi.`,
    });
    return res;
  },
);

export const deleteGroupAction = withManagerValidation(
  idOnlySchema,
  async (data, ctx) => {
    await deleteGroup(ctx.restaurantId, data.id);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Seçenek Grubu Silindi",
      details: `Seçenek grubu silindi (ID: ${data.id})`,
    });
  },
);

// ----------------------------------------------------------- availability ---

export const disableItemAction = withManagerValidation(
  disableItemSchema,
  async (data, ctx) => {
    const res = await disableItem(ctx.restaurantId, ctx.userId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Ürün Tükendi/Servis Dışı (86)",
      details: `Ürün servis dışı bırakıldı. Neden: ${data.reason}`,
    });
    return res;
  },
);

export const reenableItemAction = withManagerValidation(
  reenableItemSchema,
  async (data, ctx) => {
    const res = await reenableItem(ctx.restaurantId, ctx.userId, data.itemId);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Ürün Tekrar Satışa Açıldı",
      details: `Ürün menüde yeniden aktif edildi.`,
    });
    return res;
  },
);

// ----------------------------------------------------------------- images ---

export const deleteItemImageAction = withManagerValidation(
  deleteMenuItemImageSchema,
  (data, ctx) => removeItemImageForRestaurant(ctx.restaurantId, data.imageId),
);

export const uploadItemImageAction = async (
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }>> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("NO_RESTAURANT");
  }

  const itemId = formData.get("itemId");
  const file = formData.get("file");
  if (typeof itemId !== "string" || !(file instanceof File)) {
    return failure("Invalid upload");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await addItemImageForRestaurant(ctx.restaurantId, itemId, {
      buffer,
      type: file.type,
      size: file.size,
    });
    return success({ id: image.id, url: image.url });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Upload failed");
  }
};
