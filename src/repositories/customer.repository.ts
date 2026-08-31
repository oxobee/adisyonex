import type { Customer, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface CustomerWriteData {
  restaurantId: string;
  name: string;
  phone: string;
  birthDate?: Date | null;
  notes?: string | null;
  source?: string;
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
    },
    update: {
      name: data.name,
      birthDate: data.birthDate !== undefined ? data.birthDate : undefined,
      birthDay: birthDay !== null ? birthDay : undefined,
      birthMonth: birthMonth !== null ? birthMonth : undefined,
      birthYear: birthYear !== null ? birthYear : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
      deletedAt: null,
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
