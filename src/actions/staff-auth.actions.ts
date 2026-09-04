"use server";

import { redirect } from "next/navigation";

import { withValidation } from "@/actions/helpers";
import { createStaffSession, destroyStaffSession } from "@/lib/staff-session";
import { staffLoginSchema } from "@/lib/validators/staff";
import { findRestaurantByUsername } from "@/repositories/restaurant.repository";
import {
  STAFF_LOGIN_INVALID,
  verifyStaffLogin,
} from "@/services/staff-auth.service";
import type { StaffRole } from "@/types/staff";

export const staffLoginAction = withValidation(
  staffLoginSchema,
  async (data): Promise<{ role: StaffRole; redirectUrl: string }> => {
    const restaurant = await findRestaurantByUsername(data.username);
    if (!restaurant || restaurant.deletedAt || !restaurant.isActive) {
      throw new Error(STAFF_LOGIN_INVALID);
    }
    const { staffId, role } = await verifyStaffLogin(
      restaurant.id,
      data.employeeCode,
      data.pin,
    );
    await createStaffSession({ staffId, restaurantId: restaurant.id, role });
    
    return { role, redirectUrl: "/dashboard/home" };
  },
);

export const staffLogoutAction = async (username: string): Promise<void> => {
  await destroyStaffSession();
  redirect(`/u/${username}/login`);
};

export const directStaffLogoutAction = async (): Promise<void> => {
  await destroyStaffSession();
  redirect("/personelgiris");
};

import { prisma } from "@/lib/prisma";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getStaffEffectiveRoutes } from "@/lib/staff";
import { failure, success, type ActionResult } from "@/types";

export async function addStaffAccountAction(data: {
  employeeCode: string;
  pin: string;
}): Promise<ActionResult<{
  id: string;
  name: string;
  role: string;
  jobTitle: string | null;
  employeeCode: string;
  allowedRoutes: readonly string[];
  photoUrl: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
}>> {
  try {
    const managerCtx = await getManagerContextOrNull();
    const staffCtx = await getStaffContextOrNull();
    const restaurantId = staffCtx?.restaurantId || managerCtx?.restaurantId;
    if (!restaurantId) {
      return failure("Restoran oturumu bulunamadı");
    }

    const { staffId, role } = await verifyStaffLogin(
      restaurantId,
      data.employeeCode,
      data.pin,
    );

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return failure("Personel bulunamadı");
    }

    const effectiveRoutes = getStaffEffectiveRoutes(staff.role, staff.allowedRoutes as string[] | null);

    return success({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      jobTitle: staff.jobTitle,
      employeeCode: staff.employeeCode,
      allowedRoutes: effectiveRoutes,
      photoUrl: staff.photoUrl,
      phone: staff.phone,
      email: staff.email,
      city: staff.city,
      state: staff.state,
    });
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Personel doğrulaması başarısız");
  }
}

export async function switchStaffAccountAction(staffId: string): Promise<ActionResult<void>> {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff || staff.deletedAt || staff.status !== "ACTIVE") {
      return failure("Personel hesabı aktif değil");
    }

    await createStaffSession({
      staffId: staff.id,
      restaurantId: staff.restaurantId,
      role: staff.role,
    });

    return success(undefined);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Hesap değiştirilemedi");
  }
}

export async function updateStaffSelfProfileAction(data: {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  photoUrl?: string | null;
}): Promise<ActionResult<void>> {
  try {
    // Check if Staff
    const staff = await prisma.staff.findUnique({ where: { id: data.id } });
    if (staff) {
      await prisma.staff.update({
        where: { id: data.id },
        data: {
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email?.trim() || null,
          city: data.city?.trim() || null,
          state: data.state?.trim() || null,
          photoUrl: data.photoUrl?.trim() || null,
        },
      });
      return success(undefined);
    }

    // Check User
    const user = await prisma.user.findUnique({ where: { id: data.id } });
    if (user) {
      await prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email?.trim() || null,
        },
      });
      return success(undefined);
    }

    return failure("Kullanıcı kaydı bulunamadı");
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Profil güncellenemedi");
  }
}
