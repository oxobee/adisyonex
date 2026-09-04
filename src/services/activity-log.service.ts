import { prisma } from "@/lib/prisma";
import { AUTHORIZED_SUPER_ADMIN_EMAIL } from "@/lib/admin-auth";

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

/**
 * Records a categorized activity log for system events.
 * Strictly skips logging if the actor is Super Admin (Uğur UĞURLU).
 */
export const recordActivityLog = async (input: CreateActivityLogInput) => {
  try {
    const email = (input.actorEmail ?? "").trim().toLowerCase();
    const role = (input.actorRole ?? "").toUpperCase();
    const name = (input.actorName ?? "").toLowerCase();

    // Sadece superadmin'in yaptığı işlemler loglanmasın
    if (
      email === AUTHORIZED_SUPER_ADMIN_EMAIL ||
      role === "SUPER_ADMIN" ||
      name.includes("uğur uğurlu") ||
      name.includes("ugur ugurlu")
    ) {
      return null;
    }

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
