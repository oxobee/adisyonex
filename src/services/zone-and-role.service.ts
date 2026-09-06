import { prisma } from "@/lib/prisma";
import type { RestaurantStaffRoleDTO, RestaurantZoneDTO } from "@/types/staff";

export const DEFAULT_ROLES = [
  { name: "Aşçı", description: "Mutfak yemek ve sipariş hazırlığı", isDefault: false, sortOrder: 1 },
  { name: "Garson", description: "Masa servisi ve sipariş alma", isDefault: false, sortOrder: 2 },
  { name: "Kasiyer", description: "Ödeme alma ve kasa yönetimi", isDefault: false, sortOrder: 3 },
  { name: "Barista", description: "Kahve ve içecek hazırlığı", isDefault: false, sortOrder: 4 },
  { name: "Mutfak Şefi", description: "Mutfak ve ekip koordinasyonu", isDefault: false, sortOrder: 5 },
  { name: "Komi", description: "Masa temizliği ve servis desteği", isDefault: false, sortOrder: 6 },
  { name: "Müdür", description: "İşletme ve personel yönetimi", isDefault: false, sortOrder: 7 },
  { name: "Diğer", description: "Genel ve diğer görevler", isDefault: true, sortOrder: 99 },
];

export const DEFAULT_ZONES = [
  { name: "Mutfak", code: "KITCHEN", color: "#EF4444", description: "Sıcak/soğuk mutfak üretim alanı", isDefault: false, sortOrder: 1 },
  { name: "Bar", code: "BAR", color: "#8B5CF6", description: "İçecek ve bar servis alanı", isDefault: false, sortOrder: 2 },
  { name: "Kasa", code: "CASHIER", color: "#10B981", description: "Ödeme ve adisyon karşılama noktası", isDefault: false, sortOrder: 3 },
  { name: "Salon", code: "HALL", color: "#3B82F6", description: "Ana müşteri oturma alanı", isDefault: false, sortOrder: 4 },
  { name: "Teras", code: "TERRACE", color: "#F59E0B", description: "Açık alan ve teras masaları", isDefault: false, sortOrder: 5 },
  { name: "Genel", code: "GENERAL", color: "#6B7280", description: "Tüm alanlar / genel çalışma bölgesi", isDefault: true, sortOrder: 99 },
];

/**
 * Ensures default roles exist for the given restaurant.
 */
export async function ensureDefaultStaffRoles(restaurantId: string): Promise<void> {
  const count = await prisma.restaurantStaffRole.count({
    where: { restaurantId },
  });

  if (count === 0) {
    await prisma.$transaction(
      DEFAULT_ROLES.map((r) =>
        prisma.restaurantStaffRole.upsert({
          where: { restaurantId_name: { restaurantId, name: r.name } },
          update: {},
          create: {
            restaurantId,
            name: r.name,
            description: r.description,
            isDefault: r.isDefault,
            sortOrder: r.sortOrder,
          },
        })
      )
    );
  }
}

/**
 * Ensures default zones exist for the given restaurant.
 */
export async function ensureDefaultZones(restaurantId: string): Promise<void> {
  const count = await prisma.restaurantZone.count({
    where: { restaurantId },
  });

  if (count === 0) {
    await prisma.$transaction(
      DEFAULT_ZONES.map((z) =>
        prisma.restaurantZone.upsert({
          where: { restaurantId_name: { restaurantId, name: z.name } },
          update: {},
          create: {
            restaurantId,
            name: z.name,
            code: z.code,
            color: z.color,
            description: z.description,
            isDefault: z.isDefault,
            sortOrder: z.sortOrder,
          },
        })
      )
    );
  }
}

/**
 * Lists all staff roles for a restaurant. Automatically seeds default roles if empty.
 */
