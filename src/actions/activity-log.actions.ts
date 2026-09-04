"use server";

import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffSession } from "@/lib/staff-session";
import { getRecentActivityLogs, type ActivityLogRow } from "@/services/activity-log.service";
import { findRestaurantById } from "@/repositories/restaurant.repository";

export interface SerializedActivityLog {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  actorEmail: string | null;
  category: string;
  action: string;
  details: string | null;
  createdAt: string;
  timeFormatted: string;
  dateFormatted: string;
}

export async function getActivityLogsAction(): Promise<{
  success: boolean;
  data?: SerializedActivityLog[];
  error?: string;
}> {
  try {
    let restaurantId: string | null = null;

    // Try manager/owner context first
    const mgr = await getManagerContextOrNull();
    if (mgr) {
      restaurantId = mgr.restaurantId;
    } else {
      // Try staff session
      const staffSession = await getStaffSession();
      if (staffSession) {
        restaurantId = staffSession.restaurantId;
      }
    }

    if (!restaurantId) {
      return { success: false, error: "Oturum bulunamadı veya yetkisiz istek." };
    }

    const logs = await getRecentActivityLogs(restaurantId, 100);

    const serialized: SerializedActivityLog[] = logs.map((log) => {
      const d = new Date(log.createdAt);
      return {
        id: log.id,
        actorId: log.actorId,
        actorName: log.actorName,
        actorRole: log.actorRole,
        actorEmail: log.actorEmail,
        category: log.category,
        action: log.action,
        details: log.details,
        createdAt: d.toISOString(),
        timeFormatted: d.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        dateFormatted: d.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      };
    });

    return { success: true, data: serialized };
  } catch (err: any) {
    return { success: false, error: err.message || "Loglar yüklenemedi." };
  }
}
