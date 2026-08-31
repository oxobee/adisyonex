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
  let plan = row.licensePlan;
  let startsAt = row.licenseStartsAt || row.createdAt;

  if (!expiresAt && plan === "TRIAL") {
    expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
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
    onboardedAt: row.onboardedAt.toISOString(),
    licensePlan: row.licensePlan,
    licenseExpiresAt: expiresAt ? expiresAt.toISOString() : null,
    licenseDaysRemaining: daysRemaining,
    licenseStatus: isExpired ? "EXPIRED" : row.licenseStatus,
    aiBalance: row.aiWallet?.balance ?? 0,
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

  const restaurant = await createRestaurant({
    name: input.name,
    slug,
    username,
    email: input.email ?? null,
    city: input.city ?? null,
    country: input.country,
    timezone: input.timezone ?? null,
    owner: { connect: { id: owner.id } },
  });

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