export async function listRestaurantStaffRoles(
  restaurantId: string
): Promise<RestaurantStaffRoleDTO[]> {
  await ensureDefaultStaffRoles(restaurantId);

  const roles = await prisma.restaurantStaffRole.findMany({
    where: { restaurantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return roles.map((r) => ({
    id: r.id,
    restaurantId: r.restaurantId,
    name: r.name,
    description: r.description,
    isDefault: r.isDefault,
    sortOrder: r.sortOrder,
  }));
}

/**
 * Lists all zones for a restaurant. Automatically seeds default zones if empty.
 */
export async function listRestaurantZones(
  restaurantId: string
): Promise<RestaurantZoneDTO[]> {
  await ensureDefaultZones(restaurantId);

  const zones = await prisma.restaurantZone.findMany({
    where: { restaurantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return zones.map((z) => ({
    id: z.id,
    restaurantId: z.restaurantId,
    name: z.name,
    code: z.code,
    description: z.description,
    color: z.color,
    printerIp: z.printerIp,
    printerPort: z.printerPort,
    printerModel: z.printerModel,
    printerEnabled: z.printerEnabled ?? false,
    printerConnectionType: z.printerConnectionType || (z.printerIp ? "NETWORK" : "LOCAL_OS"),
    printerSystemName: z.printerSystemName,
    printerPaperWidth: z.printerPaperWidth ?? 80,
    printerAutoPrint: z.printerAutoPrint ?? false,
    isDefault: z.isDefault,
    sortOrder: z.sortOrder,
  }));
}

/**
 * Creates a new staff role for a restaurant.
 */
export async function createStaffRole(
  restaurantId: string,
  data: { name: string; description?: string | null }
): Promise<RestaurantStaffRoleDTO> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("Rol adı boş bırakılamaz.");
  }

  const existing = await prisma.restaurantStaffRole.findUnique({
    where: { restaurantId_name: { restaurantId, name: trimmedName } },
  });
  if (existing) {
    throw new Error(`'${trimmedName}' isimli bir sistem rolü zaten mevcut.`);
  }

  const role = await prisma.restaurantStaffRole.create({
    data: {
      restaurantId,
      name: trimmedName,
      description: data.description?.trim() || null,
      isDefault: false,
    },
  });

  return {
    id: role.id,
    restaurantId: role.restaurantId,
    name: role.name,
    description: role.description,
    isDefault: role.isDefault,
    sortOrder: role.sortOrder,
  };
}

/**
 * Updates a staff role.
 */
export async function updateStaffRole(
  restaurantId: string,
  roleId: string,
  data: { name: string; description?: string | null }
): Promise<RestaurantStaffRoleDTO> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("Rol adı boş bırakılamaz.");
  }

  const role = await prisma.restaurantStaffRole.findUnique({
    where: { id: roleId },
  });
  if (!role || role.restaurantId !== restaurantId) {
    throw new Error("Sistem rolü bulunamadı.");
  }

  // Check unique name clash
  if (trimmedName.toLowerCase() !== role.name.toLowerCase()) {
    const clash = await prisma.restaurantStaffRole.findUnique({
      where: { restaurantId_name: { restaurantId, name: trimmedName } },
    });
    if (clash && clash.id !== roleId) {
      throw new Error(`'${trimmedName}' isimli bir sistem rolü zaten mevcut.`);
    }
  }

  const updated = await prisma.restaurantStaffRole.update({
    where: { id: roleId },
    data: {
      name: trimmedName,
      description: data.description?.trim() || null,
    },
  });

  return {
    id: updated.id,
    restaurantId: updated.restaurantId,
    name: updated.name,
    description: updated.description,
    isDefault: updated.isDefault,
    sortOrder: updated.sortOrder,
  };
}

/**
 * Deletes a staff role.
 * Automatically reassigns any staff members assigned to this role to the default "Diğer" role.
 */
export async function deleteStaffRole(
  restaurantId: string,
  roleId: string
): Promise<{ reassignedStaffCount: number }> {
  const role = await prisma.restaurantStaffRole.findUnique({
    where: { id: roleId },
  });
  if (!role || role.restaurantId !== restaurantId) {
    throw new Error("Sistem rolü bulunamadı.");
  }

  if (role.isDefault || role.name.toLowerCase() === "diğer") {
    throw new Error("Varsayılan 'Diğer' rolü silinemez.");
  }

  // Find or create the default "Diğer" role
  let defaultRole = await prisma.restaurantStaffRole.findFirst({
    where: {
      restaurantId,
      OR: [{ isDefault: true }, { name: "Diğer" }],
    },
  });

  if (!defaultRole) {
    defaultRole = await prisma.restaurantStaffRole.create({
      data: {
        restaurantId,
        name: "Diğer",
        description: "Genel ve diğer görevler",
        isDefault: true,
        sortOrder: 99,
      },
    });
  }

  // Find and reassign staff
  const staffToReassign = await prisma.staff.findMany({
    where: { restaurantId, customRoleId: roleId },
    select: { id: true },
  });

  if (staffToReassign.length > 0) {
    await prisma.staff.updateMany({
      where: { restaurantId, customRoleId: roleId },
      data: { customRoleId: defaultRole.id },
    });
  }

  // Delete the role
  await prisma.restaurantStaffRole.delete({
    where: { id: roleId },
  });

  return { reassignedStaffCount: staffToReassign.length };
}

/**
 * Creates a new restaurant zone.
 */
export async function createRestaurantZone(
  restaurantId: string,
  data: {
    name: string;
    code?: string | null;
    description?: string | null;
    color?: string | null;
    printerIp?: string | null;
    printerPort?: number | null;
    printerModel?: string | null;
    printerEnabled?: boolean;
    printerConnectionType?: string | null;
    printerSystemName?: string | null;
    printerPaperWidth?: number | null;
    printerAutoPrint?: boolean;
  }
): Promise<RestaurantZoneDTO> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("Bölge adı boş bırakılamaz.");
  }

  const existing = await prisma.restaurantZone.findUnique({
    where: { restaurantId_name: { restaurantId, name: trimmedName } },
  });
  if (existing) {
    throw new Error(`'${trimmedName}' isimli bir bölge zaten mevcut.`);
  }

  const zone = await prisma.restaurantZone.create({
    data: {
      restaurantId,
      name: trimmedName,
      code: data.code?.trim() || null,
      description: data.description?.trim() || null,
      color: data.color?.trim() || null,
      printerIp: data.printerIp?.trim() || null,
      printerPort: data.printerPort || null,
      printerModel: data.printerModel?.trim() || null,
      printerEnabled: data.printerEnabled ?? false,
      printerConnectionType: data.printerConnectionType || (data.printerIp ? "NETWORK" : "LOCAL_OS"),
      printerSystemName: data.printerSystemName?.trim() || null,
      printerPaperWidth: data.printerPaperWidth ?? 80,
      printerAutoPrint: data.printerAutoPrint ?? false,
      isDefault: false,
    },
  });

  return {
    id: zone.id,
    restaurantId: zone.restaurantId,
    name: zone.name,
    code: zone.code,
    description: zone.description,
    color: zone.color,
    printerIp: zone.printerIp,
    printerPort: zone.printerPort,
    printerModel: zone.printerModel,
    printerEnabled: zone.printerEnabled,
    printerConnectionType: zone.printerConnectionType,
    printerSystemName: zone.printerSystemName,
    printerPaperWidth: zone.printerPaperWidth,
    printerAutoPrint: zone.printerAutoPrint,
    isDefault: zone.isDefault,
    sortOrder: zone.sortOrder,
  };
}

