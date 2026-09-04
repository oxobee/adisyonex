"use server";

import { withManagerValidation } from "@/actions/helpers";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import {
  createStaffSchema,
  deleteStaffSchema,
  resetPinSchema,
  updateStaffSchema,
} from "@/lib/validators/staff";
import {
  removeStaffPhoto,
  uploadStaffPhoto,
} from "@/services/staff-image.service";
import {
  createStaff,
  deleteStaff,
  resetPin,
  updateStaff,
} from "@/services/staff.service";
import { failure, success, type ActionResult } from "@/types";
import { logActivity } from "@/services/activity-log.service";

export const createStaffAction = withManagerValidation(
  createStaffSchema,
  async (data, ctx) => {
    const res = await createStaff(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Yeni Personel Eklendi",
      details: `Personel: '${data.name}', Rol: ${data.role}, Görev: ${data.jobTitle || 'Belirtilmedi'}`,
    });
    return res;
  },
);

export const updateStaffAction = withManagerValidation(
  updateStaffSchema,
  async (data, ctx) => {
    const res = await updateStaff(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Personel Bilgileri Güncellendi",
      details: `Personel: '${data.name || 'Personel'}' yetki ve görev bilgileri güncellendi.`,
    });
    return res;
  },
);

export const deleteStaffAction = withManagerValidation(
  deleteStaffSchema,
  async (data, ctx) => {
    await deleteStaff(ctx, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Personel Silindi",
      details: `Personel sistemden silindi (ID: ${data.id})`,
    });
  },
);

export const resetPinAction = withManagerValidation(resetPinSchema, async (data, ctx) => {
  const res = await resetPin(ctx, data);
  await logActivity({
    restaurantId: ctx.restaurantId,
    category: "PERSONEL",
    action: "Personel PIN Kodu Sıfırlandı",
    details: `Personelin 4 haneli giriş PIN kodu güncellendi/sıfırlandı.`,
  });
  return res;
});

export const uploadStaffPhotoAction = async (
  formData: FormData,
): Promise<ActionResult<string>> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("NO_RESTAURANT");
  }
  const staffId = formData.get("staffId");
  const file = formData.get("file");
  if (typeof staffId !== "string" || !(file instanceof File)) {
    return failure("Invalid upload");
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    return success(
      await uploadStaffPhoto(ctx.restaurantId, staffId, {
        buffer,
        type: file.type,
        size: file.size,
      }),
    );
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Upload failed");
  }
};

export const removeStaffPhotoAction = async (
  staffId: string,
): Promise<ActionResult<void>> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("NO_RESTAURANT");
  }
  try {
    await removeStaffPhoto(ctx.restaurantId, staffId);
    return success(undefined);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Something went wrong");
  }
};
