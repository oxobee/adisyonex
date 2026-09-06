import type { MenuCategory, RestaurantZone } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface MenuCategoryWriteData {
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  productionZoneId?: string | null;
}

export type MenuCategoryWithZone = MenuCategory & {
  productionZone?: RestaurantZone | null;
};

export const createMenuCategory = (
  restaurantId: string,
  data: MenuCategoryWriteData,
): Promise<MenuCategoryWithZone> =>
  prisma.menuCategory.create({
    data: {
      restaurant: { connect: { id: restaurantId } },
      name: data.name,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      ...(data.productionZoneId
        ? { productionZone: { connect: { id: data.productionZoneId } } }
        : {}),
    },
    include: {
      productionZone: true,
    },
  });

export const findMenuCategoryById = (
  id: string,
): Promise<MenuCategoryWithZone | null> =>
  prisma.menuCategory.findUnique({
    where: { id },
    include: {
      productionZone: true,
    },
  });

export const findCategoriesByRestaurant = (
  restaurantId: string,
): Promise<MenuCategoryWithZone[]> =>
  prisma.menuCategory.findMany({
    where: { restaurantId, deletedAt: null },
    include: {
      productionZone: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

export const updateMenuCategory = (
  id: string,
  data: MenuCategoryWriteData,
): Promise<MenuCategoryWithZone> =>
  prisma.menuCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      ...(data.productionZoneId !== undefined
        ? data.productionZoneId
          ? { productionZone: { connect: { id: data.productionZoneId } } }
          : { productionZone: { disconnect: true } }
        : {}),
    },
    include: {
      productionZone: true,
    },
  });

export const softDeleteMenuCategory = (id: string): Promise<MenuCategory> =>
  prisma.menuCategory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
