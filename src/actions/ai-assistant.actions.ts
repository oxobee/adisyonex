"use server";

import { prisma } from "@/lib/prisma";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { getManagerById } from "@/services/user.service";
import { callOpenRouter } from "@/services/ai/openrouter.service";
import { createOrder, addItems, fireOrder } from "@/services/order.service";
import { success, failure, type ActionResult } from "@/types";

export interface AiMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface AiActionPreview {
  readonly type: "ADD_ORDER_ITEM";
  readonly tableId: string;
  readonly tableLabel: string;
  readonly menuItemId: string;
  readonly menuItemName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface AiRecommendedPage {
  readonly title: string;
  readonly url: string;
  readonly description: string;
  readonly icon?: "table" | "kitchen" | "pos" | "menu" | "report" | "stock" | "staff" | "settings";
}

export interface AiAssistantResponse {
  readonly reply: string;
  readonly recommendedPage?: AiRecommendedPage | null;
  readonly actionPreview?: AiActionPreview | null;
  readonly clarificationOptions?: readonly string[];
  readonly userRole: string;
  readonly userName: string;
  readonly allowedRoutes: readonly string[] | null;
}

interface UserAuthContext {
  restaurantId: string;
  role: string;
  name: string;
  jobTitle?: string | null;
  allowedRoutes: readonly string[] | null;
  isManager: boolean;
  userId: string | null;
  staffId: string | null;
}

async function resolveUserAuthContext(activeStaffId?: string | null): Promise<UserAuthContext | null> {
  const staff = await getStaffContextOrNull().catch(() => null);
  const managerCtx = await getManagerContextOrNull().catch(() => null);
  const currentUserId = await getCurrentUserId().catch(() => null);

  const restaurantId = staff?.restaurantId || managerCtx?.restaurantId;
  if (!restaurantId) return null;

  // 1. If activeStaffId is explicitly passed from client terminal
  if (activeStaffId) {
    const targetStaff = await prisma.staff.findFirst({
      where: { id: activeStaffId, restaurantId, deletedAt: null },
    });
    if (targetStaff) {
      return {
        restaurantId,
        role: targetStaff.role,
        name: targetStaff.name,
        jobTitle: targetStaff.jobTitle ?? null,
        allowedRoutes: (targetStaff.allowedRoutes as string[] | null) ?? null,
        isManager: false,
        userId: null,
        staffId: targetStaff.id,
      };
    }

    // Check if activeStaffId belongs to the manager/user
    if (currentUserId && activeStaffId === currentUserId) {
      const u = await getManagerById(currentUserId).catch(() => null);
      return {
        restaurantId,
        role: u?.role || "MANAGER",
        name: u?.name || "Yönetici",
        jobTitle: "Restoran Sahibi / Yönetici",
        allowedRoutes: null,
        isManager: true,
        userId: currentUserId,
        staffId: null,
      };
    }
  }

  // 2. Staff Context
  if (staff) {
    return {
      restaurantId: staff.restaurantId,
      role: staff.role,
      name: staff.name,
      jobTitle: staff.jobTitle ?? null,
      allowedRoutes: staff.allowedRoutes ?? null,
      isManager: false,
      userId: null,
      staffId: staff.staffId,
    };
  }

  // 3. Manager Context
  if (managerCtx?.restaurantId) {
    let userName = "Yönetici";
    let role = "MANAGER";
    if (currentUserId) {
      const u = await getManagerById(currentUserId).catch(() => null);
      if (u?.name) userName = u.name;
      if (u?.role) role = u.role;
    }
    return {
      restaurantId: managerCtx.restaurantId,
      role,
      name: userName,
      jobTitle: "Restoran Sahibi / Yönetici",
      allowedRoutes: null,
      isManager: true,
      userId: currentUserId,
      staffId: null,
    };
  }

  return null;
}

export async function askAiAssistantAction(
  userQuery: string,
  chatHistory: readonly AiMessage[] = [],
  activeStaffId?: string | null,
): Promise<ActionResult<AiAssistantResponse>> {
  try {
    const auth = await resolveUserAuthContext(activeStaffId);
    if (!auth) {
      return failure("Oturum süresi dolmuş veya yetki bulunamadı. Lütfen giriş yapınız.");
    }

    const { restaurantId, role, name, jobTitle, allowedRoutes, isManager } = auth;

    const roleUpper = (role || "").toUpperCase();
    const jobTitleLower = (jobTitle || "").toLowerCase();

    // Strict Permissions:
    // Mutfak Personeli (örn. Ebru UĞURLU - Aşçı): SADECE Mutfak ekranı, hazırlanan siparişler ve operasyon bildirimleri
    const isKitchenOnly =
      !isManager &&
      (roleUpper === "KITCHEN" ||
        roleUpper === "CHEF" ||
        jobTitleLower.includes("aşçı") ||
        jobTitleLower.includes("mutfak") ||
        jobTitleLower.includes("chef") ||
        (allowedRoutes !== null &&
          allowedRoutes.includes("/dashboard/kitchen") &&
          !allowedRoutes.includes("/dashboard/orders") &&
          !allowedRoutes.includes("/dashboard/z-report")));

    // Garson Personeli (örn. Emre TEKNECİ - Garson): SADECE Masalar ve Siparişler, masaya ürün ekleme ve garson çağrıları
    const isWaiterOnly =
      !isManager &&
      !isKitchenOnly &&
      (roleUpper === "WAITER" ||
        jobTitleLower.includes("garson") ||
        jobTitleLower.includes("servis") ||
        (allowedRoutes !== null &&
          allowedRoutes.includes("/dashboard/orders") &&
          !allowedRoutes.includes("/dashboard/kitchen") &&
          !allowedRoutes.includes("/dashboard/z-report") &&
          !allowedRoutes.includes("/dashboard/settings")));

    const isCashierOnly =
      !isManager &&
      !isKitchenOnly &&
      !isWaiterOnly &&
      (roleUpper === "CASHIER" ||
        jobTitleLower.includes("kasa") ||
        jobTitleLower.includes("kasiyer") ||
        (allowedRoutes !== null &&
          allowedRoutes.includes("/dashboard/pos") &&
          !allowedRoutes.includes("/dashboard/z-report")));

    const canManageOrders =
      !isKitchenOnly &&
      (isManager ||
        !allowedRoutes ||
        allowedRoutes.includes("/dashboard/orders") ||
        allowedRoutes.includes("/dashboard/pos") ||
        roleUpper === "WAITER");

    const canViewFinancials =
      !isKitchenOnly &&
      !isWaiterOnly &&
      (isManager ||
        !allowedRoutes ||
        allowedRoutes.includes("/dashboard/z-report") ||
        allowedRoutes.includes("/dashboard/pos"));

    const canViewKitchen =
      isKitchenOnly ||
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/kitchen");

    const canManageSettings = isManager;
    const canManageStaff = isManager;

    // Fetch details according to permissions (PREVENTS DATA LEAKAGE TO LLM PROMPT)
    const restaurantPromise = prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, branchName: true },
    });

    const tablesPromise = canManageOrders
      ? prisma.diningTable.findMany({
          where: { restaurantId, deletedAt: null },
          select: { id: true, label: true, section: true, seats: true },
          orderBy: { label: "asc" },
        })
      : Promise.resolve([]);

    const menuItemsPromise = canManageOrders
      ? prisma.menuItem.findMany({
          where: { restaurantId, deletedAt: null, isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            category: { select: { name: true } },
          },
          take: 120,
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]);

    // If kitchen staff, fetch current kitchen queue tickets
    const kitchenTicketsPromise = canViewKitchen
      ? prisma.orderItem.findMany({
          where: {
            order: { restaurantId, status: "OPEN", deletedAt: null },
            state: { in: ["FIRED", "PREPARED"] },
          },
          select: {
            name: true,
            state: true,
            quantity: true,
            order: { select: { tableLabel: true, orderNumber: true } },
          },
          take: 20,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]);

    const [restaurant, tables, menuItems, kitchenTickets] = await Promise.all([
      restaurantPromise,
      tablesPromise,
      menuItemsPromise,
      kitchenTicketsPromise,
    ]);

    const restaurantName = restaurant?.name || "Restoran";
    const currency = "₺";

    // Build role specific strict instructions
    let roleInstructions = "";

    if (isKitchenOnly) {
      roleInstructions = `
DİKKAT: KULLANICI AŞÇI / MUTFAK PERSONELİDİR:
- İsim: "${name}"
- Görevi: "${jobTitle || "Aşçı"}"
- Tanımlı Yetkisi: YALNIZCA Mutfak Ekranı (/dashboard/kitchen), mutfaktaki yemek hazırlıkları ve ana ekrandaki mutfak bildirimleri.
- ŞU ANKİ MUTFAK SİPARİŞLERİ VE HAZIRLIK DURUMU: ${JSON.stringify(
        kitchenTickets.map((k) => ({
          yemek: k.name,
          adet: k.quantity,
          durum: k.state === "FIRED" ? "Bekliyor/Hazırlanıyor" : "Hazır/Serviste",
          masa: k.order?.tableLabel || `#${k.order?.orderNumber}`,
        }))
      )}

