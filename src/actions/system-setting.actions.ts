"use server";

import { z } from "zod";
import { withAdminValidation } from "@/actions/helpers";
import { updateSystemSettings } from "@/services/system-setting.service";

const systemSettingsSchema = z.object({
  systemName: z.string().trim().min(1, "Sistem adı zorunludur").max(100),
  systemTagline: z.string().trim().max(255).optional().nullable(),
  logoUrl: z.string().trim().url("Geçerli bir URL giriniz").or(z.literal("")).optional().nullable(),
  faviconUrl: z.string().trim().url("Geçerli bir URL giriniz").or(z.literal("")).optional().nullable(),
  ogImageUrl: z.string().trim().url("Geçerli bir URL giriniz").or(z.literal("")).optional().nullable(),
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
