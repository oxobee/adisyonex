import { prisma } from "@/lib/prisma";
import type {
  Reservation,
  ReservationSource,
  ReservationStatus,
} from "@/generated/prisma/client";
import { normalizePhoneNumber } from "@/lib/phone";

export interface PreOrderItemDTO {
  readonly menuItemId?: string;
  readonly name: string;
  readonly quantity: number;
  readonly price: number;
  readonly notes?: string;
  readonly modifiers?: readonly string[];
}

export interface ReservationDTO {
  readonly id: string;
  readonly restaurantId: string;
  readonly tableId: string | null;
  readonly tableLabel: string | null;
  readonly customerId: string | null;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly customerEmail: string | null;
  readonly guestCount: number;
  readonly reservationTime: string;
  readonly status: ReservationStatus;
  readonly source: ReservationSource;
  readonly notes: string | null;
  readonly preOrderItems: readonly PreOrderItemDTO[] | null;
  readonly orderId: string | null;
  readonly createdAt: string;
}

export interface ReservationStatsDTO {
  readonly todayTotal: number;
  readonly upcomingCount: number;
  readonly seatedCount: number;
  readonly confirmedCount: number;
  readonly cancelledCount: number;
}

export interface CreateReservationInput {
  readonly tableId?: string | null;
  readonly customerId?: string | null;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly customerEmail?: string | null;
  readonly guestCount?: number;
  readonly reservationTime: string | Date;
  readonly source?: ReservationSource;
  readonly notes?: string | null;
  readonly preOrderItems?: readonly PreOrderItemDTO[] | null;
}

function mapReservationToDTO(
  r: Reservation & { table?: { label: string } | null }
): ReservationDTO {
  let preOrderItems: PreOrderItemDTO[] | null = null;
  if (Array.isArray(r.preOrderItems)) {
    preOrderItems = r.preOrderItems as unknown as PreOrderItemDTO[];
  }

  return {
    id: r.id,
    restaurantId: r.restaurantId,
    tableId: r.tableId,
    tableLabel: r.table?.label ?? null,
    customerId: r.customerId,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerEmail: r.customerEmail,
    guestCount: r.guestCount,
    reservationTime: r.reservationTime.toISOString(),
    status: r.status,
    source: r.source,
    notes: r.notes,
    preOrderItems,
    orderId: r.orderId,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function createReservation(
  restaurantId: string,
  input: CreateReservationInput
): Promise<ReservationDTO> {
  const normalizedPhone =
    normalizePhoneNumber(input.customerPhone) || input.customerPhone.trim();
  const resTime = new Date(input.reservationTime);

  // Link customer if exists or create/update
  let customerId = input.customerId || null;
  if (!customerId && normalizedPhone) {
    const existingCust = await prisma.customer.findFirst({
      where: { restaurantId, phone: normalizedPhone, deletedAt: null },
      select: { id: true },
    });
    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const newCust = await prisma.customer.create({
        data: {
          restaurantId,
          name: input.customerName.trim(),
          phone: normalizedPhone,
          source: input.source === "PHONE" ? "PHONE" : "POS",
          customerSource: "RESERVATION",
        },
        select: { id: true },
      });
      customerId = newCust.id;
    }
  }

  const reservation = await prisma.reservation.create({
    data: {
      restaurantId,
      tableId: input.tableId || null,
      customerId,
      customerName: input.customerName.trim(),
      customerPhone: normalizedPhone,
      customerEmail: input.customerEmail?.trim() || null,
      guestCount: Math.max(1, input.guestCount || 2),
      reservationTime: resTime,
      status: "CONFIRMED",
      source: input.source || "POS",
      notes: input.notes?.trim() || null,
      preOrderItems: input.preOrderItems ? (input.preOrderItems as unknown as object) : undefined,
    },
    include: {
      table: { select: { label: true } },
    },
  });

  return mapReservationToDTO(reservation);
}

export async function listReservations(
  restaurantId: string,
  filter?: {
    date?: string; // YYYY-MM-DD
    status?: ReservationStatus;
    tableId?: string;
    search?: string;
  }
): Promise<readonly ReservationDTO[]> {
  const where: Record<string, unknown> = {
    restaurantId,
    deletedAt: null,
  };

  if (filter?.status) {
    where.status = filter.status;
  }

  if (filter?.tableId) {
    where.tableId = filter.tableId;
  }

  if (filter?.date) {
    const start = new Date(`${filter.date}T00:00:00.000Z`);
    const end = new Date(`${filter.date}T23:59:59.999Z`);
    where.reservationTime = { gte: start, lte: end };
  }

  if (filter?.search) {
    const q = filter.search.trim();
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.reservation.findMany({
    where,
    include: {
      table: { select: { label: true } },
    },
    orderBy: {
      reservationTime: "asc",
    },
  });

  return rows.map(mapReservationToDTO);
}

export async function getReservationStats(
  restaurantId: string
): Promise<ReservationStatsDTO> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [todayTotal, upcomingCount, seatedCount, confirmedCount, cancelledCount] =
    await Promise.all([
      // Today's total
      prisma.reservation.count({
        where: {
          restaurantId,
          deletedAt: null,
          reservationTime: { gte: startOfDay, lte: endOfDay },
        },
      }),
      // Upcoming from now onwards (confirmed or pending)
      prisma.reservation.count({
        where: {
          restaurantId,
          deletedAt: null,
          reservationTime: { gte: now },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
      }),
      // Seated today
      prisma.reservation.count({
        where: {
          restaurantId,
          deletedAt: null,
          reservationTime: { gte: startOfDay, lte: endOfDay },
          status: "SEATED",
        },
      }),
      // Confirmed today
      prisma.reservation.count({
        where: {
          restaurantId,
          deletedAt: null,
          reservationTime: { gte: startOfDay, lte: endOfDay },
          status: "CONFIRMED",
        },
      }),
      // Cancelled or No-show today
      prisma.reservation.count({
        where: {
          restaurantId,
          deletedAt: null,
          reservationTime: { gte: startOfDay, lte: endOfDay },
          status: { in: ["CANCELLED", "NO_SHOW"] },
        },
      }),
    ]);

  return {
    todayTotal,
    upcomingCount,
    seatedCount,
    confirmedCount,
    cancelledCount,
  };
}

export async function updateReservationStatus(
  restaurantId: string,
  reservationId: string,
  status: ReservationStatus
): Promise<ReservationDTO | null> {
  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, restaurantId, deletedAt: null },
  });
  if (!existing) return null;

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
    include: {
      table: { select: { label: true } },
    },
  });

  return mapReservationToDTO(updated);
}

