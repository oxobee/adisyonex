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
import { hashStaffPin } from "@/lib/staff-pin";
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

export async function switchStaffAccountAction(data: {
  staffId: string;
  pin: string;
}): Promise<ActionResult<void>> {
  try {
    const pin = data.pin.trim();
    if (!pin) {
      return failure("Lütfen PIN şifrenizi girin");
    }

    const staff = await prisma.staff.findUnique({
      where: { id: data.staffId },
    });
    if (staff) {
      if (staff.deletedAt || staff.status !== "ACTIVE") {
        return failure("Personel hesabı aktif değil");
      }
      if (staff.loginLockedUntil && staff.loginLockedUntil.getTime() > Date.now()) {
        return failure("Hesap geçici olarak kilitlenmiştir, lütfen bekleyin");
      }
      if (!staff.pinHash) {
        return failure("Bu personel için henüz PIN kodu belirlenmemiş");
      }

      if (hashStaffPin(pin, staff.restaurantId) !== staff.pinHash) {
        return failure("Hatalı PIN kodu / şifre girdiniz");
      }

      // Logout existing session and switch to target staff
      await destroyStaffSession();
      await createStaffSession({
        staffId: staff.id,
        restaurantId: staff.restaurantId,
        role: staff.role,
      });

      const { recordActivityLog } = await import("@/services/activity-log.service");
      recordActivityLog({
        restaurantId: staff.restaurantId,
        actorId: staff.id,
        actorName: staff.name,
        actorRole: staff.role,
        actorEmail: staff.email,
        category: "PERSONEL",
        action: "Personel Hesabına Geçiş Yapıldı",
        details: `${staff.name} (${staff.jobTitle || staff.role}) terminal oturumuna giriş yaptı.`,
      }).catch(() => {});

      return success(undefined);
    }

    const user = await prisma.user.findUnique({
      where: { id: data.staffId },
      include: {
        ownedRestaurants: { select: { id: true, screenLockPin: true } },
      },
    });
    if (user) {
      const validPin = user.ownedRestaurants[0]?.screenLockPin || "0000";
      if (pin !== validPin) {
        return failure("Hatalı PIN kodu / şifre girdiniz");
      }
      await destroyStaffSession();

      const restId = user.ownedRestaurants[0]?.id;
      if (restId) {
        const { recordActivityLog } = await import("@/services/activity-log.service");
        recordActivityLog({
          restaurantId: restId,
          actorId: user.id,
          actorName: user.name || "Yönetici",
          actorRole: "YÖNETİCİ",
          actorEmail: user.email,
          category: "PERSONEL",
          action: "Yönetici Hesabına Geçiş Yapıldı",
          details: `${user.name || 'Yönetici'} PIN ile yönetici moduna geçiş yaptı.`,
        }).catch(() => {});
      }

      return success(undefined);
    }

    return failure("Personel kaydı bulunamadı");
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

      const { logActivity } = await import("@/services/activity-log.service");
      await logActivity({
        restaurantId: staff.restaurantId,
        actor: { id: staff.id, name: staff.name, role: staff.jobTitle || staff.role },
        category: "PERSONEL",
        action: "Personel Kendi Profilini Güncelledi",
        details: `${staff.name} profil iletişim ve kişisel bilgilerini güncelledi.`,
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

export interface TerminalStaffOption {
  id: string;
  name: string;
  role: string;
  jobTitle: string | null;
  employeeCode: string;
  photoUrl: string | null;
}

export async function getRestaurantStaffListForTerminalAction(): Promise<
  ActionResult<TerminalStaffOption[]>
> {
  try {
    const managerCtx = await getManagerContextOrNull();
    const staffCtx = await getStaffContextOrNull();
    const restaurantId = staffCtx?.restaurantId || managerCtx?.restaurantId;
    if (!restaurantId) {
      return failure("Restoran oturumu bulunamadı");
    }

    const staffList = await prisma.staff.findMany({
      where: {
        restaurantId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        role: true,
        jobTitle: true,
        employeeCode: true,
        photoUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return success(staffList);
  } catch (e) {
    return failure(e instanceof Error ? e.message : "Personel listesi alınamadı");
  }
}

