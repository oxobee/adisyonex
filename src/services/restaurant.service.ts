import type {
  OnboardRestaurantInput,
  RestaurantListQuery,
} from "@/lib/validators/admin";
import {
  createRestaurant,
  findRestaurantById,
  findRestaurantBySlug,
  findRestaurantByUsername,
  findRestaurantsPaginated,
  updateRestaurant,
  type AdminRestaurantRow,
} from "@/repositories/restaurant.repository";
import { createUser, findUserByPhone } from "@/repositories/user.repository";
import { generateUsername } from "@/lib/username";
import type { LicensePlan } from "@/generated/prisma/client";
import { adminRecharge } from "@/services/ai/ai-credit.service";
import type { Paginated } from "@/types";
import type { RestaurantListItemDTO } from "@/types/admin";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const uniqueSlug = async (name: string): Promise<string> => {
  const base = slugify(name) || "restaurant";
  let slug = base;
  let attempt = 1;
  while (await findRestaurantBySlug(slug)) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
};

/** Allocate a fresh, unused 7-character restaurant username. */
export const generateUniqueUsername = async (): Promise<string> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateUsername();
    if (!(await findRestaurantByUsername(candidate))) {
      return candidate;
    }
  }
  throw new Error("USERNAME_GENERATION_FAILED");
};

const mapRestaurant = (row: AdminRestaurantRow): RestaurantListItemDTO => {
  let expiresAt = row.licenseExpiresAt;
  const plan = row.licensePlan || "TRIAL";
  const startsAt = row.licenseStartsAt || row.createdAt;

  if (!expiresAt && plan === "TRIAL" && startsAt) {
    expiresAt = new Date(new Date(startsAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  let daysRemaining = 9999;
  let isExpired = false;

  if (plan === "LIFETIME") {
    daysRemaining = 9999;
    isExpired = false;
  } else if (expiresAt) {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    isExpired = diffMs <= 0;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    username: row.username ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    city: row.city,
    country: row.country,
    addressLine1: row.addressLine1 ?? null,
    isActive: row.isActive,
    ownerName: row.owner.name,
    ownerPhone: row.owner.phone,
    onboardedAt: row.onboardedAt ? new Date(row.onboardedAt).toISOString() : new Date().toISOString(),
    licensePlan: plan,
    licenseExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    licenseDaysRemaining: daysRemaining,
    licenseStatus: isExpired ? "EXPIRED" : (row.licenseStatus || "ACTIVE"),
    aiBalance: row.aiWallet?.balance ?? 0,
    salesRepId: row.salesRepId ?? null,
    salesRepName: row.salesRep?.name ?? null,
  };
};

/**
 * Onboard a restaurant: reuse the owner by phone (or create the manager
 * account), then create the restaurant with a unique slug.
 */
export const onboardRestaurant = async (
  input: OnboardRestaurantInput,
): Promise<RestaurantListItemDTO> => {
  const owner =
    (await findUserByPhone(input.ownerPhone)) ??
    (await createUser({
      phone: input.ownerPhone,
      name: input.ownerName ?? null,
    }));

  const slug = await uniqueSlug(input.name);
  const username = await generateUniqueUsername();

  const now = new Date();
  let licensePlan: LicensePlan = input.licensePlan || "MONTHLY";
  let licenseExpiresAt: Date | null = null;
  let defaultAiCredits = 100;

  if (input.licenseType === "CUSTOM") {
    const days = input.customDays && input.customDays > 0 ? input.customDays : 30;
    licenseExpiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    licensePlan = days >= 365 ? "YEARLY" : "MONTHLY";
    // For custom days, AI credits are manually specified by admin (or default to 0 if not provided)
    defaultAiCredits = input.aiCredits !== undefined ? input.aiCredits : 100;
  } else {
    // Standard Packages
    if (input.licensePlan === "LIFETIME") {
      licensePlan = "LIFETIME";
      licenseExpiresAt = null;
      defaultAiCredits = input.aiCredits !== undefined ? input.aiCredits : 5000;
    } else if (input.licensePlan === "YEARLY") {
      licensePlan = "YEARLY";
      const days = input.customDays && input.customDays > 0 ? input.customDays : 365;
      licenseExpiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      defaultAiCredits = input.aiCredits !== undefined ? input.aiCredits : 1500;
    } else if (input.licensePlan === "TRIAL") {
      licensePlan = "TRIAL";
      const days = input.customDays && input.customDays > 0 ? input.customDays : 14;
      licenseExpiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      defaultAiCredits = input.aiCredits !== undefined ? input.aiCredits : 50;
    } else {
      licensePlan = "MONTHLY";
      const days = input.customDays && input.customDays > 0 ? input.customDays : 30;
      licenseExpiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      defaultAiCredits = input.aiCredits !== undefined ? input.aiCredits : 100;
    }
  }

  const licenseNote =
    input.licenseNote ||
    (input.licenseType === "CUSTOM"
      ? `${input.customDays ?? 30} Günlük Özel Lisans Tanımlaması`
      : undefined);

  const restaurant = await createRestaurant({
    name: input.name,
    slug,
    username,
    email: input.email ?? null,
    city: input.city ?? null,
    country: input.country,
    timezone: input.timezone ?? null,
    licensePlan,
    licenseStatus: "ACTIVE",
    licenseStartsAt: now,
    licenseExpiresAt,
    licenseNote,
    owner: { connect: { id: owner.id } },
  });

  // Automatically top-up starting AI credits if defined and > 0
  if (defaultAiCredits > 0) {
    try {
      await adminRecharge(
        restaurant.id,
        defaultAiCredits,
        `Yeni restoran açılış lisansı (${licensePlan}) ile ${defaultAiCredits} AI kredisi tanımlandı`,
      );
    } catch {
      // Wallet creation or recharge can fail softly without blocking restaurant creation
    }
  }

  let daysRemaining = 9999;
  if (licensePlan !== "LIFETIME" && licenseExpiresAt) {
    const diffMs = licenseExpiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    username: restaurant.username,
    phone: restaurant.phone,
    email: restaurant.email,
    city: restaurant.city,
    country: restaurant.country,
    addressLine1: restaurant.addressLine1,
    isActive: restaurant.isActive,
    ownerName: owner.name,
    ownerPhone: owner.phone,
    onboardedAt: restaurant.onboardedAt.toISOString(),
    licensePlan,
    licenseExpiresAt: licenseExpiresAt ? licenseExpiresAt.toISOString() : null,
    licenseDaysRemaining: daysRemaining,
    licenseStatus: "ACTIVE",
    aiBalance: defaultAiCredits,
  };
};

export const listRestaurants = async (
  query: RestaurantListQuery,
): Promise<Paginated<RestaurantListItemDTO>> => {
  const { items, total } = await findRestaurantsPaginated(query);
  return {
    items: items.map(mapRestaurant),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
};

export const updateAdminRestaurant = async (
  input: {
    id: string;
    name: string;
    slug: string;
    username?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    addressLine1?: string | null;
  },
) => {
  return updateRestaurant(input.id, {
    name: input.name,
    slug: input.slug,
    username: input.username?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    city: input.city?.trim() || null,
    addressLine1: input.addressLine1?.trim() || null,
  });
};

export const toggleAdminRestaurantActive = async (id: string) => {
  const restaurant = await findRestaurantById(id);
  if (!restaurant) {
    throw new Error("Restoran bulunamadı");
  }
  return updateRestaurant(id, {
    isActive: !restaurant.isActive,
  });
};

export const deleteAdminRestaurant = async (id: string) => {
  return updateRestaurant(id, {
    deletedAt: new Date(),
    isActive: false,
  });
};
