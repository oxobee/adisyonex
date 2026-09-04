import { notFound } from "next/navigation";

import type { UserRole } from "@/generated/prisma/client";
import { getUserAuthState } from "@/repositories/user.repository";

import { getCurrentUserId } from "./auth-helpers";

export interface AdminContext {
  readonly userId: string;
  readonly role: UserRole;
  readonly isSuperAdmin?: boolean;
  readonly email?: string | null;
  readonly name?: string | null;
}

export const AUTHORIZED_SUPER_ADMIN_EMAIL = "ugur@oxonom.com";
export const AUTHORIZED_SUPER_ADMIN_PHONE = "05550570368";

/**
 * Returns true strictly if the given user identity matches Uğur UĞURLU
 * (ugur@oxonom.com or 05550570368).
 */
export const isAuthorizedSuperAdminUser = (user: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}): boolean => {
  const email = (user.email ?? "").trim().toLowerCase();
  const phoneDigits = (user.phone ?? "").replace(/\D/g, "");
  return (
    email === AUTHORIZED_SUPER_ADMIN_EMAIL ||
    phoneDigits.endsWith("5550570368")
  );
};

export const isAdminRole = (role: UserRole): boolean =>
  role === "ADMIN" || role === "SUPER_ADMIN";

export const isSuperAdmin = (role: UserRole): boolean => role === "SUPER_ADMIN";

/**
 * DB-backed admin check (role read fresh on every call, so a stale session
 * can never keep admin access after a demotion/suspension/deletion).
 * Strictly guarantees only Uğur UĞURLU (ugur@oxonom.com / 05550570368) can possess SUPER_ADMIN privilege.
 */
export const getAdminContextOrNull = async (): Promise<AdminContext | null> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const state = await getUserAuthState(userId);
  if (!state || state.deletedAt || state.suspendedAt) {
    return null;
  }

  const isUgur = isAuthorizedSuperAdminUser(state);

  // Yalnızca Uğur UĞURLU süper admine erişebilir ve yetkisi SUPER_ADMIN'dir
  if (isUgur) {
    return {
      userId,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
      email: state.email,
      name: state.name,
    };
  }

  // Uğur UĞURLU haricindeki hiç kimse SUPER_ADMIN olamaz
  if (state.role === "SUPER_ADMIN" || !isAdminRole(state.role)) {
    return null;
  }

  return {
    userId,
    role: state.role,
    isSuperAdmin: false,
    email: state.email,
    name: state.name,
  };
};

/** Guard an admin RSC page/layout — 404s (no route leak) for non-admins. */
export const requireAdminPage = async (): Promise<AdminContext> => {
  const ctx = await getAdminContextOrNull();
  if (!ctx) {
    notFound();
  }
  return ctx;
};

export const requireSuperAdminPage = async (): Promise<AdminContext> => {
  const ctx = await getAdminContextOrNull();
  if (!ctx || !isSuperAdmin(ctx.role) || !ctx.isSuperAdmin) {
    notFound();
  }
  return ctx;
};

