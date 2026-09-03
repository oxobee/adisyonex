"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import {
  addCashMovement,
  closeDayAndCreateZReport,
  removeCashMovement,
} from "@/services/z-report.service";

async function getAuthContext() {
  const staffCtx = await getStaffContextOrNull().catch(() => null);
  const mgrCtx = await getManagerContextOrNull().catch(() => null);
  const userId = await getCurrentUserId().catch(() => null);

  const restaurantId = staffCtx?.restaurantId || mgrCtx?.restaurantId;
  if (!restaurantId) {
    throw new Error("UNAUTHORIZED: Oturum bulunamadı.");
  }

  // Yetki Kontrolü: Garsonların finansal rapor kapatmasını engelle
  if (staffCtx) {
    const isAuthorized =
      staffCtx.role === "MANAGEMENT" ||
      staffCtx.allowedRoutes?.includes("/dashboard/z-report");
    if (!isAuthorized) {
      throw new Error("FORBIDDEN: Z Raporu ve Gün Sonu işlemi için yetkiniz bulunmamaktadır.");
    }
  }

  const performerName = staffCtx?.name || "Yönetici";
  const performerId = staffCtx?.staffId || userId || null;

  return { restaurantId, performerId, performerName };
}

export async function closeZReportAction(formData: {
  countedCash: number;
  notes?: string;
}) {
  try {
    const { restaurantId, performerId, performerName } = await getAuthContext();

    const result = await closeDayAndCreateZReport(
      restaurantId,
      performerId,
      performerName,
      Number(formData.countedCash) || 0,
      formData.notes,
    );

    revalidatePath("/dashboard/z-report");
    revalidatePath("/dashboard/home");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Gün sonu başarıyla kapatıldı. ${result.zNumberFormatted} oluşturuldu.`,
      zNumberFormatted: result.zNumberFormatted,
      reportId: result.reportId,
    };
  } catch (error: any) {
    console.error("closeZReportAction error:", error);
    return {
      success: false,
      message: error?.message || "Gün sonu kapatılırken bir hata oluştu.",
    };
  }
}

export async function createCashMovementAction(formData: {
  type: "IN" | "OUT";
  category: string;
  amount: number;
  description?: string;
}) {
  try {
    const { restaurantId, performerName } = await getAuthContext();

    if (!formData.amount || formData.amount <= 0) {
      return { success: false, message: "Lütfen geçerli bir tutar girin." };
    }
    if (!formData.category || !formData.category.trim()) {
      return { success: false, message: "Kategori seçimi zorunludur." };
    }

    await addCashMovement(restaurantId, {
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      performedByName: performerName,
    });

    revalidatePath("/dashboard/z-report");
    return { success: true, message: "Kasa hareketi başarıyla işlendi." };
  } catch (error: any) {
    console.error("createCashMovementAction error:", error);
    return { success: false, message: error?.message || "Kasa hareketi eklenemedi." };
  }
}

export async function deleteCashMovementAction(id: string) {
  try {
    const { restaurantId } = await getAuthContext();
    await removeCashMovement(restaurantId, id);
    revalidatePath("/dashboard/z-report");
    return { success: true, message: "Kasa hareketi silindi." };
  } catch (error: any) {
    console.error("deleteCashMovementAction error:", error);
    return { success: false, message: error?.message || "Kasa hareketi silinemedi." };
  }
}
