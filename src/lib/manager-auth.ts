import { findFirstRestaurantByOwner } from "@/repositories/restaurant.repository";
import { getCurrentUserId } from "./auth-helpers";
import { getStaffContextOrNull } from "./staff-auth";

export interface ManagerContext {
  readonly userId: string;
  readonly restaurantId: string;
}

/**
 * Resolve the active restaurant context.
 * Checks the signed-in manager session first, then falls back to staff session.
 * This allows all staff devices to run dashboard screens & actions concurrently!
 */
export const getManagerContextOrNull =
  async (): Promise<ManagerContext | null> => {
    const userId = await getCurrentUserId();
    if (userId) {
      const restaurant = await findFirstRestaurantByOwner(userId);
      if (restaurant) {
        return { userId, restaurantId: restaurant.id };
      }
    }
    const staff = await getStaffContextOrNull();
    if (staff) {
      return { userId: staff.staffId, restaurantId: staff.restaurantId };
    }
    return null;
  };
