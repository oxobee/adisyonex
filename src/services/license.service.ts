import { prisma } from "@/lib/prisma";
import type { LicensePlan, LicenseStatus } from "@/generated/prisma/client";
import { getOrCreateWallet, adminRecharge } from "@/services/ai/ai-credit.service";

export interface LicenseInfoDTO {
  restaurantId: string;
  restaurantName: string;
  plan: LicensePlan;
  planLabel: string;
  status: LicenseStatus;
  statusLabel: string;
  daysRemaining: number;
  startsAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  aiBalance: number;
  aiTotalCredits: number;
  note?: string | null;
}

export const getPlanLabel = (plan: LicensePlan): string => {
  switch (plan) {
    case "YEARLY":
      return "Yıllık Pro Lisans";
    case "MONTHLY":
      return "Aylık Standart Lisans";
    case "LIFETIME":
      return "Süresiz / Ömür Boyu";
    case "TRIAL":
    default:
      return "Deneme Sürümü";
  }
};

export const getStatusLabel = (status: LicenseStatus, isExpired: boolean): string => {
  if (isExpired) return "Süresi Doldu";
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "GRACE_PERIOD":
      return "Ek Süre";
    case "SUSPENDED":
      return "Askıya Alındı";
    case "EXPIRED":
    default:
      return "Süresi Doldu";
  }
};

/** Get comprehensive license and AI credit info for a restaurant */
export const getRestaurantLicenseInfo = async (
  restaurantId: string,
): Promise<LicenseInfoDTO> => {
  const [restaurant, wallet] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        licensePlan: true,
        licenseStatus: true,
        licenseStartsAt: true,
        licenseExpiresAt: true,
        licenseNote: true,
        onboardedAt: true,
        createdAt: true,
      },
    }),
    getOrCreateWallet(restaurantId),
  ]);

  if (!restaurant) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  let expiresAt = restaurant.licenseExpiresAt;
  let plan = restaurant.licensePlan;
  let startsAt = restaurant.licenseStartsAt || restaurant.createdAt;

  // Default: if no expiry set and plan is TRIAL, default 30 days from creation
  if (!expiresAt && plan === "TRIAL") {
    const defaultExpiry = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    expiresAt = defaultExpiry;
  }

  let daysRemaining = 9999;
  let isExpired = false;
  let isExpiringSoon = false;

  if (plan === "LIFETIME") {
    daysRemaining = 9999;
    isExpired = false;
    isExpiringSoon = false;
  } else if (expiresAt) {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    isExpired = diffMs <= 0;
    isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  }

  return {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    plan,
    planLabel: getPlanLabel(plan),
    status: isExpired ? "EXPIRED" : restaurant.licenseStatus,
    statusLabel: getStatusLabel(restaurant.licenseStatus, isExpired),
    daysRemaining,
    startsAt: startsAt ? new Date(startsAt).toISOString() : null,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    isExpired,
    isExpiringSoon,
    aiBalance: wallet.balance,
    aiTotalCredits: wallet.balance + wallet.totalUsed,
    note: restaurant.licenseNote,
  };
};

/** Super Admin: Assign or Extend License & AI Credits */
export const adminAssignLicense = async (
  restaurantId: string,
  input: {
    plan: LicensePlan;
    customDays?: number;
    addAiCredits?: number;
    note?: string;
  },
): Promise<LicenseInfoDTO> => {
  const current = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      licenseExpiresAt: true,
      licenseStartsAt: true,
      licensePlan: true,
    },
  });

  if (!current) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  const now = new Date();
  let baseDate = now;

  // If extending an active future license, start from current expiry
  if (
    current.licenseExpiresAt &&
    new Date(current.licenseExpiresAt).getTime() > now.getTime()
  ) {
    baseDate = new Date(current.licenseExpiresAt);
  }

  let newExpiresAt: Date | null = null;

  if (input.plan === "MONTHLY") {
    const days = input.customDays || 30;
    newExpiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  } else if (input.plan === "YEARLY") {
    const days = input.customDays || 365;
    newExpiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  } else if (input.plan === "TRIAL") {
    const days = input.customDays || 14;
    newExpiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  } else if (input.plan === "LIFETIME") {
    newExpiresAt = null;
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      licensePlan: input.plan,
      licenseStatus: "ACTIVE",
      licenseStartsAt: current.licenseStartsAt || now,
      licenseExpiresAt: newExpiresAt,
      licenseNote: input.note || undefined,
    },
  });

  // Credit top-up if specified
  if (input.addAiCredits && input.addAiCredits > 0) {
    await adminRecharge(
      restaurantId,
      input.addAiCredits,
      `Lisans (${getPlanLabel(input.plan)}) tanımlaması ile ${input.addAiCredits} AI kredisi yüklendi`,
    );
  }

  return getRestaurantLicenseInfo(restaurantId);
};
