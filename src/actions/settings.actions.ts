"use server";

import { revalidatePath } from "next/cache";
import { withManagerValidation } from "@/actions/helpers";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import {
  addVideoLinkSchema,
  removeGalleryImageSchema,
  removeVideoSchema,
  setInvoiceFooterSchema,
  setSelfOrderSchema,
  setShowItemImagesSchema,
  updateGeolocationSchema,
  updateProfileSchema,
  updateTaxProfileSchema,
  updateUsernameSchema,
} from "@/lib/validators/restaurant";
import {
  addGalleryImage,
  removeCover,
  removeGalleryImage,
  removeLogo,
  uploadCover,
  uploadLogo,
  uploadSliderImage,
  type UploadFile,
} from "@/services/restaurant-image.service";
import {
  updateRestaurantProfile,
  updateTaxProfile,
  updateUsername,
  regenerateUsername,
  setInvoiceFooterNote,
  setSelfOrderEnabled,
  setShowItemImages,
  updateGeolocation,
  clearGeolocation,
  updateQrMenuTheme,
  updateQrThemeCustomization,
  updateScreenLockPin,
  type QrThemeCustomizationDTO,
} from "@/services/restaurant-settings.service";
import {
  addVideoLink,
  removeVideo,
  uploadVideoFile,
} from "@/services/restaurant-video.service";
import { failure, success, type ActionResult } from "@/types";
import { logActivity } from "@/services/activity-log.service";

export const updateTaxProfileAction = withManagerValidation(
  updateTaxProfileSchema,
  async (data, ctx) => {
    const res = await updateTaxProfile(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "Vergi & KDV Profili Güncellendi",
      details: `KDV dahil/hariç ve oran ayarları güncellendi.`,
    });
    return res;
  },
);

export const updateRestaurantProfileAction = withManagerValidation(
  updateProfileSchema,
  async (data, ctx) => {
    const res = await updateRestaurantProfile(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "İşletme Profili Güncellendi",
      details: `İşletme adı: '${data.name}', İletişim: ${data.phone || 'Yok'}`,
    });
    return res;
  },
);

export const updateUsernameAction = withManagerValidation(
  updateUsernameSchema,
  async (data, ctx) => {
    const res = await updateUsername(ctx.restaurantId, data.username);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "Restoran URL (Kullanıcı Adı) Değiştirildi",
      details: `Yeni QR Menü linki: /order/${data.username}`,
    });
    return res;
  },
);

export const setSelfOrderEnabledAction = withManagerValidation(
  setSelfOrderSchema,
  async (data, ctx) => {
    const res = await setSelfOrderEnabled(ctx.restaurantId, data.enabled);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "Masadan Self-Order Ayarı Değiştirildi",
      details: `Masadan sipariş verme: ${data.enabled ? 'Açık' : 'Kapalı'}`,
    });
    return res;
  },
);

export const setShowItemImagesAction = withManagerValidation(
  setShowItemImagesSchema,
  async (data, ctx) => {
    const res = await setShowItemImages(ctx.restaurantId, data.enabled);
    const { invalidateMenuCache } = await import("@/services/menu-item.service");
    invalidateMenuCache(ctx.restaurantId);
    revalidatePath("/", "layout");
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "MENÜ",
      action: "Menü Görsel Gösterim Ayarı Değiştirildi",
      details: `Ürün görselleri: ${data.enabled ? 'Açık (Görseller Gösteriliyor)' : 'Kapalı (Görselsiz Liste Modu)'}`,
    });
    return res;
  },
);

export const setInvoiceFooterAction = withManagerValidation(
  setInvoiceFooterSchema,
  async (data, ctx) => {
    const res = await setInvoiceFooterNote(ctx.restaurantId, data.note);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "Adisyon Dipnotu Güncellendi",
      details: `Fiş altı mesajı güncellendi.`,
    });
    return res;
  },
);

export const updateGeolocationAction = withManagerValidation(
  updateGeolocationSchema,
  async (data, ctx) => {
    const res = await updateGeolocation(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "Harita Konumu Güncellendi",
      details: `Enlem/Boylam koordinatları güncellendi.`,
    });
    return res;
  },
);

export const regenerateUsernameAction = async (): Promise<
  ActionResult<string>
> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure<string>("NO_RESTAURANT");
  }
  try {
    return success(await regenerateUsername(ctx.restaurantId));
  } catch (error) {
    return failure<string>(
      error instanceof Error ? error.message : "Something went wrong",
    );
  }
};

