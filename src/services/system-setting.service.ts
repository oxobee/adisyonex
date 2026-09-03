import { prisma } from "@/lib/prisma";

export interface SystemSettingsDTO {
  systemName: string;
  systemTagline: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

const DEFAULT_SETTINGS: SystemSettingsDTO = {
  systemName: "AdisyonEx",
  systemTagline: "Gelişmiş Restoran & QR Menü Yönetim Sistemi",
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  ogImageUrl: null,
  metaTitle: "AdisyonEx | Restoran ve QR Menü Otomasyonu",
  metaDescription: "Yeni nesil restoran adisyon, sipariş, mutfak ve QR menü yönetim platformu.",
  metaKeywords: "restoran otomasyonu, adisyon sistemi, qr menü, pos kasa",
};

export async function getSystemSettings(): Promise<SystemSettingsDTO> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { id: "global" },
    });
    if (!row) {
      return DEFAULT_SETTINGS;
    }
    return {
      systemName: row.systemName || DEFAULT_SETTINGS.systemName,
      systemTagline: row.systemTagline || DEFAULT_SETTINGS.systemTagline,
      logoUrl: row.logoUrl,
      logoDarkUrl: (row as unknown as { logoDarkUrl?: string | null }).logoDarkUrl ?? null,
      faviconUrl: row.faviconUrl,
      ogImageUrl: row.ogImageUrl,
      metaTitle: row.metaTitle || DEFAULT_SETTINGS.metaTitle,
      metaDescription: row.metaDescription || DEFAULT_SETTINGS.metaDescription,
      metaKeywords: row.metaKeywords || DEFAULT_SETTINGS.metaKeywords,
    };
  } catch (error) {
    console.error("Failed to read system settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSettings(data: Partial<SystemSettingsDTO>): Promise<SystemSettingsDTO> {
  const updated = await prisma.systemSetting.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      systemName: data.systemName || DEFAULT_SETTINGS.systemName,
      systemTagline: data.systemTagline ?? DEFAULT_SETTINGS.systemTagline,
      logoUrl: data.logoUrl,
      logoDarkUrl: data.logoDarkUrl,
      faviconUrl: data.faviconUrl,
      ogImageUrl: data.ogImageUrl,
      metaTitle: data.metaTitle ?? DEFAULT_SETTINGS.metaTitle,
      metaDescription: data.metaDescription ?? DEFAULT_SETTINGS.metaDescription,
      metaKeywords: data.metaKeywords ?? DEFAULT_SETTINGS.metaKeywords,
    },
    update: {
      ...(data.systemName !== undefined && { systemName: data.systemName }),
      ...(data.systemTagline !== undefined && { systemTagline: data.systemTagline }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.logoDarkUrl !== undefined && { logoDarkUrl: data.logoDarkUrl }),
      ...(data.faviconUrl !== undefined && { faviconUrl: data.faviconUrl }),
      ...(data.ogImageUrl !== undefined && { ogImageUrl: data.ogImageUrl }),
      ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
      ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
      ...(data.metaKeywords !== undefined && { metaKeywords: data.metaKeywords }),
    },
  });

  return {
    systemName: updated.systemName,
    systemTagline: updated.systemTagline,
    logoUrl: updated.logoUrl,
    logoDarkUrl: (updated as unknown as { logoDarkUrl?: string | null }).logoDarkUrl ?? null,
    faviconUrl: updated.faviconUrl,
    ogImageUrl: updated.ogImageUrl,
    metaTitle: updated.metaTitle,
    metaDescription: updated.metaDescription,
    metaKeywords: updated.metaKeywords,
  };
}
