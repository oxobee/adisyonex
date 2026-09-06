"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { withSuperAdminValidation } from "@/actions/helpers";
import {
  getRestaurantModulesStatus,
  listRestaurantNotifications,
  sendRestaurantNotification,
  toggleRestaurantModule,
  updateSystemModule,
  type RestaurantModuleStatusDTO,
  type RestaurantNotificationDTO,
} from "@/services/module.service";
import { findRestaurantById } from "@/repositories/restaurant.repository";

// Schema for updating a module
const updateModuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Modül adı zorunludur"),
  description: z.string().nullable().optional(),
  price: z.number().min(0, "Fiyat 0 veya daha büyük olmalıdır"),
  isActive: z.boolean(),
});

// Schema for toggling a restaurant's module
const toggleRestaurantModuleSchema = z.object({
  restaurantId: z.string().min(1),
  moduleId: z.string().min(1),
  isActive: z.boolean(),
});

// Schema for sending a notification to restaurant
const sendNotificationSchema = z.object({
  restaurantId: z.string().min(1),
  title: z.string().min(1, "Başlık zorunludur"),
  message: z.string().min(1, "Mesaj metni zorunludur"),
  buttonText: z.string().nullable().optional(),
  buttonUrl: z.string().nullable().optional(),
});

// Schema for impersonation
const impersonateSchema = z.object({
  restaurantId: z.string().min(1),
});

/**
 * Update system module details (title, description, price, global active state)
 */
export const updateAdminModuleAction = withSuperAdminValidation(
  updateModuleSchema,
  async (data) => {
    await updateSystemModule(data.id, {
      name: data.name,
      description: data.description,
      price: data.price,
      isActive: data.isActive,
    });
    revalidatePath("/admin/modules");
    revalidatePath("/admin/restaurants");
    return { success: true };
  }
);

/**
 * Quick toggle global module active / passive
 */
export const toggleAdminModuleGlobalAction = withSuperAdminValidation(
  z.object({ id: z.string(), isActive: z.boolean() }),
  async ({ id, isActive }) => {
    await updateSystemModule(id, { isActive });
    revalidatePath("/admin/modules");
    return { success: true };
  }
);

/**
 * Get modules status for a specific restaurant
 */
export const getRestaurantModulesAction = withSuperAdminValidation(
  z.object({ restaurantId: z.string().min(1) }),
  async ({ restaurantId }): Promise<readonly RestaurantModuleStatusDTO[]> => {
    return getRestaurantModulesStatus(restaurantId);
  }
);

/**
 * Enable or disable a module for a specific restaurant
 */
export const toggleRestaurantModuleAction = withSuperAdminValidation(
  toggleRestaurantModuleSchema,
  async (data) => {
    await toggleRestaurantModule(data.restaurantId, data.moduleId, data.isActive);
    revalidatePath("/admin/modules");
    revalidatePath("/admin/restaurants");
    return { success: true };
  }
);

/**
 * Send a notification from SuperAdmin to a restaurant
 */
export const sendRestaurantNotificationAction = withSuperAdminValidation(
  sendNotificationSchema,
  async (data): Promise<RestaurantNotificationDTO> => {
    const result = await sendRestaurantNotification(data.restaurantId, {
      title: data.title,
      message: data.message,
      buttonText: data.buttonText,
      buttonUrl: data.buttonUrl,
    });
    revalidatePath("/admin/restaurants");
    revalidatePath("/dashboard");
    return result;
  }
);

/**
 * List recent notifications for a restaurant
 */
export const listRestaurantNotificationsAction = withSuperAdminValidation(
  z.object({ restaurantId: z.string().min(1) }),
  async ({ restaurantId }): Promise<readonly RestaurantNotificationDTO[]> => {
    return listRestaurantNotifications(restaurantId);
  }
);

export interface ImpersonateResultDTO {
  restaurantId: string;
  restaurantName: string;
  redirectUrl: string;
}

/**
 * Impersonate restaurant: log into restaurant's dashboard as SuperAdmin
 */
export const impersonateRestaurantAction = withSuperAdminValidation(
  impersonateSchema,
  async ({ restaurantId }): Promise<ImpersonateResultDTO> => {
    const restaurant = await findRestaurantById(restaurantId);
    if (!restaurant || restaurant.deletedAt) {
      throw new Error("Restoran bulunamadı veya silinmiş.");
    }

    const cookieStore = await cookies();
    cookieStore.set("impersonated_restaurant_id", restaurantId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return {
      restaurantId,
      restaurantName: restaurant.name,
      redirectUrl: "/dashboard/home",
    };
  }
);

/**
 * Stop impersonating and return to SuperAdmin
 */
export const stopImpersonatingAction = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("impersonated_restaurant_id");
  revalidatePath("/dashboard");
  return {
    success: true,
    redirectUrl: "/admin/restaurants",
  };
};
