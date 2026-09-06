import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listRestaurantStaffRoles,
  createStaffRole,
  deleteStaffRole,
  listRestaurantZones,
  createRestaurantZone,
  deleteRestaurantZone,
} from "./zone-and-role.service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    restaurantStaffRole: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    restaurantZone: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    staff: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

describe("zone-and-role.service", () => {
  const restaurantId = "res_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Staff Roles", () => {
    it("lists roles and creates defaults if none exist", async () => {
      vi.mocked(prisma.restaurantStaffRole.count).mockResolvedValue(0);
      vi.mocked(prisma.restaurantStaffRole.findMany).mockResolvedValue([
        {
          id: "r1",
          restaurantId,
          name: "Aşçı",
          description: "Mutfak",
          isDefault: false,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const roles = await listRestaurantStaffRoles(restaurantId);
      expect(prisma.restaurantStaffRole.count).toHaveBeenCalledWith({
        where: { restaurantId },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(roles).toHaveLength(1);
      expect(roles[0].name).toBe("Aşçı");
    });

    it("creates a new staff role", async () => {
      vi.mocked(prisma.restaurantStaffRole.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.restaurantStaffRole.create).mockResolvedValue({
        id: "r_new",
        restaurantId,
        name: "Pastacı",
        description: "Tatlı hazırlığı",
        isDefault: false,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const role = await createStaffRole(restaurantId, {
        name: "Pastacı",
        description: "Tatlı hazırlığı",
      });

      expect(role.name).toBe("Pastacı");
      expect(prisma.restaurantStaffRole.create).toHaveBeenCalled();
    });

    it("prevents deleting default 'Diğer' role", async () => {
      vi.mocked(prisma.restaurantStaffRole.findUnique).mockResolvedValue({
        id: "r_diger",
        restaurantId,
        name: "Diğer",
        description: null,
        isDefault: true,
        sortOrder: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(deleteStaffRole(restaurantId, "r_diger")).rejects.toThrow(
        "Varsayılan 'Diğer' rolü silinemez."
      );
    });

    it("reassigns staff to 'Diğer' when a role is deleted", async () => {
      vi.mocked(prisma.restaurantStaffRole.findUnique).mockResolvedValue({
        id: "r_chef",
        restaurantId,
        name: "Aşçı",
        description: null,
        isDefault: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.restaurantStaffRole.findFirst).mockResolvedValue({
        id: "r_diger_default",
        restaurantId,
        name: "Diğer",
        description: null,
        isDefault: true,
        sortOrder: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.staff.findMany).mockResolvedValue([
        { id: "staff_1" },
        { id: "staff_2" },
      ] as any);

      const res = await deleteStaffRole(restaurantId, "r_chef");

      expect(prisma.staff.updateMany).toHaveBeenCalledWith({
        where: { restaurantId, customRoleId: "r_chef" },
        data: { customRoleId: "r_diger_default" },
      });
      expect(prisma.restaurantStaffRole.delete).toHaveBeenCalledWith({
        where: { id: "r_chef" },
      });
      expect(res.reassignedStaffCount).toBe(2);
    });
  });

  describe("Restaurant Zones", () => {
    it("creates a new zone with printer configuration", async () => {
      vi.mocked(prisma.restaurantZone.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.restaurantZone.create).mockResolvedValue({
        id: "z_bar",
        restaurantId,
        name: "Bar",
        code: "BAR",
        description: "İçecek hazırlık",
        color: "#8B5CF6",
        printerIp: "192.168.1.150",
        printerPort: 9100,
        printerModel: "Epson TM-T20",
        isDefault: false,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const zone = await createRestaurantZone(restaurantId, {
        name: "Bar",
        code: "BAR",
        color: "#8B5CF6",
        printerIp: "192.168.1.150",
        printerPort: 9100,
        printerModel: "Epson TM-T20",
      });

      expect(zone.name).toBe("Bar");
      expect(zone.printerIp).toBe("192.168.1.150");
      expect(zone.printerPort).toBe(9100);
    });

    it("prevents deleting default 'Genel' zone", async () => {
      vi.mocked(prisma.restaurantZone.findUnique).mockResolvedValue({
        id: "z_genel",
        restaurantId,
        name: "Genel",
        code: "GENERAL",
        description: null,
        color: "#6B7280",
        printerIp: null,
        printerPort: null,
        printerModel: null,
        isDefault: true,
        sortOrder: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(deleteRestaurantZone(restaurantId, "z_genel")).rejects.toThrow(
        "Varsayılan 'Genel' bölgesi silinemez."
      );
    });

    it("reassigns staff to 'Genel' when a zone is deleted", async () => {
      vi.mocked(prisma.restaurantZone.findUnique).mockResolvedValue({
        id: "z_mutfak",
        restaurantId,
        name: "Mutfak",
        code: "KITCHEN",
        description: null,
        color: "#EF4444",
        printerIp: null,
        printerPort: null,
        printerModel: null,
        isDefault: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.restaurantZone.findFirst).mockResolvedValue({
        id: "z_genel_default",
        restaurantId,
        name: "Genel",
        code: "GENERAL",
        description: null,
        color: "#6B7280",
        printerIp: null,
        printerPort: null,
        printerModel: null,
        isDefault: true,
        sortOrder: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.staff.findMany).mockResolvedValue([
        { id: "staff_1" },
      ] as any);

      const res = await deleteRestaurantZone(restaurantId, "z_mutfak");

      expect(prisma.staff.updateMany).toHaveBeenCalledWith({
        where: { restaurantId, zoneId: "z_mutfak" },
        data: { zoneId: "z_genel_default" },
      });
      expect(prisma.restaurantZone.delete).toHaveBeenCalledWith({
        where: { id: "z_mutfak" },
      });
      expect(res.reassignedStaffCount).toBe(1);
    });
  });
});