KESİNLİKLE YASAK ALANLAR:
1. Masalar, masada oturanlar, adisyon detayları ve masaya sipariş ekleme işlemi KESİNLİKLE YASAKTIR. Aşçının masaya sipariş ekleme yetkisi YOKTUR.
2. Ciro, kasa, hasılat, ödemeler, Z raporu ve finansal veriler KESİNLİKLE YASAKTIR.
3. Firma ayarları, şube ayarları, Wi-Fi bilgileri, yazıcılar ve sistem yönetimi KESİNLİKLE YASAKTIR.
4. Personel şifreleri, PIN kodları ve personel yönetimi KESİNLİKLE YASAKTIR.

ÖNERİLEN SEÇENEKLER (clarificationOptions) KESİN KURALI:
- clarificationOptions içine ASLA ve ASLA masaya sipariş ekleme ("Masa 5'e 1 Hamburger ekle"), ciro, kasa, Z raporu, masa yönetimi veya ayarlar KOYMA.
- SADECE aşçının yetkisi dahilindeki mutfakla ilgili örnekler ver (örn: "Bekleyen siparişleri göster", "Tavuk burger hazırlanıyor mu?", "Mutfak ekranına git", "Hazırlanan yemekler listesi").

KURAL: Kullanıcı bu yasak alanlardan biri hakkında soru sorar veya işlem isterse (örneğin masalar, ciro, Z raporu, ayarlar, garson siparişleri), KESİNLİKLE REDDET:
"Sayın ${name}, ${jobTitle || "Aşçı"} yetkiniz ile yalnızca Mutfak ekranı operasyonları ve mutfak hazırlık bildirimleri hakkında bilgi alabilirsiniz. Masalar, ciro, Z Raporu ve sistem ayarlarına erişim yetkiniz bulunmamaktadır." de.`;
    } else if (isWaiterOnly) {
      roleInstructions = `