export const removeGalleryImageAction = withManagerValidation(
  removeGalleryImageSchema,
  (data, ctx) => removeGalleryImage(ctx.restaurantId, data.imageId),
);

export const addVideoLinkAction = withManagerValidation(
  addVideoLinkSchema,
  (data, ctx) => addVideoLink(ctx.restaurantId, data.url, data.caption),
);

export const removeVideoAction = withManagerValidation(
  removeVideoSchema,
  (data, ctx) => removeVideo(ctx.restaurantId, data.id),
);

const runFileUpload = async <R>(
  formData: FormData,
  handler: (restaurantId: string, file: UploadFile) => Promise<R>,
): Promise<ActionResult<R>> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure<R>("NO_RESTAURANT");
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return failure<R>("Invalid upload");
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    return success(
      await handler(ctx.restaurantId, {
        buffer,
        type: file.type,
        size: file.size,
      }),
    );
  } catch (error) {
    return failure<R>(error instanceof Error ? error.message : "Upload failed");
  }
};

const runOwned = async (
  handler: (restaurantId: string) => Promise<void>,
): Promise<ActionResult<void>> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("NO_RESTAURANT");
  }
  try {
    await handler(ctx.restaurantId);
    return success(undefined);
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Something went wrong",
    );
  }
};

export const uploadLogoAction = async (
  formData: FormData,
): Promise<ActionResult<string>> => runFileUpload(formData, uploadLogo);

export const uploadCoverAction = async (
  formData: FormData,
): Promise<ActionResult<string>> => runFileUpload(formData, uploadCover);

export const uploadGalleryImageAction = async (
  formData: FormData,
): Promise<ActionResult<void>> => runFileUpload(formData, addGalleryImage);

export const uploadSliderImageAction = async (
  formData: FormData,
): Promise<ActionResult<string>> => runFileUpload(formData, uploadSliderImage);

export const uploadVideoAction = async (
  formData: FormData,
): Promise<ActionResult<void>> => {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return failure("NO_RESTAURANT");
  }
  const file = formData.get("file");
  const caption = formData.get("caption");
  if (!(file instanceof File)) {
    return failure("Invalid upload");
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadVideoFile(
      ctx.restaurantId,
      { buffer, type: file.type, size: file.size },
      typeof caption === "string" && caption.trim() ? caption.trim() : undefined,
    );
    return success(undefined);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Upload failed");
  }
};

export const removeLogoAction = async (): Promise<ActionResult<void>> =>
  runOwned(removeLogo);

export const removeCoverAction = async (): Promise<ActionResult<void>> =>
  runOwned(removeCover);

export const clearGeolocationAction = async (): Promise<ActionResult<void>> =>
  runOwned(clearGeolocation);

export const updateQrMenuThemeAction = async (
  theme: string,
): Promise<ActionResult<void>> => {
  const ctx = await getManagerContextOrNull();
  const res = await runOwned((restaurantId) => updateQrMenuTheme(restaurantId, theme));
  if (res.success && ctx) {
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "QR Menü Teması Değiştirildi",
      details: `Yeni Tema: ${theme}`,
    });
    revalidatePath("/dashboard/menu-design");
    revalidatePath("/order/[username]", "page");
    revalidatePath("/", "layout");
  }
  return res;
};

export const updateQrThemeCustomizationAction = async (
  data: Partial<QrThemeCustomizationDTO>,
): Promise<ActionResult<void>> => {
  const ctx = await getManagerContextOrNull();
  const res = await runOwned((restaurantId) => updateQrThemeCustomization(restaurantId, data));
  if (res.success && ctx) {
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "QR Menü Tasarım Ayarları Güncellendi",
      details: `Renk, slider ve layout tercihleri güncellendi.`,
    });
    revalidatePath("/dashboard/menu-design");
    revalidatePath("/order/[username]", "page");
    revalidatePath("/", "layout");
  }
  return res;
};

export const updateScreenLockPinAction = async (
  pin: string,
): Promise<ActionResult<void>> => {
  if (!/^\d{4}$/.test(pin)) {
    return failure("PIN kodu 4 haneli rakamlardan oluşmalıdır");
  }
  const ctx = await getManagerContextOrNull();
  const res = await runOwned((restaurantId) => updateScreenLockPin(restaurantId, pin));
  if (res.success && ctx) {
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "AYARLAR",
      action: "Terminal Ekran Kilit PIN Kodu Değiştirildi",
      details: `Yönetici ekran kilidi PIN kodu güncellendi.`,
    });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/home");
  }
  return res;
};

