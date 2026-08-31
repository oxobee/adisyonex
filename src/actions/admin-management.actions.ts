"use server";

import { revalidatePath } from "next/cache";

import { withAdminValidation } from "@/actions/helpers";
import {
  adminDeleteRestaurantSchema,
  adminDeleteUserSchema,
  adminToggleRestaurantActiveSchema,
  adminToggleSuspendUserSchema,
  adminUpdateRestaurantSchema,
  adminUpdateUserSchema,
} from "@/lib/validators/admin";
import {
  deleteAdminUser,
  toggleSuspendAdminUser,
  updateAdminUser,
} from "@/services/admin-user.service";
import {
  deleteAdminRestaurant,
  toggleAdminRestaurantActive,
  updateAdminRestaurant,
} from "@/services/restaurant.service";

export const updateAdminUserAction = withAdminValidation(
  adminUpdateUserSchema,
  async (data) => {
    const user = await updateAdminUser(data);
    revalidatePath("/admin/users");
    return user;
  },
);

export const toggleSuspendAdminUserAction = withAdminValidation(
  adminToggleSuspendUserSchema,
  async (data) => {
    const user = await toggleSuspendAdminUser(data.id);
    revalidatePath("/admin/users");
    return user;
  },
);

export const deleteAdminUserAction = withAdminValidation(
  adminDeleteUserSchema,
  async (data) => {
    const user = await deleteAdminUser(data.id);
    revalidatePath("/admin/users");
    return user;
  },
);

export const updateAdminRestaurantAction = withAdminValidation(
  adminUpdateRestaurantSchema,
  async (data) => {
    const res = await updateAdminRestaurant(data);
    revalidatePath("/admin/restaurants");
    return res;
  },
);

export const toggleAdminRestaurantActiveAction = withAdminValidation(
  adminToggleRestaurantActiveSchema,
  async (data) => {
    const res = await toggleAdminRestaurantActive(data.id);
    revalidatePath("/admin/restaurants");
    return res;
  },
);

export const deleteAdminRestaurantAction = withAdminValidation(
  adminDeleteRestaurantSchema,
  async (data) => {
    const res = await deleteAdminRestaurant(data.id);
    revalidatePath("/admin/restaurants");
    return res;
  },
);
