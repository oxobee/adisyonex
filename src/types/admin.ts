import type { UserRole } from "@/generated/prisma/client";

export type AdminUserStatus = "active" | "suspended" | "deleted";

export interface AdminUserListItemDTO {
  readonly id: string;
  readonly name: string | null;
  readonly phone: string;
  readonly email: string | null;
  readonly role: UserRole;
  readonly status: AdminUserStatus;
  readonly restaurantCount: number;
  readonly createdAt: string;
}

export interface RestaurantListItemDTO {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly username?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly city: string | null;
  readonly country: string;
  readonly addressLine1?: string | null;
  readonly isActive: boolean;
  readonly ownerName: string | null;
  readonly ownerPhone: string;
  readonly onboardedAt: string;
  readonly licensePlan?: "TRIAL" | "MONTHLY" | "YEARLY" | "LIFETIME";
  readonly licenseExpiresAt?: string | null;
  readonly licenseDaysRemaining?: number;
  readonly licenseStatus?: "ACTIVE" | "EXPIRED" | "GRACE_PERIOD" | "SUSPENDED";
  readonly aiBalance?: number;
  readonly salesRepId?: string | null;
  readonly salesRepName?: string | null;
}