/**
 * Updates a restaurant zone.
 */
export async function updateRestaurantZone(
  restaurantId: string,
  zoneId: string,
  data: {
    name: string;
    code?: string | null;
    description?: string | null;
    color?: string | null;
    printerIp?: string | null;
    printerPort?: number | null;
    printerModel?: string | null;
    printerEnabled?: boolean;
    printerConnectionType?: string | null;
    printerSystemName?: string | null;
    printerPaperWidth?: number | null;
    printerAutoPrint?: boolean;
  }
): Promise<RestaurantZoneDTO> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("Bölge adı boş bırakılamaz.");
  }

  const zone = await prisma.restaurantZone.findUnique({
    where: { id: zoneId },
  });
  if (!zone || zone.restaurantId !== restaurantId) {
    throw new Error("Bölge bulunamadı.");
  }

  if (trimmedName.toLowerCase() !== zone.name.toLowerCase()) {
    const clash = await prisma.restaurantZone.findUnique({
      where: { restaurantId_name: { restaurantId, name: trimmedName } },
    });
    if (clash && clash.id !== zoneId) {
      throw new Error(`'${trimmedName}' isimli bir bölge zaten mevcut.`);
    }
  }

  const updated = await prisma.restaurantZone.update({
    where: { id: zoneId },
    data: {
      name: trimmedName,
      code: data.code?.trim() || null,
      description: data.description?.trim() || null,
      color: data.color?.trim() || null,
      printerIp: data.printerIp?.trim() || null,
      printerPort: data.printerPort || null,
      printerModel: data.printerModel?.trim() || null,
      printerEnabled: data.printerEnabled !== undefined ? data.printerEnabled : zone.printerEnabled,
      printerConnectionType: data.printerConnectionType !== undefined
        ? data.printerConnectionType
        : (data.printerIp ? "NETWORK" : zone.printerConnectionType),
      printerSystemName: data.printerSystemName !== undefined ? data.printerSystemName?.trim() || null : zone.printerSystemName,
      printerPaperWidth: data.printerPaperWidth !== undefined ? data.printerPaperWidth : zone.printerPaperWidth,
      printerAutoPrint: data.printerAutoPrint !== undefined ? data.printerAutoPrint : zone.printerAutoPrint,
    },
  });

  return {
    id: updated.id,
    restaurantId: updated.restaurantId,
    name: updated.name,
    code: updated.code,
    description: updated.description,
    color: updated.color,
    printerIp: updated.printerIp,
    printerPort: updated.printerPort,
    printerModel: updated.printerModel,
    printerEnabled: updated.printerEnabled,
    printerConnectionType: updated.printerConnectionType,
    printerSystemName: updated.printerSystemName,
    printerPaperWidth: updated.printerPaperWidth,
    printerAutoPrint: updated.printerAutoPrint,
    isDefault: updated.isDefault,
    sortOrder: updated.sortOrder,
  };
}