DİKKAT: KULLANICI GARSON PERSONELİDİR:
- İsim: "${name}"
- Görevi: "${jobTitle || "Garson"}"
- Tanımlı Yetkisi: YALNIZCA Masalar ve Adisyonlar Ekranı (/dashboard/orders), masaya sipariş/ürün ekleme işlemi ve ana ekrandaki servis bildirimleri (garson çağrıları, hesap isteme, hazır tabaklar).
- MEVCUT MASALAR: ${JSON.stringify(tables.map((t) => ({ id: t.id, label: t.label, section: t.section })))}
- MENÜ ÜRÜNLERİ: ${JSON.stringify(menuItems.map((m) => ({ id: m.id, name: m.name, price: Number(m.price) })))}

KESİNLİKLE YASAK ALANLAR:
1. Günlük Ciro, Kasa hasılatı, Z Raporu (/dashboard/z-report) ve finansal analizler KESİNLİKLE YASAKTIR.
2. Firma Ayarları, şube ayarları, Wi-Fi şifresi ve sistem konfigürasyonu (/dashboard/settings) KESİNLİKLE YASAKTIR.
3. Personel yönetimi, PIN kodları ve çalışan maaşları (/dashboard/staff) KESİNLİKLE YASAKTIR.
4. Stok ve hammadde depoları (/dashboard/inventory) KESİNLİKLE YASAKTIR.

