"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withManagerValidation } from "@/actions/helpers";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { failure, success, type ActionResult } from "@/types";
import {
  dismissCallSession,
  getActiveRingingCall,
  getRecentMissedCalls,
  getTelephonySettings,
  quickRegisterCustomerFromCall,
  testTelephonyConnection,
  triggerSimulationCall,
  updateTelephonySettings,
  type ActiveCallDTO,
  type MissedCallDTO,
  type TelephonySettingsDTO,
} from "@/services/telephony.service";

async function resolveRestaurantId(): Promise<string | null> {
  const staff = await getStaffContextOrNull().catch(() => null);
  const manager = await getManagerContextOrNull().catch(() => null);
  return staff?.restaurantId || manager?.restaurantId || null;
}

export async function getTelephonySettingsAction(): Promise<ActionResult<TelephonySettingsDTO>> {
  try {
    const manager = await getManagerContextOrNull().catch(() => null);
    if (!manager) {
      return failure("Yönetici oturumu bulunamadı.");
    }
    const settings = await getTelephonySettings(manager.restaurantId);
    return success(settings);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Ayarlar alınamadı.");
  }
}

const updateTelephonySchema = z.object({
  enabled: z.boolean().optional(),
  mode: z.enum(["SIMULATION", "LIVE"]).optional(),
  provider: z.string().optional(),
  incomingNumber: z.string().nullable().optional(),
  sipExtension: z.string().nullable().optional(),
  apiUsername: z.string().nullable().optional(),
  apiPassword: z.string().nullable().optional(),
});

export const updateTelephonySettingsAction = withManagerValidation(
  updateTelephonySchema,
  async (input, ctx): Promise<ActionResult<TelephonySettingsDTO>> => {
    const res = await updateTelephonySettings(ctx.restaurantId, input);
    if (!res.success || !res.data) {
      return failure(res.error || "Ayarlar kaydedilemedi.");
    }
    revalidatePath("/dashboard/settings");
    return success(res.data);
  }
);

export async function testTelephonyConnectionAction(): Promise<ActionResult<{ message: string }>> {
  try {
    const manager = await getManagerContextOrNull().catch(() => null);
    if (!manager) {
      return failure("Yönetici oturumu bulunamadı.");
    }
    const res = await testTelephonyConnection(manager.restaurantId);
    if (!res.success) {
      return failure(res.error || res.message);
    }
    revalidatePath("/dashboard/settings");
    return success({ message: res.message });
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Bağlantı test edilemedi.");
  }
}

const triggerSimulationSchema = z.object({
  scenario: z.enum([
    "REGISTERED_DELIVERY",
    "REGISTERED_TAKEAWAY",
    "REGISTERED_DINE_IN",
    "NEW_CUSTOMER",
    "MARKETPLACE_YEMEKSEPETI",
    "REGISTERED",
    "NEW",
  ]),
  customPhone: z.string().optional(),
  customName: z.string().optional(),
});

export async function triggerCallSimulationAction(
  rawInput: z.infer<typeof triggerSimulationSchema>
): Promise<ActionResult<ActiveCallDTO>> {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) {
      return failure("Restoran oturumu bulunamadı.");
    }

    const parsed = triggerSimulationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure("Geçersiz simülasyon parametreleri.");
    }

    const call = await triggerSimulationCall(restaurantId, parsed.data);
    return success(call);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Simülasyon başlatılamadı.");
  }
}

export async function getActiveRingingCallAction(): Promise<ActionResult<ActiveCallDTO | null>> {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) return success(null);

    const call = await getActiveRingingCall(restaurantId);
    return success(call);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Çağrı durumu sorgulanamadı.");
  }
}

export async function getRecentMissedCallsAction(): Promise<ActionResult<readonly MissedCallDTO[]>> {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) return success([]);

    const calls = await getRecentMissedCalls(restaurantId);
    return success(calls);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Cevapsız aramalar alınamadı.");
  }
}

export async function dismissCallSessionAction(
  callSessionId: string,
  status: "ANSWERED" | "ENDED" | "MISSED" = "ENDED"
): Promise<ActionResult<{ dismissed: boolean }>> {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) return failure("Oturum bulunamadı.");

    const res = await dismissCallSession(restaurantId, callSessionId, status);
    return success({ dismissed: res });
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Çağrı sonlandırılamadı.");
  }
}

const quickRegisterSchema = z.object({
  phone: z.string().min(3),
  name: z.string().min(2, "Müşteri adı en az 2 karakter olmalıdır."),
  address: z.string().optional(),
  addressTitle: z.string().optional(),
  notes: z.string().optional(),
});

export async function quickRegisterCustomerFromCallAction(
  rawInput: z.infer<typeof quickRegisterSchema>
): Promise<ActionResult<{ customerId: string; name: string; phone: string; address?: string }>> {
  try {
    const restaurantId = await resolveRestaurantId();
    if (!restaurantId) return failure("Oturum bulunamadı.");

    const parsed = quickRegisterSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure("Lütfen gerekli müşteri alanlarını doldurun.");
    }

    const res = await quickRegisterCustomerFromCall(restaurantId, parsed.data);
    return success(res);
  } catch (err) {
    return failure(err instanceof Error ? err.message : "Müşteri kaydedilemedi.");
  }
}