/**
 * Deletes a restaurant zone.
 * Automatically reassigns any staff members assigned to this zone to the default "Genel" zone.
 */
export async function deleteRestaurantZone(
  restaurantId: string,
  zoneId: string
): Promise<{ reassignedStaffCount: number }> {
  const zone = await prisma.restaurantZone.findUnique({
    where: { id: zoneId },
  });
  if (!zone || zone.restaurantId !== restaurantId) {
    throw new Error("Bölge bulunamadı.");
  }

  if (zone.isDefault || zone.name.toLowerCase() === "genel") {
    throw new Error("Varsayılan 'Genel' bölgesi silinemez.");
  }

  // Find or create default "Genel" zone
  let defaultZone = await prisma.restaurantZone.findFirst({
    where: {
      restaurantId,
      OR: [{ isDefault: true }, { name: "Genel" }],
    },
  });

  if (!defaultZone) {
    defaultZone = await prisma.restaurantZone.create({
      data: {
        restaurantId,
        name: "Genel",
        code: "GENERAL",
        color: "#6B7280",
        description: "Tüm alanlar / genel çalışma bölgesi",
        isDefault: true,
        sortOrder: 99,
      },
    });
  }

  // Find and reassign staff
  const staffToReassign = await prisma.staff.findMany({
    where: { restaurantId, zoneId },
    select: { id: true },
  });

  if (staffToReassign.length > 0) {
    await prisma.staff.updateMany({
      where: { restaurantId, zoneId },
      data: { zoneId: defaultZone.id },
    });
  }

  // Delete the zone
  await prisma.restaurantZone.delete({
    where: { id: zoneId },
  });

  return { reassignedStaffCount: staffToReassign.length };
}
