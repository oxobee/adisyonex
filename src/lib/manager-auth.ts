import { cache } from "react";
import { cookies } from "next/headers";
import { findFirstRestaurantByOwner, findRestaurantById } from "@/repositories/restaurant.repository";
import { getUserAuthState } from "@/repositories/user.repository";
import { isAuthorizedSuperAdminUser } from "./admin-auth";
import { getCurrentUserId } from "./auth-helpers";
import { getStaffContextOrNull } from "./staff-auth";

export interface ManagerContext {
  readonly userId: string;
  readonly restaurantId: string;
  readonly isImpersonating?: boolean;
  readonly impersonatedRestaurantName?: string;
}

/**
 * Returns the impersonated restaurant if the current user is a SuperAdmin and has an active impersonation cookie.
 */
export const getImpersonatedRestaurantOrNull = cache(
  async (): Promise<{ id: string; name: string } | null> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;
      const state = await getUserAuthState(userId);
      if (!state || (!isAuthorizedSuperAdminUser(state) && state.role !== "SUPER_ADMIN")) {
        return null;
      }
      const store = await cookies();
      const impId = store.get("impersonated_restaurant_id")?.value;
      if (!impId) return null;
      const res = await findRestaurantById(impId);
      if (!res || res.deletedAt) return null;
      return { id: res.id, name: res.name };
    } catch {
      return null;
    }
  },
);

/**
 * Resolve the active restaurant context.
 * Checks impersonation session first (for SuperAdmin), then signed-in manager session, then staff session.
 * Memoized per-request using React cache() for maximum performance.
 */
export const getManagerContextOrNull = cache(
  async (): Promise<ManagerContext | null> => {
    const userId = await getCurrentUserId();
    if (userId) {
      const imp = await getImpersonatedRestaurantOrNull();
      if (imp) {
        return {
          userId,
          restaurantId: imp.id,
          isImpersonating: true,
          impersonatedRestaurantName: imp.name,
        };
      }
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
  },
);
