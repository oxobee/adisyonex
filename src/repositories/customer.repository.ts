import type { Customer, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface CustomerWriteData {
  restaurantId: string;
  name: string;
  phone: string;
  birthDate?: Date | null;
  notes?: string | null;
  source?: string;
  kvkkConsent?: boolean;
}

export const upsertCustomer = async (data: CustomerWriteData): Promise<Customer> => {
  let birthDay: number | null = null;
  let birthMonth: number | null = null;
  let birthYear: number | null = null;

  if (data.birthDate) {
    birthDay = data.birthDate.getUTCDate();
    birthMonth = data.birthDate.getUTCMonth() + 1;
    birthYear = data.birthDate.getUTCFullYear();
  }

  return prisma.customer.upsert({
    where: {
      restaurantId_phone: {
        restaurantId: data.restaurantId,
        phone: data.phone,
      },
    },
    create: {
      restaurantId: data.restaurantId,
      name: data.name,
      phone: data.phone,
      birthDate: data.birthDate ?? null,
      birthDay,
      birthMonth,
      birthYear,
      notes: data.notes ?? null,
      source: data.source ?? "QR_MENU",
      kvkkConsent: data.kvkkConsent ?? true,
      kvkkAcceptedAt: data.kvkkConsent ? new Date() : null,
    },
    update: {
      name: data.name,
      birthDate: data.birthDate !== undefined ? data.birthDate : undefined,
      birthDay: birthDay !== null ? birthDay : undefined,
      birthMonth: birthMonth !== null ? birthMonth : undefined,
      birthYear: birthYear !== null ? birthYear : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
      kvkkConsent: data.kvkkConsent !== undefined ? data.kvkkConsent : undefined,
      kvkkAcceptedAt: data.kvkkConsent ? new Date() : undefined,
      deletedAt: null,
    },
  });
};

export const findCustomerById = async (
  restaurantId: string,
  id: string,
): Promise<Customer | null> => {
  return prisma.customer.findFirst({
    where: { id, restaurantId, deletedAt: null },
  });
};

export const findCustomerByPhone = async (
  restaurantId: string,
  phone: string,
): Promise<Customer | null> => {
  return prisma.customer.findFirst({
    where: { restaurantId, phone, deletedAt: null },
  });
};

export const findCustomerWithOrders = async (
  restaurantId: string,
  identifier: { id?: string; phone?: string },
) => {
  return prisma.customer.findFirst({
    where: {
      restaurantId,
      deletedAt: null,
      ...(identifier.id ? { id: identifier.id } : {}),
      ...(identifier.phone ? { phone: identifier.phone } : {}),
    },
    include: {
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          table: true,
        },
      },
    },
  });
};

export const incrementCustomerStats = async (
  customerId: string,
  spendDelta: number,
) => {
  return prisma.customer.update({
    where: { id: customerId },
    data: {
      orderCount: { increment: 1 },
      totalSpent: { increment: spendDelta },
    },
  });
};

export const findCustomersPaginated = async (
  restaurantId: string,
  params: {
    search?: string;
    birthMonth?: number;
    page: number;
    pageSize: number;
  },
): Promise<{ items: Customer[]; total: number }> => {
  const where: Prisma.CustomerWhereInput = {
    restaurantId,
    deletedAt: null,
    ...(params.birthMonth ? { birthMonth: params.birthMonth } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { phone: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total };
};

export const deleteCustomer = async (
  restaurantId: string,
  id: string,
): Promise<Customer> => {
  return prisma.customer.update({
    where: { id, restaurantId },
    data: { deletedAt: new Date() },
  });
};
