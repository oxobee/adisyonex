import { prisma } from "@/lib/prisma";

export interface SystemModuleDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  activeRestaurantCount: number;
}

export interface RestaurantModuleStatusDTO {
  moduleId: string;
  key: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  icon: string | null;
  isGloballyActive: boolean;
  isAssignedToRestaurant: boolean;
  isRestaurantActive: boolean;
  assignedAt: string | null;
}

export interface RestaurantNotificationDTO {
  id: string;
  restaurantId: string;
  title: string;
  message: string;
  buttonText: string | null;
  buttonUrl: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

const DEFAULT_MODULES = [
  {
    key: "qr_ai",
    name: "QR Menüdeki Yapay Zeka",
    description:
      "QR menüde müşterilere yemek öneren, sipariş ve içerik sorularını anında yanıtlayan akıllı garson asistanı.",
    price: 499,
    icon: "BotMessageSquareIcon",
    sortOrder: 1,
  },
  {
    key: "admin_ai",
    name: "Admin Panelindeki Yapay Zeka",
    description:
      "Yönetici ve çalışanlar için canlı ciro, masa doluluğu, adisyon ve operasyon takibini sesli/yazılı özetleyen yapay zeka.",
    price: 699,
    icon: "SparklesIcon",
    sortOrder: 2,
  },
  {
    key: "ai_menu_import",
    name: "Yapay Zeka ile Menü İçe Aktar",
    description:
      "Fiziksel menü fotoğraflarını, PDF ve listeleri saniyeler içinde yapay zeka ile okuyup dijital menüye dönüştürme.",
    price: 349,
    icon: "FileUpIcon",
    sortOrder: 3,
  },
  {
    key: "ai_image_generation",
    name: "Yapay Zeka ile Görsel Oluştur",
    description:
      "Menüdeki yemek ve içecekler için yüksek çözünürlüklü, stüdyo kalitesinde gerçekçi ürün fotoğrafları üretme.",
    price: 399,
    icon: "ImagePlusIcon",
    sortOrder: 4,
  },
  {
    key: "ai_photo_enhance",
    name: "Fotoğrafları Profesyonelleştir",
    description:
      "Telefonda çekilen amatör yemek fotoğraflarını yapay zeka ile profesyonel stüdyo ışığı ve netliğe kavuşturma.",
    price: 299,
    icon: "WandSparklesIcon",
    sortOrder: 5,
  },
  {
    key: "ai_copywriter_nutrition",
    name: "Metin Yazarı ve Besin Analizi",
    description:
      "Ürünler için iştah açıcı açıklamalar, kalori, alerjen ve besin değerlerini yapay zeka ile otomatik çıkarma.",
    price: 249,
    icon: "FileTextIcon",
    sortOrder: 6,
  },
  {
    key: "birthday_automation",
    name: "Doğum Günü Otomasyonu",
    description:
      "Müşterilerin doğum günlerinde otomatik tebrik mesajı ve özel indirim kuponları göndererek sadakati artıran otomasyon.",
    price: 199,
    icon: "GiftIcon",
    sortOrder: 7,
  },
  {
    key: "qr_customer_auth",
    name: "QR Menü Müşteri Giriş & Kayıt",
    description:
      "QR menüde müşterilerin cep telefonuyla tek tıkla giriş yapıp sipariş geçmişi ve sadakat puanı takip edebileceği profil alanı.",
    price: 249,
    icon: "UserCheckIcon",
    sortOrder: 8,
  },
];

/**
 * Ensures that all 8 core system modules exist in the database.
 */
export async function ensureDefaultModulesExist(): Promise<void> {
  for (const mod of DEFAULT_MODULES) {
    await prisma.systemModule.upsert({
      where: { key: mod.key },
      create: {
        key: mod.key,
        name: mod.name,
        description: mod.description,
        price: mod.price,
        icon: mod.icon,
        sortOrder: mod.sortOrder,
        isActive: true,
      },
      update: {
        sortOrder: mod.sortOrder,
        icon: mod.icon,
      },
    });
  }
}

/**
 * List all system modules with count of active restaurant subscribers.
 */
export async function listSystemModulesWithStats(): Promise<readonly SystemModuleDTO[]> {
  await ensureDefaultModulesExist();

  const modules = await prisma.systemModule.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          restaurantModules: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  return modules.map((m) => ({
    id: m.id,
    key: m.key,
    name: m.name,
    description: m.description,
    price: Number(m.price),
    currency: m.currency,
    icon: m.icon,
    isActive: m.isActive,
    sortOrder: m.sortOrder,
    activeRestaurantCount: m._count.restaurantModules,
  }));
}

/**
 * Update system module properties (title, price, description, active status).
 */
export async function updateSystemModule(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    isActive?: boolean;
  }
): Promise<void> {
  await prisma.systemModule.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

/**
 * List all modules status for a given restaurant.
 */
export async function getRestaurantModulesStatus(
  restaurantId: string
): Promise<readonly RestaurantModuleStatusDTO[]> {
  await ensureDefaultModulesExist();

  const [allModules, assignedModules] = await Promise.all([
    prisma.systemModule.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.restaurantModule.findMany({
      where: { restaurantId },
    }),
  ]);

  const assignedMap = new Map(assignedModules.map((am) => [am.moduleId, am]));

  return allModules.map((m) => {
    const assigned = assignedMap.get(m.id);
    return {
      moduleId: m.id,
      key: m.key,
      name: m.name,
      description: m.description,
      price: Number(m.price),
      currency: m.currency,
      icon: m.icon,
      isGloballyActive: m.isActive,
      isAssignedToRestaurant: Boolean(assigned),
      isRestaurantActive: Boolean(assigned?.isActive),
      assignedAt: assigned ? assigned.assignedAt.toISOString() : null,
    };
  });
}

/**
 * Toggle or assign a module for a restaurant.
 */
export async function toggleRestaurantModule(
  restaurantId: string,
  moduleId: string,
  isActive: boolean
): Promise<void> {
  await prisma.restaurantModule.upsert({
    where: {
      restaurantId_moduleId: {
        restaurantId,
        moduleId,
      },
    },
    create: {
      restaurantId,
      moduleId,
      isActive,
      assignedAt: new Date(),
    },
    update: {
      isActive,
    },
  });
}

/**
 * Send a notification from SuperAdmin to a restaurant.
 */
export async function sendRestaurantNotification(
  restaurantId: string,
  data: {
    title: string;
    message: string;
    buttonText?: string | null;
    buttonUrl?: string | null;
  }
): Promise<RestaurantNotificationDTO> {
  const notif = await prisma.restaurantNotification.create({
    data: {
      restaurantId,
      title: data.title.trim(),
      message: data.message.trim(),
      buttonText: data.buttonText?.trim() || null,
      buttonUrl: data.buttonUrl?.trim() || null,
      isRead: false,
    },
  });

  return {
    id: notif.id,
    restaurantId: notif.restaurantId,
    title: notif.title,
    message: notif.message,
    buttonText: notif.buttonText,
    buttonUrl: notif.buttonUrl,
    isRead: notif.isRead,
    createdAt: notif.createdAt.toISOString(),
    readAt: notif.readAt ? notif.readAt.toISOString() : null,
  };
}

/**
 * List recent notifications sent to a restaurant.
 */
export async function listRestaurantNotifications(
  restaurantId: string
): Promise<readonly RestaurantNotificationDTO[]> {
  const list = await prisma.restaurantNotification.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return list.map((n) => ({
    id: n.id,
    restaurantId: n.restaurantId,
    title: n.title,
    message: n.message,
    buttonText: n.buttonText,
    buttonUrl: n.buttonUrl,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
  }));
}

/**
 * Mark notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  await prisma.restaurantNotification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}