ÖNERİLEN SEÇENEKLER (clarificationOptions) KESİN KURALI:
- clarificationOptions içine ASLA ciro, kasa, Z raporu, ayarlar veya personel maaşları KOYMA.
- SADECE masalar, siparişler ve servis bildirimleri ile ilgili örnekler ver (örn: "Masa 5'e 1 Hamburger ekle", "Boş masaları göster", "Masa 3 sipariş durumu").

KURAL: Kullanıcı bu yasak alanlardan biri hakkında soru sorarsa, KESİNLİKLE REDDET:
"Sayın ${name}, ${jobTitle || "Garson"} yetkiniz ile yalnızca Masalar, adisyonlar, sipariş ekleme ve servis bildirimleri hakkında işlem yapabilirsiniz. Ciro, kasa, personel yönetimi ve sistem ayarlarına erişim yetkiniz bulunmamaktadır." de.`;
    } else if (isCashierOnly) {
      roleInstructions = `
DİKKAT: KULLANICI KASİYER PERSONELİDİR:
- İsim: "${name}"
- Görevi: "${jobTitle || "Kasiyer"}"
- Tanımlı Yetkisi: YALNIZCA Kasa ve POS Ekranı (/dashboard/pos), açık masa hesapları, ödemeler ve adisyon kapatma.

KESİNLİKLE YASAK ALANLAR:
1. Firma ayarları, şube ayarları, Wi-Fi şifresi ve sistem konfigürasyonu (/dashboard/settings) KESİNLİKLE YASAKTIR.
2. Personel yönetimi, PIN kodları ve çalışan maaşları (/dashboard/staff) KESİNLİKLE YASAKTIR.

ÖNERİLEN SEÇENEKLER (clarificationOptions) KESİN KURALI:
- clarificationOptions içine ASLA şube/personel ayarları veya mutfak içi hazırlık detayları koyma.
- SADECE kasa, ödemeler, açık adisyonlar ve POS ile ilgili örnekler ver (örn: "Açık masa hesaplarını göster", "POS ödeme ekranına git", "Kasa durumunu göster").`;
    } else {
      // Manager / Admin
      roleInstructions = `
KULLANICI: "${name}" (Tam Yetkili Yönetici).
Tüm modüllere, finansal verilere, ciroya, Z raporuna, masalara, mutfağa, stoğa ve ayarlara tam erişim yetkisi vardır.
MEVCUT MASALAR: ${JSON.stringify(tables.map((t) => ({ id: t.id, label: t.label, section: t.section })))}
MENÜ ÜRÜNLERİ: ${JSON.stringify(menuItems.map((m) => ({ id: m.id, name: m.name, price: Number(m.price) })))}
`;
    }

    // System prompt
    const systemPrompt = `Sen AdisyonEx Akıllı Restoran Asistanısın. Şu anda "${restaurantName}" adlı restoranda çalışıyorsun.
Hitap ettiğin kullanıcı: "${name}" (${jobTitle || role}).
Kullanılan para birimi: ${currency}.

${roleInstructions}

GENEL VE KESİN KURALLAR:
1. YALNIZCA BU RESTORAN VE KULLANICININ YETKİLİ OLDUĞU ALANLAR HAKKINDA BİLGİ VER.
   - Restoran dışı konular (şiir, genel kültür vb.) sorulursa: "Ben AdisyonEx restoran asistanıyım, yalnızca yetkili olduğunuz restoran operasyonlarında yardımcı olabilirim." de.
