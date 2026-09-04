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
  readonly allowedRoutes: readonly string[] | null;
}

interface UserAuthContext {
  restaurantId: string;
  role: string;
  name: string;
  allowedRoutes: readonly string[] | null;
  isManager: boolean;
  userId: string | null;
  staffId: string | null;
}

async function resolveUserAuthContext(): Promise<UserAuthContext | null> {
  // 1. Staff Context
  const staff = await getStaffContextOrNull().catch(() => null);
  if (staff) {
    return {
      restaurantId: staff.restaurantId,
      role: staff.role,
      name: staff.name,
      allowedRoutes: staff.allowedRoutes ?? null,
      isManager: false,
      userId: null,
      staffId: staff.staffId,
    };
  }

  // 2. Manager Context
  const managerCtx = await getManagerContextOrNull().catch(() => null);
  const currentUserId = await getCurrentUserId().catch(() => null);
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
      allowedRoutes: null, // Full access
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
): Promise<ActionResult<AiAssistantResponse>> {
  try {
    const auth = await resolveUserAuthContext();
    if (!auth) {
      return failure("Oturum süresi dolmuş veya yetki bulunamadı. Lütfen giriş yapınız.");
    }

    const { restaurantId, role, name, allowedRoutes, isManager } = auth;

    // Fetch Restaurant Details, Active Tables, and Menu Items
    const [restaurant, tables, menuItems] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { name: true, branchName: true },
      }),
      prisma.diningTable.findMany({
        where: { restaurantId, deletedAt: null },
        select: { id: true, label: true, section: true, seats: true },
        orderBy: { label: "asc" },
      }),
      prisma.menuItem.findMany({
        where: { restaurantId, deletedAt: null, isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          category: { select: { name: true } },
        },
        take: 120,
        orderBy: { name: "asc" },
      }),
    ]);

    const restaurantName = restaurant?.name || "Restoran";
    const currency = "₺";

    // Build permissions overview
    let permissionSummary = "";
    if (isManager || !allowedRoutes) {
      permissionSummary = "Tam Yetkili Yönetici (Tüm modüllere ve finansal verilere erişebilir).";
    } else {
      permissionSummary = `Personel Rolü: ${role}. İzinli Ekranlar: ${
        allowedRoutes.length > 0 ? allowedRoutes.join(", ") : "Yetkili ekran tanımlanmamış"
      }.`;
    }

    // Role restrictions
    const canManageOrders =
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/orders") ||
      allowedRoutes.includes("/dashboard/pos") ||
      role === "WAITER";

    const canViewFinancials =
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/z-report") ||
      allowedRoutes.includes("/dashboard/pos");

    const canViewKitchen =
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/kitchen");

    const canManageMenu =
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/menu");

    const canManageStaff =
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/staff");

    // System prompt construction
    const systemPrompt = `Sen AdisyonEx Akıllı Restoran Asistanısın. Şu anda "${restaurantName}" adlı restoranda çalışıyorsun.
Hitap ettiğin kullanıcı: "${name}" (${permissionSummary}).
Kullanılan para birimi: ${currency}.

ÖNEMLİ KURALLAR:
1. YALNIZCA BU RESTORAN VE ADİSYONEX SİSTEMİ HAKKINDA BİLGİ VER VE İŞLEM YAP.
   - Restoran dışı konular (şiir yaz, dünya kupası, tarih, genel sohbet vb.) sorulursa kesinlikle cevaplama. Nezaketle: "Ben AdisyonEx restoran asistanıyım, yalnızca restoran operasyonlarınız, siparişler, menü, masalar ve sistem yönetimi konusunda yardımcı olabilirim." de.
2. YETKİ KONTROLÜ (ÇOK ÖNEMLİ):
   - Kullanıcının yetkisi olmayan bilgilere ve ekranlara erişmesine izin verme!
   - Finansal veriler / Ciro / Z Raporu sorgusu: Kullanıcının finans yetkisi (${canViewFinancials ? "VAR" : "YOK"}). Eğer YOK ise (örneğin mutfak veya garson personeli ciro sorarsa), kibarca "Bu bilgiye erişim yetkiniz bulunmamaktadır. Göreviniz kapsamındaki ekranlar hakkında bilgi verebilirim." de.
   - Sipariş alma / Masaya ürün ekleme: Kullanıcının sipariş yetkisi (${canManageOrders ? "VAR" : "YOK"}). Eğer YOK ise (örneğin mutfak personeli masaya sipariş eklemek isterse), "Sipariş oluşturma yetkiniz bulunmamaktadır." de.
   - Personel / Maaş / Şifreler: Kullanıcının personel yetkisi (${canManageStaff ? "VAR" : "YOK"}).
3. SAYFA YÖNLENDİRME YERİNE KART ÖNERİSİ:
   - Kullanıcı bir ekranı veya işlemi nasıl yapacağını sorduğunda doğrudan sayfayı açma; soruyu açık ve anlaşılır şekilde yanıtla ve "recommendedPage" alanında ilgili sayfayı öner.
   - Ekranlar:
     * Masa & QR Yönetimi: /dashboard/tables (Masalar, kat planı, QR kodlar)
     * Masalar & Adisyonlar: /dashboard/orders (Açık masalar, sipariş detayları)
     * Mutfak KOT: /dashboard/kitchen (Mutfak sipariş fişleri, hazırlık durumu)
     * Hızlı Kasa / POS: /dashboard/pos (Ödeme alma, hesap kapatma)
     * Menü Yönetimi: /dashboard/menu (Ürünler, fiyatlar, kategoriler)
     * Z Raporu: /dashboard/z-report (Günlük ciro ve kasa kapanışı)
     * Stok Yönetimi: /dashboard/inventory (Hammadde ve depolar)
     * Personel Yönetimi: /dashboard/staff (Çalışanlar, PIN kodları ve yetkiler)
     * Sistem Ayarları: /dashboard/settings (Firma bilgileri, Wi-Fi, yazıcılar)
4. SİSTEMDE İŞLEM YAPMA (MASAYA ÜRÜN EKLEME):
   - Kullanıcı "Masa 5'e 1 hamburger menü", "masa 2 ye 2 kola ekle" gibi bir komut verdiğinde:
     * Mevcut Masalar Listesinden (${JSON.stringify(
       tables.map((t: { id: string; label: string; section: string | null }) => ({
         id: t.id,
         label: t.label,
         section: t.section,
       })),
     )}) ilgili masayı bul.
     * Mevcut Menü Ürünleri Listesinden (${JSON.stringify(
       menuItems.map((m: { id: string; name: string; price: any }) => ({
         id: m.id,
         name: m.name,
         price: Number(m.price),
       })),
     )}) ilgili ürünü bul.
     * EĞER ürün adı veya masa numarası tam net değilse ya da birden fazla seçenek varsa:
       "needsClarification": true yap, "clarificationOptions" içine seçenekleri koy ve kullanıcıya "Bunu mu demek istediniz?" diye sor.
     * EĞER ürün ve masa net olarak tespit edildiyse:
       HER ZAMAN "actionPreview" nesnesi oluştur:
       {
         "type": "ADD_ORDER_ITEM",
         "tableId": "<Masa ID>",
         "tableLabel": "<Masa Adı / No>",
         "menuItemId": "<Ürün ID>",
         "menuItemName": "<Ürün Adı>",
         "quantity": <Adet (sayı)>,
         "unitPrice": <Birim Fiyat>,
         "totalPrice": <Toplam Fiyat>
       }
       Yanıtında da "Masa {X} için {adet} adet {ürün} siparişini hazırladım. Eklemek için lütfen aşağıdaki karttan onaylayınız." şeklinde nazikçe belirt.
5. YANIT FORMATI:
   Yanıtını YALNIZCA geçerli bir JSON nesnesi olarak döndür. JSON formatı şöyle olmalıdır:
   {
     "reply": "Kullanıcıya gösterilecek Türkçe açıklama veya cevap",
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

    // Prepare messages for OpenRouter
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

    return success<AiAssistantResponse>({
      reply: parsed.reply || "İşleminiz hazırlandı.",
      recommendedPage: parsed.recommendedPage || null,
      actionPreview: parsed.actionPreview || null,
      clarificationOptions: Array.isArray(parsed.clarificationOptions)
        ? parsed.clarificationOptions
        : [],
      userRole: role,
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
): Promise<ActionResult<{ orderId: string; message: string }>> {
  try {
    const auth = await resolveUserAuthContext();
    if (!auth) {
      return failure("Oturum süresi dolmuş. Lütfen tekrar giriş yapınız.");
    }

    const { restaurantId, role, allowedRoutes, isManager, userId, staffId } = auth;

    // Permission check for ordering
    const canManageOrders =
      isManager ||
      !allowedRoutes ||
      allowedRoutes.includes("/dashboard/orders") ||
      allowedRoutes.includes("/dashboard/pos") ||
      role === "WAITER";

    if (!canManageOrders) {
      return failure("Sipariş alma ve masaya ürün ekleme yetkiniz bulunmamaktadır.");
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
      // Add items to existing order and fire to kitchen
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
      // Create a brand new Dine-In order for this table
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
