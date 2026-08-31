"use server";

import { z } from "zod";
import { getAdminContextOrNull } from "@/lib/admin-auth";
import { withAdminValidation } from "@/actions/helpers";
import { deleteObject, publicUrl, putObject } from "@/lib/storage";
import { updateSystemSettings } from "@/services/system-setting.service";
import { failure, success, type ActionResult } from "@/types";

const systemSettingsSchema = z.object({
  systemName: z.string().trim().min(1, "Sistem adı zorunludur").max(100),
  systemTagline: z.string().trim().max(255).optional().nullable(),
  logoUrl: z.string().trim().optional().nullable(),
  faviconUrl: z.string().trim().optional().nullable(),
  ogImageUrl: z.string().trim().optional().nullable(),
  metaTitle: z.string().trim().max(160).optional().nullable(),
  metaDescription: z.string().trim().max(350).optional().nullable(),
  metaKeywords: z.string().trim().max(300).optional().nullable(),
});

export const updateSystemSettingsAction = withAdminValidation(
  systemSettingsSchema,
  async (data) => {
    return await updateSystemSettings({
      systemName: data.systemName,
      systemTagline: data.systemTagline || null,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
      ogImageUrl: data.ogImageUrl || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      metaKeywords: data.metaKeywords || null,
    });
  },
);

export async function uploadSystemAssetAction(
  formData: FormData,
  kind: "logo" | "favicon" | "ogImage",
): Promise<ActionResult<{ url: string }>> {
  const admin = await getAdminContextOrNull();
  if (!admin) {
    return failure("FORBIDDEN");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return failure("Geçersiz dosya");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let ext = "png";
    if (file.type === "image/jpeg") ext = "jpg";
    if (file.type === "image/webp") ext = "webp";
    if (file.type === "image/x-icon" || file.type === "image/vnd.microsoft.icon") ext = "ico";
    if (file.type === "image/svg+xml") ext = "svg";

    const key = `system/${kind}-${Date.now()}.${ext}`;
    await putObject(key, buffer, file.type || "image/png");
    const url = publicUrl(key);

    // Automatically persist to system settings
    if (kind === "logo") {
      await updateSystemSettings({ logoUrl: url });
    } else if (kind === "favicon") {
      await updateSystemSettings({ faviconUrl: url });
    } else if (kind === "ogImage") {
      await updateSystemSettings({ ogImageUrl: url });
    }

    return success({ url });
  } catch (error) {
    console.error("Failed to upload system asset:", error);
    return failure(error instanceof Error ? error.message : "Yükleme başarısız oldu");
  }
}