export async function seatReservationAndOpenOrder(
  restaurantId: string,
  reservationId: string,
  staffId?: string
): Promise<{ success: boolean; reservation: ReservationDTO; orderId?: string; message?: string }> {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, restaurantId, deletedAt: null },
    include: { table: true },
  });

  if (!reservation) {
    return {
      success: false,
      reservation: {} as ReservationDTO,
      message: "Rezervasyon bulunamadı.",
    };
  }

  // Update reservation status to SEATED
  const updatedRes = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "SEATED" },
    include: { table: { select: { label: true } } },
  });

  // If table is assigned, check if there's an open order on that table
  let orderId = reservation.orderId || undefined;

  if (reservation.tableId) {
    const openOrder = await prisma.order.findFirst({
      where: {
        restaurantId,
        tableId: reservation.tableId,
        status: "OPEN",
      },
    });

    if (openOrder) {
      orderId = openOrder.id;
    } else {
      // Find latest orderNumber
      const lastOrder = await prisma.order.findFirst({
        where: { restaurantId },
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const nextOrderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

      // Extract pre-order items if any
      const preItems = Array.isArray(reservation.preOrderItems)
        ? (reservation.preOrderItems as unknown as PreOrderItemDTO[])
        : [];

      let subtotal = 0;
      const orderItemsCreate = preItems.map((item) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        subtotal += itemTotal;
        return {
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          itemType: "SERVED" as const,
          state: "UNSENT" as const,
          notes: item.notes || null,
        };
      });

      const newOrder = await prisma.order.create({
        data: {
          restaurantId,
          orderNumber: nextOrderNumber,
          idempotencyKey: `res_${reservation.id}_${Date.now()}`,
          orderType: "DINE_IN",
          status: "OPEN",
          tableId: reservation.tableId,
          tableLabel: reservation.table?.label ?? null,
          customerId: reservation.customerId,
          customerName: reservation.customerName,
          customerPhone: reservation.customerPhone,
          placedByStaffId: staffId || null,
          subtotal,
          grandTotal: subtotal,
          items: orderItemsCreate.length > 0 ? { create: orderItemsCreate } : undefined,
        },
      });

      orderId = newOrder.id;
    }

    // Link orderId to reservation
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { orderId },
    });
  }

  return {
    success: true,
    reservation: mapReservationToDTO(updatedRes),
    orderId,
  };
}

export async function cancelReservation(
  restaurantId: string,
  reservationId: string,
  reason?: string
): Promise<boolean> {
  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, restaurantId },
  });
  if (!existing) return false;

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "CANCELLED",
      notes: reason ? `${existing.notes || ""} [İptal Sebebi: ${reason}]`.trim() : existing.notes,
    },
  });

  return true;
}

export async function assignReservationTable(
  restaurantId: string,
  reservationId: string,
  tableId: string | null
): Promise<ReservationDTO | null> {
  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, restaurantId, deletedAt: null },
  });
  if (!existing) return null;

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { tableId: tableId || null },
    include: { table: { select: { label: true } } },
  });

  return mapReservationToDTO(updated);
}
