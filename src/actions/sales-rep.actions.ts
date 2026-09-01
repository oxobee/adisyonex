"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { withAdminValidation } from "@/actions/helpers";
import { getAdminContextOrNull } from "@/lib/admin-auth";
import { putObject, publicUrl } from "@/lib/storage";
import { failure, success, type ActionResult } from "@/types";
import {
  assignSalesRepToRestaurant,
  assignSalesRepToUser,
  createSalesRep,
  deleteSalesRep,
  updateSalesRep,
} from "@/services/sales-rep.service";

const createSalesRepSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updateSalesRepSchema = z.object({
  id: z.string(),
  data: createSalesRepSchema.partial(),
});

const deleteSalesRepSchema = z.object({
  id: z.string(),
});

const assignSalesRepSchema = z.object({
  restaurantId: z.string(),
  salesRepId: z.string().nullable(),
});

const assignSalesRepToUserSchema = z.object({
  userId: z.string(),
  salesRepId: z.string().nullable(),
});

export const createSalesRepAction = withAdminValidation(
  createSalesRepSchema,
  async (data) => {
    const rep = await createSalesRep(data);
    revalidatePath("/admin/sales-reps");
    revalidatePath("/admin/restaurants");
    revalidatePath("/admin/users");
    return rep;
  },
);

export const updateSalesRepAction = withAdminValidation(
  updateSalesRepSchema,
  async ({ id, data }) => {
    const rep = await updateSalesRep(id, data);
    revalidatePath("/admin/sales-reps");
    revalidatePath("/admin/restaurants");
    revalidatePath("/admin/users");
    return rep;
  },
);

export const deleteSalesRepAction = withAdminValidation(
  deleteSalesRepSchema,
  async ({ id }) => {
    await deleteSalesRep(id);
    revalidatePath("/admin/sales-reps");
    revalidatePath("/admin/restaurants");
    revalidatePath("/admin/users");
    return { success: true };
  },
);

export const assignSalesRepAction = withAdminValidation(
  assignSalesRepSchema,
  async ({ restaurantId, salesRepId }) => {
    await assignSalesRepToRestaurant(restaurantId, salesRepId);
    revalidatePath("/admin/restaurants");
    revalidatePath("/admin/sales-reps");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  },
);

export const assignSalesRepToUserAction = withAdminValidation(
  assignSalesRepToUserSchema,
  async ({ userId, salesRepId }) => {
    await assignSalesRepToUser(userId, salesRepId);
    revalidatePath("/admin/users");
    revalidatePath("/admin/restaurants");
    revalidatePath("/admin/sales-reps");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  },
);

/**
 * Super Admin: Direct file upload for Sales Representative photo
 */
export async function uploadSalesRepPhotoAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const adminCtx = await getAdminContextOrNull();
  if (!adminCtx) {
    return failure("UNAUTHORIZED_ADMIN_ONLY");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return failure("Geçersiz dosya seçildi.");
  }

  if (!file.type.startsWith("image/")) {
    return failure("Lütfen sadece resim dosyası (JPG, PNG, WebP) yükleyin.");
  }

  if (file.size > 5 * 1024 * 1024) {
    return failure("Dosya boyutu 5MB'dan küçük olmalıdır.");
  }

  try {
    const ext = file.type.split("/")[1] || "jpg";
    const key = `sales-reps/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await putObject(key, buffer, file.type);
    const url = publicUrl(key);

    return success({ url });
  } catch (err) {
    console.error("Sales rep photo upload error:", err);
    return failure(
      err instanceof Error ? err.message : "Fotoğraf yüklenirken bir hata oluştu.",
    );
  }
}
