"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { failure, success, type ActionResult } from "@/types";
import {
  cancelReservation,
  createReservation,
  getReservationStats,
  listReservations,
  seatReservationAndOpenOrder,
  updateReservationStatus,
  type CreateReservationInput,
  type ReservationDTO,
  type ReservationStatsDTO,
} from "@/services/reservation.service";
import type { ReservationStatus } from "@/generated/prisma/client";

async function resolveStaffAndRestaurant(): Promise<{
  restaurantId: string | null;
  staffId?: string;
}> {
  const staff = await getStaffContextOrNull().catch(() => null);
  const manager = await getManagerContextOrNull().catch(() => null);
  const restaurantId = staff?.restaurantId || manager?.restaurantId || null;
  return { restaurantId, staffId: staff?.staffId };
}

const preOrderItemSchema = z.object({
  menuItemId: z.string().optional(),
  name: z.string(),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  notes: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
});

const createReservationSchema = z.object({
  tableId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1, "Müşteri adı zorunludur."),
  customerPhone: z.string().min(6, "Geçerli bir telefon numarası giriniz."),
  customerEmail: z.string().email().nullable().optional(),
  guestCount: z.number().int().min(1).default(2),
  reservationTime: z.string().or(z.date()),
  source: z.enum(["PHONE", "POS", "ONLINE", "WALK_IN"]).default("POS"),
  notes: z.string().nullable().optional(),
  preOrderItems: z.array(preOrderItemSchema).nullable().optional(),
});

export async function createReservationAction(
  rawInput: z.infer<typeof createReservationSchema>
): Promise<ActionResult<ReservationDTO>> {
  try {
    const { restaurantId } = await resolveStaffAndRestaurant();
    if (!restaurantId) return failure("Restoran oturumu bulunamadı.");

    const parsed = createReservationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Geçersiz rezervasyon bilgisi.");
    }

    const reservation = await createReservation(
      restaurantId,
      parsed.data as CreateReservationInput
    );

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/orders");

    return success(reservation);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Rezervasyon oluşturulamadı.");
  }
}

export async function listReservationsAction(filter?: {
  date?: string;
  status?: ReservationStatus;
  tableId?: string;
  search?: string;
}): Promise<ActionResult<readonly ReservationDTO[]>> {
  try {
    const { restaurantId } = await resolveStaffAndRestaurant();
    if (!restaurantId) return failure("Restoran oturumu bulunamadı.");

    const list = await listReservations(restaurantId, filter);
    return success(list);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Rezervasyonlar alınamadı.");
  }
}

export async function getReservationStatsAction(): Promise<ActionResult<ReservationStatsDTO>> {
  try {
    const { restaurantId } = await resolveStaffAndRestaurant();
    if (!restaurantId) return failure("Restoran oturumu bulunamadı.");

    const stats = await getReservationStats(restaurantId);
    return success(stats);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "İstatistikler alınamadı.");
  }
}

export async function updateReservationStatusAction(
  reservationId: string,
  status: ReservationStatus
): Promise<ActionResult<ReservationDTO>> {
  try {
    const { restaurantId } = await resolveStaffAndRestaurant();
    if (!restaurantId) return failure("Restoran oturumu bulunamadı.");

    const updated = await updateReservationStatus(restaurantId, reservationId, status);
    if (!updated) return failure("Rezervasyon bulunamadı.");

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/pos");
    return success(updated);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Rezervasyon durumu güncellenemedi.");
  }
}

export async function seatReservationAction(
  reservationId: string
): Promise<ActionResult<{ reservation: ReservationDTO; orderId?: string }>> {
  try {
    const { restaurantId, staffId } = await resolveStaffAndRestaurant();
    if (!restaurantId) return failure("Restoran oturumu bulunamadı.");

    const res = await seatReservationAndOpenOrder(restaurantId, reservationId, staffId);
    if (!res.success) {
      return failure(res.message || "Masaya oturtulamadı.");
    }

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/orders");

    return success({ reservation: res.reservation, orderId: res.orderId });
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Rezervasyon masaya oturtulamadı.");
  }
}

export async function cancelReservationAction(
  reservationId: string,
  reason?: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { restaurantId } = await resolveStaffAndRestaurant();
    if (!restaurantId) return failure("Restoran oturumu bulunamadı.");

    const ok = await cancelReservation(restaurantId, reservationId, reason);
    if (!ok) return failure("Rezervasyon bulunamadı veya iptal edilemedi.");

    revalidatePath("/dashboard/reservations");
    revalidatePath("/dashboard/pos");
    return success({ success: true });
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Rezervasyon iptal edilemedi.");
  }
}
