"use server";

import { z } from "zod";
import { withManagerValidation } from "@/actions/helpers";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { failure, success, type ActionResult } from "@/types";
import {
  listRestaurantStaffRoles,
  listRestaurantZones,
  createStaffRole,
  updateStaffRole,
  deleteStaffRole,
  createRestaurantZone,
  updateRestaurantZone,
  deleteRestaurantZone,
} from "@/services/zone-and-role.service";
import { logActivity } from "@/services/activity-log.service";
import type { RestaurantStaffRoleDTO, RestaurantZoneDTO } from "@/types/staff";

const idSchema = z.string().trim().min(1);

const roleInputSchema = z.object({
  name: z.string().trim().min(1, "Rol adı gereklidir").max(60),
  description: z.string().trim().max(255).optional().nullable(),
});

const updateRoleInputSchema = roleInputSchema.extend({
  id: idSchema,
});

const zoneInputSchema = z.object({
  name: z.string().trim().min(1, "Bölge adı gereklidir").max(60),
  code: z.string().trim().max(30).optional().nullable(),
  description: z.string().trim().max(255).optional().nullable(),
  color: z.string().trim().max(30).optional().nullable(),
  printerIp: z.string().trim().max(45).optional().nullable(),
  printerPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  printerModel: z.string().trim().max(100).optional().nullable(),
  printerEnabled: z.boolean().optional(),
  printerConnectionType: z.enum(["LOCAL_OS", "NETWORK"]).optional().nullable(),
  printerSystemName: z.string().trim().max(100).optional().nullable(),
  printerPaperWidth: z.coerce.number().int().optional().nullable(),
  printerAutoPrint: z.boolean().optional(),
});

const updateZoneInputSchema = zoneInputSchema.extend({
  id: idSchema,
});

const deleteSchema = z.object({
  id: idSchema,
});

/**
 * Fetch both roles and zones for the active restaurant.
 * Works for both manager session and staff session.
 */
export async function getZonesAndRolesAction(): Promise<
  ActionResult<{ roles: RestaurantStaffRoleDTO[]; zones: RestaurantZoneDTO[] }>
> {
  const [mgrCtx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);
  const restaurantId = staffCtx?.restaurantId || mgrCtx?.restaurantId;
  if (!restaurantId) {
    return failure("NO_RESTAURANT");
  }

  try {
    const [roles, zones] = await Promise.all([
      listRestaurantStaffRoles(restaurantId),
      listRestaurantZones(restaurantId),
    ]);
    return success({ roles, zones });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Veriler alınamadı.");
  }
}

export const createStaffRoleAction = withManagerValidation(
  roleInputSchema,
  async (data, ctx) => {
    const role = await createStaffRole(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Sistem Rolü Eklendi",
      details: `Yeni sistem rolü oluşturuldu: '${data.name}'`,
    });
    return role;
  }
);

export const updateStaffRoleAction = withManagerValidation(
  updateRoleInputSchema,
  async (data, ctx) => {
    const role = await updateStaffRole(ctx.restaurantId, data.id, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Sistem Rolü Güncellendi",
      details: `Sistem rolü güncellendi: '${data.name}'`,
    });
    return role;
  }
);

export const deleteStaffRoleAction = withManagerValidation(
  deleteSchema,
  async (data, ctx) => {
    const res = await deleteStaffRole(ctx.restaurantId, data.id);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Sistem Rolü Silindi",
      details: `Sistem rolü silindi. (${res.reassignedStaffCount} personel 'Diğer' rolüne aktarıldı)`,
    });
    return res;
  }
);

export const createZoneAction = withManagerValidation(
  zoneInputSchema,
  async (data, ctx) => {
    const zone = await createRestaurantZone(ctx.restaurantId, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Bölge Eklendi",
      details: `Yeni çalışma bölgesi oluşturuldu: '${data.name}'`,
    });
    return zone;
  }
);

export const updateZoneAction = withManagerValidation(
  updateZoneInputSchema,
  async (data, ctx) => {
    const zone = await updateRestaurantZone(ctx.restaurantId, data.id, data);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Bölge Güncellendi",
      details: `Çalışma bölgesi güncellendi: '${data.name}'`,
    });
    return zone;
  }
);

export const deleteZoneAction = withManagerValidation(
  deleteSchema,
  async (data, ctx) => {
    const res = await deleteRestaurantZone(ctx.restaurantId, data.id);
    await logActivity({
      restaurantId: ctx.restaurantId,
      category: "PERSONEL",
      action: "Bölge Silindi",
      details: `Çalışma bölgesi silindi. (${res.reassignedStaffCount} personel 'Genel' bölgesine aktarıldı)`,
    });
    return res;
  }
);
