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

    const { logActivity } = await import("@/services/activity-log.service");
    await logActivity({
      restaurantId,
      actor: { id: performerId, name: performerName, role: "YÖNETİCİ" },
      category: "Z RAPORU",
      action: "Gün Sonu Z Raporu Kapatıldı",
      details: `${result.zNumberFormatted} raporu oluşturuldu. Sayılan Nakit: ₺${formData.countedCash}. Not: ${formData.notes || 'Yok'}`,
    });

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
    const { restaurantId, performerName, performerId } = await getAuthContext();

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

    const { logActivity } = await import("@/services/activity-log.service");
    await logActivity({
      restaurantId,
      actor: { id: performerId, name: performerName, role: "KASA" },
      category: "KASA",
      action: formData.type === "IN" ? "Kasa Nakit Girişi Eklendi" : "Kasa Nakit Çıkışı Eklendi",
      details: `Tutar: ₺${formData.amount}, Kategori: ${formData.category}. Açıklama: ${formData.description || 'Yok'}`,
    });

    revalidatePath("/dashboard/z-report");
    return { success: true, message: "Kasa hareketi başarıyla işlendi." };
  } catch (error: any) {
    console.error("createCashMovementAction error:", error);
    return {
      success: false,
      message: error?.message || "Kasa hareketi işlenirken hata oluştu.",
    };
  }
}

export async function deleteCashMovementAction(movementId: string) {
  try {
    const { restaurantId, performerName, performerId } = await getAuthContext();

    await removeCashMovement(restaurantId, movementId);

    const { logActivity } = await import("@/services/activity-log.service");
    await logActivity({
      restaurantId,
      actor: { id: performerId, name: performerName, role: "KASA" },
      category: "KASA",
      action: "Kasa Nakit Hareketi Silindi",
      details: `Kasa hareketi silindi (ID: ${movementId})`,
    });

    revalidatePath("/dashboard/z-report");
    return { success: true, message: "Kasa hareketi silindi." };
  } catch (error: any) {
    console.error("deleteCashMovementAction error:", error);
    return {
      success: false,
      message: error?.message || "Kasa hareketi silinirken hata oluştu.",
    };
  }
}
