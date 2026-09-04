import { prisma } from "@/lib/prisma";

export interface CreateActivityLogInput {
  restaurantId: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  actorEmail?: string | null;
  category: "SİPARİŞ" | "MENÜ" | "MASA" | "AYARLAR" | "PERSONEL" | "KASA" | "BİLDİRİM" | string;
  action: string;
  details?: string | null;
}

export interface ActivityLogRow {
  id: string;
  restaurantId: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  actorEmail: string | null;
  category: string;
  action: string;
  details: string | null;
  createdAt: Date;
}

import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { getManagerById } from "@/services/user.service";

export interface CurrentActorInfo {
  id: string;
  name: string;
  role: string;
  email?: string | null;
}

export async function resolveCurrentActor(activeStaffId?: string | null): Promise<CurrentActorInfo> {
  try {
    const staff = await getStaffContextOrNull().catch(() => null);
    const currentUserId = await getCurrentUserId().catch(() => null);

    // 1. If explicit activeStaffId is passed or staff session exists
    const targetStaffId = activeStaffId || staff?.staffId;
    if (targetStaffId) {
      const target = await prisma.staff.findUnique({
        where: { id: targetStaffId },
        select: { id: true, name: true, role: true, jobTitle: true, email: true },
      });
      if (target) {
        return {
          id: target.id,
          name: target.name,
          role: target.jobTitle || target.role,
          email: target.email,
        };
      }
    }

    // 2. Manager / User
    if (currentUserId) {
      const u = await getManagerById(currentUserId).catch(() => null);
      if (u) {
        return {
          id: u.id,
          name: u.name || "Yönetici",
          role: u.role === "SUPER_ADMIN" ? "Süper Yönetici" : "Yönetici",
          email: u.email,
        };
      }
    }

    return {
      id: "system",
      name: "Sistem Kullanıcısı",
      role: "YÖNETİCİ",
    };
  } catch {
    return {
      id: "system",
      name: "Sistem Kullanıcısı",
      role: "YÖNETİCİ",
    };
  }
}

/**
 * Records a categorized activity log for system events.
 * Logs every action (create, update, delete, status change) with full actor and timestamp details.
 */
export const recordActivityLog = async (input: CreateActivityLogInput) => {
  if (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST)) {
    return null;
  }
  try {
    return await prisma.systemActivityLog.create({
      data: {
        restaurantId: input.restaurantId,
        actorId: input.actorId ?? null,
        actorName: input.actorName || "Kullanıcı",
        actorRole: input.actorRole || "PERSONEL",
        actorEmail: input.actorEmail ?? null,
        category: input.category,
        action: input.action,
        details: input.details ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to record system activity log:", err);
    return null;
  }
};

/**
 * Convenience logger that automatically resolves the current acting user/staff if not provided.
 */
export async function logActivity(input: {
  restaurantId: string;
  category: "SİPARİŞ" | "MENÜ" | "MASA" | "AYARLAR" | "PERSONEL" | "KASA" | "STOK" | "Z RAPORU" | string;
  action: string;
  details?: string | null;
  actor?: { id?: string | null; name?: string | null; role?: string | null; email?: string | null } | null;
}) {
  if (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST)) {
    return null;
  }
  try {
    let actor = input.actor;
    if (!actor || !actor.name) {
      actor = await resolveCurrentActor();
    }
    return await recordActivityLog({
      restaurantId: input.restaurantId,
      actorId: actor.id ?? null,
      actorName: actor.name || "Kullanıcı",
      actorRole: actor.role || "PERSONEL",
      actorEmail: actor.email ?? null,
      category: input.category,
      action: input.action,
      details: input.details ?? null,
    });
  } catch (err) {
    console.error("logActivity error:", err);
    return null;
  }
}

/**
 * Fetches recent activity logs for a restaurant ordered by latest first.
 */
export const getRecentActivityLogs = async (
  restaurantId: string,
  limit = 80,
): Promise<ActivityLogRow[]> => {
  return await prisma.systemActivityLog.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};
