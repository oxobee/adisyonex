import { Prisma } from "@/generated/prisma/client";
import type {
  EmploymentType,
  Gender,
  Staff,
  StaffRole,
  StaffStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface StaffWriteData {
  employeeCode: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  phone: string;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  dateOfBirth: Date | null;
  gender: Gender | null;
  joiningDate: Date | null;
  employmentType: EmploymentType | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  notes: string | null;
  jobTitle?: string | null;
  customRoleId?: string | null;
  zoneId?: string | null;
  allowedRoutes?: string[] | null;
}

const toPrismaData = (data: StaffWriteData, isUpdate = false) => {
  const { allowedRoutes, customRoleId, zoneId, ...rest } = data;
  return {
    ...rest,
    ...(customRoleId !== undefined
      ? customRoleId
        ? { customRole: { connect: { id: customRoleId } } }
        : isUpdate
        ? { customRole: { disconnect: true } }
        : {}
      : {}),
    ...(zoneId !== undefined
      ? zoneId
        ? { zone: { connect: { id: zoneId } } }
        : isUpdate
        ? { zone: { disconnect: true } }
        : {}
      : {}),
    ...(allowedRoutes !== undefined
      ? {
          allowedRoutes:
            allowedRoutes === null
              ? Prisma.DbNull
              : (allowedRoutes as Prisma.InputJsonValue),
        }
      : {}),
  };
};

export const createStaff = (
  restaurantId: string,
  data: StaffWriteData,
  pinHash: string,
): Promise<StaffWithRelations> =>
  prisma.staff.create({
    data: {
      restaurant: { connect: { id: restaurantId } },
      pinHash,
      ...toPrismaData(data, false),
    },
    include: { customRole: true, zone: true },
  }) as unknown as Promise<StaffWithRelations>;

export const updateStaff = (
  id: string,
  data: StaffWriteData
): Promise<StaffWithRelations> =>
  prisma.staff.update({
    where: { id },
    data: toPrismaData(data, true),
    include: { customRole: true, zone: true },
  }) as unknown as Promise<StaffWithRelations>;

export const reviveStaff = (
  id: string,
  data: StaffWriteData,
  pinHash: string,
): Promise<StaffWithRelations> =>
  prisma.staff.update({
    where: { id },
    data: { ...toPrismaData(data), pinHash, deletedAt: null },
    include: { customRole: true, zone: true },
  }) as unknown as Promise<StaffWithRelations>;

export const softDeleteStaff = (id: string): Promise<Staff> =>
  prisma.staff.update({ where: { id }, data: { deletedAt: new Date() } });

export const updateStaffPin = (id: string, pinHash: string): Promise<Staff> =>
  prisma.staff.update({ where: { id }, data: { pinHash } });

export const recordStaffLoginFailure = (
  id: string,
  data: { failedAttempts: number; lockedUntil: Date | null },
): Promise<Staff> =>
  prisma.staff.update({
    where: { id },
    data: {
      loginFailedAttempts: data.failedAttempts,
      loginLockedUntil: data.lockedUntil,
    },
  });

export const resetStaffLoginCounters = (id: string): Promise<Staff> =>
  prisma.staff.update({
    where: { id },
    data: { loginFailedAttempts: 0, loginLockedUntil: null },
  });

export const setStaffPhoto = (
  id: string,
  photoUrl: string | null,
): Promise<Staff> => prisma.staff.update({ where: { id }, data: { photoUrl } });

export const findStaffById = (id: string): Promise<Staff | null> =>
  prisma.staff.findUnique({ where: { id } });

export const findStaffByEmployeeCode = (
  restaurantId: string,
  employeeCode: string,
): Promise<Staff | null> =>
  prisma.staff.findUnique({
    where: { restaurantId_employeeCode: { restaurantId, employeeCode } },
  });

export type StaffWithRelations = Prisma.StaffGetPayload<{
  include: { customRole: true; zone: true };
}>;

export const findStaffByRestaurant = (
  restaurantId: string
): Promise<StaffWithRelations[]> =>
  prisma.staff.findMany({
    where: { restaurantId, deletedAt: null },
    include: { customRole: true, zone: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  }) as unknown as Promise<StaffWithRelations[]>;

/**
 * Find every active (non-deleted, ACTIVE status) staff row that matches the
 * given phone across all restaurants. Returns an array so callers can detect
 * the multi-restaurant case (a phone that owns staff rows in more than one
 * restaurant) and prompt the user to disambiguate.
 */
export const findActiveStaffByPhone = (phone: string): Promise<Staff[]> =>
  prisma.staff.findMany({
    where: { phone, deletedAt: null, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });
