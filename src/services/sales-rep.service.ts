import { prisma } from "@/lib/prisma";

export interface SalesRepDTO {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  photoUrl: string | null;
  notes: string | null;
  isActive: boolean;
  assignedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export async function listSalesReps(onlyActive = false): Promise<SalesRepDTO[]> {
  const rows = await prisma.salesRep.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    include: {
      _count: {
        select: { assignedRestaurants: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    title: r.title,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    photoUrl: r.photoUrl,
    notes: r.notes,
    isActive: r.isActive,
    assignedCount: r._count.assignedRestaurants,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getSalesRepById(id: string): Promise<SalesRepDTO | null> {
  const r = await prisma.salesRep.findUnique({
    where: { id },
    include: {
      _count: {
        select: { assignedRestaurants: true },
      },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    name: r.name,
    title: r.title,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    photoUrl: r.photoUrl,
    notes: r.notes,
    isActive: r.isActive,
    assignedCount: r._count.assignedRestaurants,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createSalesRep(data: {
  name: string;
  title?: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  isActive?: boolean;
}): Promise<SalesRepDTO> {
  const r = await prisma.salesRep.create({
    data: {
      name: data.name.trim(),
      title: data.title?.trim() || "Satış & Müşteri Temsilcisi",
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      whatsapp: data.whatsapp?.trim() || null,
      photoUrl: data.photoUrl || null,
      notes: data.notes?.trim() || null,
      isActive: data.isActive ?? true,
    },
  });

  return {
    id: r.id,
    name: r.name,
    title: r.title,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    photoUrl: r.photoUrl,
    notes: r.notes,
    isActive: r.isActive,
    assignedCount: 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function updateSalesRep(
  id: string,
  data: {
    name?: string;
    title?: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    photoUrl?: string | null;
    notes?: string | null;
    isActive?: boolean;
  },
): Promise<SalesRepDTO> {
  const r = await prisma.salesRep.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      title: data.title !== undefined ? data.title.trim() : undefined,
      email: data.email !== undefined ? data.email?.trim() || null : undefined,
      phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
      whatsapp: data.whatsapp !== undefined ? data.whatsapp?.trim() || null : undefined,
      photoUrl: data.photoUrl !== undefined ? data.photoUrl : undefined,
      notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
    include: {
      _count: {
        select: { assignedRestaurants: true },
      },
    },
  });

  return {
    id: r.id,
    name: r.name,
    title: r.title,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    photoUrl: r.photoUrl,
    notes: r.notes,
    isActive: r.isActive,
    assignedCount: r._count.assignedRestaurants,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function deleteSalesRep(id: string): Promise<void> {
  // Disconnect from restaurants first
  await prisma.restaurant.updateMany({
    where: { salesRepId: id },
    data: { salesRepId: null },
  });

  await prisma.salesRep.delete({
    where: { id },
  });
}

export async function assignSalesRepToRestaurant(
  restaurantId: string,
  salesRepId: string | null,
): Promise<void> {
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { salesRepId: salesRepId || null },
  });
}
