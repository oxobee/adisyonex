"use server";

import { revalidatePath } from "next/cache";
import { withAdminValidation } from "@/actions/helpers";
import { assignLicenseSchema } from "@/lib/validators/license";
import { adminAssignLicense, getRestaurantLicenseInfo } from "@/services/license.service";

/** Super Admin: Assign or extend restaurant license and grant AI credits */
export const adminAssignLicenseAction = withAdminValidation(
  assignLicenseSchema,
  async (data) => {
    const result = await adminAssignLicense(data.restaurantId, {
      plan: data.plan,
      customDays: data.customDays,
      addAiCredits: data.addAiCredits,
      note: data.note,
    });

    revalidatePath("/admin/restaurants");
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return result;
  },
);

/** Fetch restaurant license info for admin modal */
export const getAdminRestaurantLicenseAction = withAdminValidation(
  assignLicenseSchema.pick({ restaurantId: true }),
  async (data) => {
    return getRestaurantLicenseInfo(data.restaurantId);
  },
);
