"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { failure, success, type ActionResult } from "@/types";
import { getAdminContextOrNull } from "@/lib/admin-auth";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";

const feedbackCategorySchema = z.enum([
  "SUGGESTION",
  "REQUEST",
  "COMPLAINT",
  "BUG",
]);

const feedbackStatusSchema = z.enum([
  "PENDING",
  "REVIEWING",
  "RESOLVED",
  "REJECTED",
]);

const submitFeedbackSchema = z.object({
  category: feedbackCategorySchema,
  title: z.string().min(2, "Başlık en az 2 karakter olmalıdır").max(150),
  message: z.string().min(5, "Mesajınız en az 5 karakter olmalıdır").max(5000),
  attachments: z.array(z.string()).default([]),
  deviceInfo: z
    .object({
      userAgent: z.string().optional(),
      browser: z.string().optional(),
      os: z.string().optional(),
      screenResolution: z.string().optional(),
      path: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export interface FeedbackDTO {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantPhone?: string | null;
  restaurantAddress?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  category: "SUGGESTION" | "REQUEST" | "COMPLAINT" | "BUG";
  title: string;
  message: string;
  attachments: string[];
  deviceInfo: any;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submit feedback from dashboard (Manager or Staff)
 */
export async function submitFeedbackAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = submitFeedbackSchema.safeParse(raw);
    if (!parsed.success) {
      return failure(
        parsed.error.issues[0]?.message || "Girdi doğrulama hatası",
      );
    }

    const [managerCtx, staffCtx] = await Promise.all([
      getManagerContextOrNull(),
      getStaffContextOrNull(),
    ]);

    const restaurantId = managerCtx?.restaurantId || staffCtx?.restaurantId;
    if (!restaurantId) {
      return failure("Restoran oturumu bulunamadı");
    }

    let userId: string | null = null;
    let userName: string | null = null;
    let userEmail: string | null = null;
    let userPhone: string | null = null;

    if (managerCtx) {
      userId = managerCtx.userId;
      const user = await prisma.user.findUnique({
        where: { id: managerCtx.userId },
        select: { name: true, email: true, phone: true },
      });
      userName = user?.name || "İşletme Yöneticisi";
      userEmail = user?.email || null;
      userPhone = user?.phone || null;
    } else if (staffCtx) {
      userId = staffCtx.staffId;
      const staff = await prisma.staff.findUnique({
        where: { id: staffCtx.staffId },
        select: { name: true, email: true, phone: true, role: true },
      });
      userName = `${staff?.name || "Personel"} (${staff?.role || "GÖREVLİ"})`;
      userEmail = staff?.email || null;
      userPhone = staff?.phone || null;
    }

    const record = await prisma.feedback.create({
      data: {
        restaurantId,
        userId,
        userName,
        userEmail,
        userPhone,
        category: parsed.data.category,
        title: parsed.data.title.trim(),
        message: parsed.data.message.trim(),
        attachments: parsed.data.attachments || [],
        deviceInfo: parsed.data.deviceInfo || undefined,
        status: "PENDING",
      },
      select: { id: true },
    });

    revalidatePath("/admin/feedbacks");
    return success({ id: record.id });
  } catch (error: any) {
    console.error("Submit Feedback Error:", error);
    return failure(error?.message || "Geri bildirim gönderilemedi");
  }
}

/**
 * Super Admin: List all feedbacks with filtering
 */
export async function listFeedbacksForAdminAction(query?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<ActionResult<FeedbackDTO[]>> {
  const admin = await getAdminContextOrNull();
  if (!admin || !admin.isSuperAdmin) {
    return failure("FORBIDDEN_SUPER_ADMIN");
  }

  try {
    const where: any = {};
    if (query?.category && query.category !== "ALL") {
      where.category = query.category;
    }
    if (query?.status && query.status !== "ALL") {
      where.status = query.status;
    }
    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { message: { contains: s, mode: "insensitive" } },
        { userName: { contains: s, mode: "insensitive" } },
        { userPhone: { contains: s, mode: "insensitive" } },
        { restaurant: { name: { contains: s, mode: "insensitive" } } },
      ];
    }

    const list = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        restaurant: {
          select: {
            name: true,
            phone: true,
            branchAddress: true,
            addressLine1: true,
          },
        },
      },
    });

    const dtos: FeedbackDTO[] = list.map((f) => ({
      id: f.id,
      restaurantId: f.restaurantId,
      restaurantName: f.restaurant.name,
      restaurantPhone: f.restaurant.phone,
      restaurantAddress: f.restaurant.branchAddress || f.restaurant.addressLine1,
      userId: f.userId,
      userName: f.userName,
      userEmail: f.userEmail,
      userPhone: f.userPhone,
      category: f.category,
      title: f.title,
      message: f.message,
      attachments: f.attachments,
      deviceInfo: f.deviceInfo,
      status: f.status,
      adminNote: f.adminNote,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return success(dtos);
  } catch (error: any) {
    console.error("List Feedbacks Error:", error);
    return failure("Geri bildirimler listelenemedi");
  }
}

/**
 * Super Admin: Update status or admin note of a feedback
 */
export async function updateFeedbackStatusAction(input: {
  feedbackId: string;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
  adminNote?: string;
}): Promise<ActionResult<void>> {
  const admin = await getAdminContextOrNull();
  if (!admin || !admin.isSuperAdmin) {
    return failure("FORBIDDEN_SUPER_ADMIN");
  }

  try {
    await prisma.feedback.update({
      where: { id: input.feedbackId },
      data: {
        status: input.status,
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
      },
    });

    revalidatePath("/admin/feedbacks");
    return success(undefined);
  } catch (error) {
    console.error("Update Feedback Error:", error);
    return failure("Durum güncellenemedi");
  }
}

/**
 * Super Admin: Delete a feedback
 */
export async function deleteFeedbackAction(
  feedbackId: string,
): Promise<ActionResult<void>> {
  const admin = await getAdminContextOrNull();
  if (!admin || !admin.isSuperAdmin) {
    return failure("FORBIDDEN_SUPER_ADMIN");
  }

  try {
    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    revalidatePath("/admin/feedbacks");
    return success(undefined);
  } catch (error) {
    console.error("Delete Feedback Error:", error);
    return failure("Geri bildirim silinemedi");
  }
}