2. SAYFA YÖNLENDİRME YERİNE KART ÖNERİSİ:
   - Kullanıcı yetkili olduğu bir ekranı veya işlemi nasıl yapacağını sorduğunda doğrudan sayfayı açma; soruyu açık ve anlaşılır şekilde yanıtla ve "recommendedPage" alanında ilgili sayfayı öner.
   - KULLANICININ YETKİSİ OLMAYAN BİR EKRAN İÇİN ASLA recommendedPage DÖNDÜRME!
3. MASAYA SİPARİŞ EKLEME İŞLEMİ:
   - Yalnızca sipariş yetkisi olan kullanıcılarda (${canManageOrders ? "VAR" : "YOK"}), "Masa 5'e 1 hamburger" gibi komutlarda:
     * Ürün ve masa tespit edildiğinde HER ZAMAN "actionPreview" nesnesi üret ve kullanıcıya karttan onaylamasını söyle.
     * Karışıklık varsa "needsClarification": true ve "clarificationOptions" içine seçenekleri koy.
     * Sipariş yetkisi olmayan kullanıcılar (örn. Aşçı) masaya ürün eklemek isterse: KESİNLİKLE REDDET!
4. YANIT FORMATI:
   Yanıtını YALNIZCA geçerli bir JSON nesnesi olarak döndür:
   {
     "reply": "Kullanıcıya gösterilecek Türkçe açıklama veya yetki uyarısı",
     "needsClarification": false,
     "clarificationOptions": ["Seçenek 1", "Seçenek 2"],
     "recommendedPage": {
       "title": "Sayfa Başlığı",
       "url": "/dashboard/...",
       "description": "Kısa açıklama",
       "icon": "table" | "kitchen" | "pos" | "menu" | "report" | "stock" | "staff" | "settings"
     } | null,
     "actionPreview": { ... } | null
   }`;

    const formattedMessages = [
      { role: "system" as const, content: systemPrompt },
      ...chatHistory.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userQuery },
    ];

    const aiRes = await callOpenRouter({
      messages: formattedMessages,
      model: "google/gemini-2.5-flash",
      temperature: 0.1,
      responseFormat: { type: "json_object" },
      restaurantId,
    });

    let parsed: any;
    try {
      const cleanJson = aiRes.content
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        reply: aiRes.content || "İsteğinizi işlerken bir sorun oluştu.",
        needsClarification: false,
      };
    }

    // Role-based post-filtering of clarificationOptions to ensure zero leakage
    let sanitizedOptions: string[] = Array.isArray(parsed.clarificationOptions)
      ? parsed.clarificationOptions.map((o: any) => String(o).trim()).filter(Boolean)
      : [];

    if (isKitchenOnly) {
      const forbidden = ["ciro", "z rapor", "z-rapor", "kasa", "ödeme", "masaya", "sipariş ekle", "ayar", "personel", "fiyat"];
      sanitizedOptions = sanitizedOptions.filter(
        (opt) => !forbidden.some((bad) => opt.toLowerCase().includes(bad))
      );
      if (sanitizedOptions.length === 0) {
        sanitizedOptions = [
          "Bekleyen siparişleri göster",
          "Mutfak ekranına git",
          "Hazırlanan yemekler listesi",
        ];
      }
    } else if (isWaiterOnly) {
      const forbidden = ["ciro", "z rapor", "z-rapor", "kasa", "hasılat", "ayar", "personel maaş", "maaş"];
      sanitizedOptions = sanitizedOptions.filter(
        (opt) => !forbidden.some((bad) => opt.toLowerCase().includes(bad))
      );
      if (sanitizedOptions.length === 0) {
        sanitizedOptions = [
          "Masa 5'e 1 Hamburger ekle",
          "Boş masaları göster",
          "Masa durumunu göster",
        ];
      }
    } else if (isCashierOnly) {
      const forbidden = ["personel maaş", "ayar", "şube ayar", "wi-fi", "wifi"];
      sanitizedOptions = sanitizedOptions.filter(
        (opt) => !forbidden.some((bad) => opt.toLowerCase().includes(bad))
      );
      if (sanitizedOptions.length === 0) {
        sanitizedOptions = [
          "Açık masa hesaplarını göster",
          "POS ödeme ekranına git",
          "Kasa durumunu göster",
        ];
      }
    }

    return success<AiAssistantResponse>({
      reply: parsed.reply || "İşleminiz tamamlandı.",
      recommendedPage: parsed.recommendedPage || null,
      actionPreview: parsed.actionPreview || null,
      clarificationOptions: sanitizedOptions,
      userRole: jobTitle || role,
      userName: name,
      allowedRoutes,
    });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return failure(
      error instanceof Error
        ? error.message
        : "Yapay zeka servisine bağlanırken beklenmeyen bir hata oluştu.",
    );
  }
}

export async function executeAiAssistantAction(
  action: AiActionPreview,
  activeStaffId?: string | null,
): Promise<ActionResult<{ orderId: string; message: string }>> {
  try {
    const auth = await resolveUserAuthContext(activeStaffId);
    if (!auth) {
      return failure("Oturum süresi dolmuş. Lütfen tekrar giriş yapınız.");
    }

    const { restaurantId, role, name, jobTitle, allowedRoutes, isManager, userId, staffId } = auth;

    // Strict Permission check: Aşçı masaya sipariş ekleyemez
    const isKitchenOnly =
      !isManager &&
      (role === "KITCHEN" ||
        (allowedRoutes !== null &&
          allowedRoutes.includes("/dashboard/kitchen") &&
          !allowedRoutes.includes("/dashboard/orders")));

    if (isKitchenOnly) {
      return failure(`Sayın ${name} (${jobTitle || "Aşçı"}), masaya sipariş ekleme yetkiniz bulunmamaktadır.`);
    }

    const canManageOrders =
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/orders") ||
      allowedRoutes.includes("/dashboard/pos") ||
      role === "WAITER";

    if (!canManageOrders) {
      return failure(`Sayın ${name}, sipariş alma ve masaya ürün ekleme yetkiniz bulunmamaktadır.`);
    }

    // Verify Table
    const table = await prisma.diningTable.findFirst({
      where: { id: action.tableId, restaurantId, deletedAt: null },
    });
    if (!table) {
      return failure(`Masa bulunamadı (${action.tableLabel}).`);
    }

    // Verify MenuItem
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: action.menuItemId, restaurantId, deletedAt: null, isActive: true },
    });
    if (!menuItem) {
      return failure(`Ürün bulunamadı veya şu anda satışta değil (${action.menuItemName}).`);
    }

    const orderCtx = {
      restaurantId,
      userId: userId ?? null,
      staffId: staffId ?? null,
      source: "STAFF" as const,
    };

    // Find active open order for this table
    const openOrder = await prisma.order.findFirst({
      where: {
        restaurantId,
        tableId: table.id,
        status: "OPEN",
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    const quantity = Math.max(1, Math.min(99, action.quantity || 1));

    if (openOrder) {
      await addItems(orderCtx, {
        orderId: openOrder.id,
        items: [
          {
            menuItemId: menuItem.id,
            quantity,
            isComp: false,
            modifierIds: [],
          },
        ],
      });
      await fireOrder(orderCtx, openOrder.id);

      return success({
        orderId: openOrder.id,
        message: `Masa ${table.label} siparişine ${quantity}x ${menuItem.name} başarıyla eklendi ve mutfağa iletildi.`,
      });
    } else {
      const idempotencyKey = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newOrder = await createOrder(orderCtx, {
        orderType: "DINE_IN",
        tableId: table.id,
        tableLabel: table.label,
        idempotencyKey,
        items: [
          {
            menuItemId: menuItem.id,
            quantity,
            isComp: false,
            modifierIds: [],
          },
        ],
      });

      return success({
        orderId: newOrder.id,
        message: `Masa ${table.label} için yeni adisyon açıldı, ${quantity}x ${menuItem.name} eklendi ve mutfağa iletildi.`,
      });
    }
  } catch (error) {
    console.error("Execute AI Action Error:", error);
    return failure(
      error instanceof Error ? error.message : "İşlem gerçekleştirilirken bir hata oluştu.",
    );
  }
}
