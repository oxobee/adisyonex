"use server";

import { prisma } from "@/lib/prisma";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { getManagerById } from "@/services/user.service";
import { callOpenRouter } from "@/services/ai/openrouter.service";
import { createOrder, addItems, fireOrder } from "@/services/order.service";
import { getTurkeyDayRange } from "@/services/z-report.service";
import { success, failure, type ActionResult } from "@/types";

export interface AiMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface AiActionVariant {
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

export interface AiActionModifier {
  readonly id: string;
  readonly name: string;
  readonly priceDelta: number;
}

export interface AiActionModifierGroup {
  readonly id: string;
  readonly name: string;
  readonly isRequired: boolean;
  readonly minSelect: number;
  readonly maxSelect: number;
  readonly modifiers: readonly AiActionModifier[];
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
  readonly hasOptions?: boolean;
  readonly variants?: readonly AiActionVariant[];
  readonly modifierGroups?: readonly AiActionModifierGroup[];
  readonly selectedVariantId?: string | null;
  readonly selectedModifierIds?: readonly string[];
  readonly lineNote?: string | null;
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

function findBestMatchingTable(
  query: string,
  tables: Array<{ id: string; label: string; section?: string | null }>,
  suggestedId?: string | null,
  suggestedLabel?: string | null
): { id: string; label: string } | null {
  if (!tables || tables.length === 0) return null;

  const cleanQuery = query.toLowerCase().trim();

  // 1. Explicit number patterns: "masa 5", "masa - 5", "5 nolu masa", "5'e hamburger", "masa-3"
  const numberPatterns = [
    /(?:masa|table)\s*[-–—:]*\s*(\d+)/i,
    /(\d+)\s*(?:nolu|numaralı|\.)?\s*(?:masa|table)/i,
    /(?:^|\s)(\d+)\s*['’]?(?:e|a|ye|ya|de|da)\b/i,
  ];

  let targetNumber: string | null = null;
  for (const pattern of numberPatterns) {
    const match = cleanQuery.match(pattern);
    if (match && match[1]) {
      targetNumber = match[1];
      break;
    }
  }

  if (targetNumber) {
    // Exact digit matching against table labels (e.g., target 5 matches "Masa - 5", "Masa 5", "5")
    const exactMatch = tables.find((t) => {
      const numMatch = t.label.match(/\d+/);
      return numMatch && numMatch[0] === targetNumber;
    });
    if (exactMatch) return exactMatch;
  }

  // 2. Direct string match against full table labels (longest label first)
  const sortedByLabelLength = [...tables].sort((a, b) => b.label.length - a.label.length);
  for (const t of sortedByLabelLength) {
    const normLabel = t.label.toLowerCase().replace(/[-–—\s]+/g, " ").trim();
    const queryNorm = cleanQuery.replace(/[-–—\s]+/g, " ");
    if (queryNorm.includes(normLabel)) {
      return t;
    }
  }

  // 3. Fallback to suggestedId or suggestedLabel from LLM if valid
  if (suggestedId) {
    const byId = tables.find((t) => t.id === suggestedId);
    if (byId) return byId;
  }

  if (suggestedLabel) {
    const cleanSuggested = suggestedLabel.toLowerCase().trim();
    const byLabel = tables.find(
      (t) =>
        t.label.toLowerCase() === cleanSuggested ||
        t.label.toLowerCase().replace(/[-–—\s]+/g, "") === cleanSuggested.replace(/[-–—\s]+/g, "")
    );
    if (byLabel) return byLabel;

    const numMatch = suggestedLabel.match(/\d+/);
    if (numMatch) {
      const byNum = tables.find((t) => {
        const tn = t.label.match(/\d+/);
        return tn && tn[0] === numMatch[0];
      });
      if (byNum) return byNum;
    }
  }

  return null;
}

function findBestMatchingMenuItem(
  query: string,
  menuItems: Array<any>,
  suggestedId?: string | null,
  suggestedName?: string | null
): any | null {
  if (!menuItems || menuItems.length === 0) return null;

  // 1. If suggestedId is valid
  if (suggestedId) {
    const byId = menuItems.find((m) => m.id === suggestedId);
    if (byId) return byId;
  }

  // 2. Exact or substring match with suggestedName
  if (suggestedName) {
    const cleanSuggested = suggestedName.toLowerCase().trim();
    const exact = menuItems.find((m) => m.name.toLowerCase() === cleanSuggested);
    if (exact) return exact;

    const partial = menuItems.find(
      (m) =>
        m.name.toLowerCase().includes(cleanSuggested) ||
        cleanSuggested.includes(m.name.toLowerCase())
    );
    if (partial) return partial;
  }

  // 3. Match against query text (longest dish name first)
  const cleanQuery = query.toLowerCase();
  const sortedByNameLength = [...menuItems].sort((a, b) => b.name.length - a.name.length);
  for (const item of sortedByNameLength) {
    if (cleanQuery.includes(item.name.toLowerCase())) {
      return item;
    }
  }

  // 4. Token overlap
  for (const item of menuItems) {
    const words = item.name.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 3);
    if (words.some((w: string) => cleanQuery.includes(w))) {
      return item;
    }
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

    const { dayStart: todayStart, dayEnd: todayEnd, formattedDate: todayFormatted } = getTurkeyDayRange();
    const yesterdayDate = new Date(todayStart.getTime() - 12 * 3600 * 1000);
    const { dayStart: yesterdayStart, dayEnd: yesterdayEnd, formattedDate: yesterdayFormatted } = getTurkeyDayRange(yesterdayDate);

    // Fetch details according to permissions (PREVENTS DATA LEAKAGE TO LLM PROMPT)
    const restaurantPromise = prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, branchName: true },
    });

    const tablesPromise = canManageOrders
      ? prisma.diningTable.findMany({
          where: { restaurantId, deletedAt: null },
          select: {
            id: true,
            label: true,
            section: true,
            seats: true,
            orders: {
              where: { status: "OPEN", deletedAt: null },
              select: {
                id: true,
                orderNumber: true,
                grandTotal: true,
                billRequestedAt: true,
                note: true,
                items: {
                  where: { state: { not: "VOID" } },
                  select: { quantity: true, unitPrice: true, name: true },
                },
              },
            },
          },
          orderBy: { label: "asc" },
        })
      : Promise.resolve([]);

    const financialPromise = canViewFinancials
      ? (async () => {
          const [completedOrders, openOrders, yesterdayOrders, yesterdayZReport] = await Promise.all([
            prisma.order.findMany({
              where: {
                restaurantId,
                status: "COMPLETED",
                createdAt: { gte: todayStart, lte: todayEnd },
                deletedAt: null,
              },
              select: {
                grandTotal: true,
                payments: { select: { mode: true, amount: true } },
                items: {
                  where: { state: { not: "VOID" } },
                  select: { quantity: true, unitPrice: true },
                },
              },
            }),
            prisma.order.findMany({
              where: {
                restaurantId,
                status: "OPEN",
                deletedAt: null,
              },
              select: {
                id: true,
                grandTotal: true,
                items: {
                  where: { state: { not: "VOID" } },
                  select: { quantity: true, unitPrice: true },
                },
              },
            }),
            prisma.order.findMany({
              where: {
                restaurantId,
                status: "COMPLETED",
                createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
                deletedAt: null,
              },
              select: {
                grandTotal: true,
                payments: { select: { mode: true, amount: true } },
                items: {
                  where: { state: { not: "VOID" } },
                  select: { quantity: true, unitPrice: true },
                },
              },
            }),
            prisma.zReport.findFirst({
              where: {
                restaurantId,
                reportDate: { gte: yesterdayStart, lte: yesterdayEnd },
              },
              select: { netSales: true, grossSales: true, orderCount: true, cashSales: true },
            }),
          ]);

          let todayTotal = 0;
          let cashTotal = 0;
          let cardTotal = 0;
          let otherTotal = 0;

          for (const ord of completedOrders) {
            const itemsSum = ord.items.reduce(
              (s, it) => s + Number(it.unitPrice || 0) * (it.quantity || 1),
              0
            );
            const amt = Number(ord.grandTotal) > 0 ? Number(ord.grandTotal) : itemsSum;
            todayTotal += amt;
            for (const p of ord.payments) {
              const amt = Number(p.amount || 0);
              if (p.mode === "CASH") cashTotal += amt;
              else if (p.mode === "CARD") cardTotal += amt;
              else otherTotal += amt;
            }
          }

          let openTablesTotal = 0;
          for (const ord of openOrders) {
            const itemsSum = ord.items.reduce(
              (s, it) => s + Number(it.unitPrice || 0) * (it.quantity || 1),
              0
            );
            openTablesTotal += itemsSum > 0 ? itemsSum : Number(ord.grandTotal || 0);
          }

          let yesterdayRevenue = 0;
          let yesterdayCash = 0;
          let yesterdayCard = 0;
          let yesterdayCount = yesterdayOrders.length;

          for (const ord of yesterdayOrders) {
            const itemsSum = ord.items.reduce(
              (s, it) => s + Number(it.unitPrice || 0) * (it.quantity || 1),
              0
            );
            yesterdayRevenue += Number(ord.grandTotal) > 0 ? Number(ord.grandTotal) : itemsSum;

            for (const p of ord.payments) {
              const amt = Number(p.amount || 0);
              if (p.mode === "CASH") yesterdayCash += amt;
              else if (p.mode === "CARD") yesterdayCard += amt;
            }
          }

          if (yesterdayZReport) {
            const zAmt = Number(yesterdayZReport.netSales || yesterdayZReport.grossSales || 0);
            if (zAmt > 0) {
              yesterdayRevenue = zAmt;
              yesterdayCount = yesterdayZReport.orderCount || yesterdayCount;
            }
          }

          return {
            todayCompletedRevenue: todayTotal,
            todayCompletedOrdersCount: completedOrders.length,
            cashTotal,
            cardTotal,
            otherTotal,
            openOrdersCount: openOrders.length,
            openTablesTotal,
            yesterdayRevenue,
            yesterdayCount,
            yesterdayCash,
            yesterdayCard,
            yesterdayFormatted,
            todayFormatted,
          };
        })().catch(() => null)
      : Promise.resolve(null);

    const lowStockPromise = isManager
      ? prisma.stockItem
          .findMany({
            where: {
              restaurantId,
              deletedAt: null,
              reorderLevel: { not: null },
            },
            select: { name: true, onHand: true, reorderLevel: true, unit: true },
            take: 20,
          })
          .then((items) =>
            items.filter(
              (i) => i.reorderLevel !== null && Number(i.onHand) <= Number(i.reorderLevel)
            )
          )
          .catch(() => [])
      : Promise.resolve([]);

    const menuItemsPromise = canManageOrders
      ? prisma.menuItem.findMany({
          where: { restaurantId, deletedAt: null, isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            category: { select: { name: true } },
            variants: {
              where: { deletedAt: null, isActive: true },
              select: { id: true, name: true, price: true, sortOrder: true },
              orderBy: { sortOrder: "asc" },
            },
            modifierGroups: {
              select: {
                sortOrder: true,
                modifierGroup: {
                  select: {
                    id: true,
                    name: true,
                    isRequired: true,
                    minSelect: true,
                    maxSelect: true,
                    modifiers: {
                      where: { isActive: true },
                      select: { id: true, name: true, priceDelta: true, sortOrder: true },
                      orderBy: { sortOrder: "asc" },
                    },
                  },
                },
              },
              orderBy: { sortOrder: "asc" },
            },
          },
          take: 150,
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

    const [restaurant, tables, menuItems, kitchenTickets, financialData, lowStockItems] =
      await Promise.all([
        restaurantPromise,
        tablesPromise,
        menuItemsPromise,
        kitchenTicketsPromise,
        financialPromise,
        lowStockPromise,
      ]);

    const restaurantName = restaurant?.name || "Restoran";
    const currency = "₺";

    // Build role specific strict instructions
    let roleInstructions = "";

    const occupiedTables = tables.filter((t) => t.orders && t.orders.length > 0);
    const emptyTablesCount = tables.length - occupiedTables.length;

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
- MASA DURUMU: Toplam ${tables.length} masa (${occupiedTables.length} Dolu, ${emptyTablesCount} Boş).
${
  occupiedTables.length > 0
    ? `- DOLU MASALAR: ${JSON.stringify(
        occupiedTables.map((t) => ({
          masa: t.label,
          salon: t.section,
          kalemSayisi: t.orders.flatMap((o) => o.items).reduce((s, i) => s + i.quantity, 0),
          hesapIstendiMi: t.orders.some((o) => o.billRequestedAt !== null) ? "Evet" : "Hayır",
        }))
      )}`
    : "- Tüm masalar boş."
}
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
${
  financialData
    ? `- BUGÜNKÜ TAMAMLANAN HASILAT: ${currency}${financialData.todayCompletedRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (Nakit: ${currency}${financialData.cashTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}, Kredi Kartı: ${currency}${financialData.cardTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })})
- ŞU AN AÇIK HESAP TOPLAMI: ${currency}${financialData.openTablesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (${financialData.openOrdersCount} açık masa)`
    : ""
}
- MASA DURUMU: Toplam ${tables.length} masa (${occupiedTables.length} Dolu, ${emptyTablesCount} Boş).

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

CANLI RESTORAN VERİLERİ (GÜNCEL DURUM BİLGİLERİ):
${
  financialData
    ? `- BUGÜNKÜ TAMAMLANAN TOPLAM CİRO (${financialData.todayFormatted}): ${currency}${financialData.todayCompletedRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (${financialData.todayCompletedOrdersCount} adet tamamlanan adisyon)
  * Tahsilat Detayı: Nakit: ${currency}${financialData.cashTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}, Kredi Kartı: ${currency}${financialData.cardTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}${financialData.otherTotal > 0 ? `, Diğer: ${currency}${financialData.otherTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : ""}
- DÜNKÜ TOPLAM CİRO (${financialData.yesterdayFormatted}): ${currency}${financialData.yesterdayRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (${financialData.yesterdayCount} adet tamamlanan adisyon)
- ŞU AN MASALARDAKİ AÇIK HESAP TOPLAMI: ${currency}${financialData.openTablesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} (${financialData.openOrdersCount} açık masa/adisyon)`
    : ""
}
- MASA DOLULUK DURUMU: Toplam ${tables.length} masa (${occupiedTables.length} Dolu, ${emptyTablesCount} Boş).
${
  occupiedTables.length > 0
    ? `- DOLU MASALAR VE HESAPLARI: ${JSON.stringify(
        occupiedTables.map((t) => {
          const tSum = t.orders.reduce((sum, o) => {
            const itemsSum = o.items.reduce(
              (s, it) => s + Number(it.unitPrice || 0) * it.quantity,
              0
            );
            return sum + (itemsSum > 0 ? itemsSum : Number(o.grandTotal || 0));
          }, 0);
          return {
            masa: t.label,
            salon: t.section,
            tutar: tSum.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " " + currency,
            kalemSayisi: t.orders
              .flatMap((o) => o.items)
              .reduce((s, i) => s + i.quantity, 0),
            hesapIstendiMi: t.orders.some((o) => o.billRequestedAt !== null)
              ? "Evet (Hesap İstendi)"
              : "Hayır",
          };
        })
      )}`
    : "- Şu anda tüm masalar boştur."
}
${
  lowStockItems.length > 0
    ? `- KRİTİK SEVİYEDEKİ STOKLAR (AZALANLAR): ${JSON.stringify(
        lowStockItems.map(
          (s) =>
            `${s.name}: ${s.onHand} ${s.unit || "adet"} kaldı (Kritik sınır: ${s.reorderLevel})`
        )
      )}`
    : "- Kritik seviyede azalan stok bulunmuyor."
}
${
  kitchenTickets.length > 0
    ? `- MUTFAKTA BEKLEYEN / HAZIRLANAN SİPARİŞLER: ${JSON.stringify(
        kitchenTickets.map(
          (k) =>
            `${k.quantity}x ${k.name} (${k.state === "FIRED" ? "Hazırlanıyor" : "Servise Hazır"}) - Masa: ${k.order?.tableLabel || `#${k.order?.orderNumber}`}`
        )
      )}`
    : "- Mutfakta bekleyen sipariş yok."
}
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

2. SORULAN SORUYU MUTLAKA ÖZET OLARAK DOĞRU ZAMAN VE RAKAMLARLA CEVAPLA (EN ÖNEMLİ KURAL):
   - Kullanıcı bir bilgi sorduğunda (örn: dünkü ciro, bugünkü ciro, masalardaki açık hesaplar, doluluk, mutfak, menü, stok vb.), ASLA "Şu sayfadan ulaşabilirsiniz", "Bu bilgiye oradan bakabilirsiniz" diyerek geçiştirme!
   - SORUDAKİ ZAMAN VE KAPSAM KAVRAMINA (BUGÜN MÜ, DÜN MÜ, ŞU ANKİ AÇIK HESAPLAR MI) KESİNLİKLE DİKKAT ET:
     * DÜNKÜ CİRO sorulduğunda ("dün ne kadar ciro", "dünkü ciro", "dünkü hasılat"): SADECE DÜNKÜ CİROYU (${financialData ? currency + financialData.yesterdayRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "bilgi"}) söyle! ASLA bugünkü ciroyla karıştırma!
     * ŞU ANKİ AÇIK HESAPLAR / MASALARDAKİ TUTAR sorulduğunda: ŞU AN MASALARDAKİ AÇIK HESAP TOPLAMINI (${financialData ? currency + financialData.openTablesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "bilgi"}) söyle! Masalarda açık hesap varken asla 0 TL deme!
     * BUGÜNKÜ CİRO sorulduğunda ("bugünkü ciro", "bugün hasılat", "toplam ciro"): BUGÜNKÜ TAMAMLANAN CİROYU (${financialData ? currency + financialData.todayCompletedRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "bilgi"}) söyle ve masalardaki açık hesap tutarını (${financialData ? currency + financialData.openTablesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "bilgi"}) ekle.
   - Örnek: "dün ne kadar ciro" ->
     "Dünkü (${financialData?.yesterdayFormatted || "Dün"}) toplam tamamlanan ciro **${currency}${financialData?.yesterdayRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) || "0,00"}**'dir (${financialData?.yesterdayCount || 0} adisyon tamamlandı)."
   - Örnek: "masalarda ne kadar açık hesap var" ->
     "Şu anda masalarda toplam **${currency}${financialData?.openTablesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) || "0,00"}** tutarında açık hesap bulunmaktadır (${financialData?.openOrdersCount || 0} açık masa)."
   - Örnek: "Hangi masalar dolu?" ->
     "Şu an ${occupiedTables.length} masa dolu durumdadır: ${occupiedTables
       .map((t) => {
         const tSum = t.orders.reduce((sum, o) => {
           const itemsSum = o.items.reduce((s, it) => s + Number(it.unitPrice || 0) * it.quantity, 0);
           return sum + (itemsSum > 0 ? itemsSum : Number(o.grandTotal || 0));
         }, 0);
         return `${t.label} (${tSum.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency})`;
       })
       .join(", ")}. Kalan ${emptyTablesCount} masa boştur."

3. YANITIN ALTINA İLGİLİ ALANIN KARTINI (recommendedPage) MUTLAKA EKLE:
   - Soru ve özet cevabın konusuna göre, kullanıcının tek tıkla ilgili sayfaya geçebilmesi için MUTLAKA "recommendedPage" kartı nesnesi oluştur:
     * Ciro / Kasa hasılatı / Z Raporu / Ödemeler / Finans ->
       recommendedPage: { "title": "Finansal Raporlar & Z Raporu", "url": "/dashboard/z-report", "description": "Günlük ve geçmiş ciro, tahsilatlar, ödeme türleri ve Z raporu", "icon": "report" }
     * Masalar / Doluluk / Açık Hesaplar / Salon ->
       recommendedPage: { "title": "Masalar & Canlı Adisyonlar", "url": "/dashboard/orders", "description": "Canlı masa doluluğu, salon planı ve açık adisyon yönetimi", "icon": "table" }
     * Kasa Satış / POS / Hızlı Satış ->
       recommendedPage: { "title": "Kasa Satış Terminali (POS)", "url": "/dashboard/pos", "description": "Hızlı satış, adisyon tahsilatı ve masa ödemeleri", "icon": "pos" }
     * Mutfak / Yemek Hazırlığı / KDS ->
       recommendedPage: { "title": "Mutfak Hazırlık Ekranı (KDS)", "url": "/dashboard/kitchen", "description": "Sipariş hazırlık süreleri, bekleyen tabaklar ve mutfak akışı", "icon": "kitchen" }
     * Menü / Ürünler / Fiyatlar / Kategoriler ->
       recommendedPage: { "title": "Menü Yönetimi", "url": "/dashboard/menu", "description": "Ürünler, kategoriler, porsiyonlar ve fiyat güncellemeleri", "icon": "menu" }
     * Stok / Depo / Kritik Malzemeler ->
       recommendedPage: { "title": "Stok & Envanter Yönetimi", "url": "/dashboard/inventory", "description": "Hammadde sayımları, kritik stok uyarıları ve depo takibi", "icon": "stock" }
     * Personel / Çalışanlar / Garsonlar ->
       recommendedPage: { "title": "Personel Yönetimi", "url": "/dashboard/staff", "description": "Çalışan listesi, roller, PIN kodları ve yetkilendirme", "icon": "staff" }
     * Ayarlar / Yazıcı / QR Menü / Genel ->
       recommendedPage: { "title": "Restoran & Sistem Ayarları", "url": "/dashboard/settings", "description": "Restoran profili, yazıcılar, QR menü ve sistem tercihleri", "icon": "settings" }

4. MASAYA SİPARİŞ EKLEME İŞLEMİ:
   - Yalnızca sipariş yetkisi olan kullanıcılarda (${canManageOrders ? "VAR" : "YOK"}), "Masa 5'e 1 hamburger" gibi komutlarda:
     * Ürün ve masa tespit edildiğinde HER ZAMAN "actionPreview" nesnesi üret ve kullanıcıya karttan onaylamasını söyle.
     * Karışıklık varsa "needsClarification": true ve "clarificationOptions" içine seçenekleri koy.
     * Sipariş yetkisi olmayan kullanıcılar (örn. Aşçı) masaya ürün eklemek isterse: KESİNLİKLE REDDET!

5. YANIT FORMATI:
   Yanıtını YALNIZCA geçerli bir JSON nesnesi olarak döndür:
   {
     "reply": "Kullanıcıya gösterilecek Türkçe özet cevap veya onay açıklaması",
     "needsClarification": false,
     "clarificationOptions": ["Seçenek 1", "Seçenek 2"],
     "recommendedPage": {
       "title": "Sayfa Başlığı",
       "url": "/dashboard/...",
       "description": "Kısa açıklama",
       "icon": "table" | "kitchen" | "pos" | "menu" | "report" | "stock" | "staff" | "settings"
     } | null,
     "actionPreview": {
       "type": "ADD_ORDER_ITEM",
       "tableId": "Verilen MEVCUT MASALAR listesindeki masanın gerçek id değeri",
       "tableLabel": "Masanın tam etiketi (örn: Masa - 5)",
       "menuItemId": "Verilen MENÜ ÜRÜNLERİ listesindeki ürünün gerçek id değeri",
       "menuItemName": "Menüdeki tam ürün adı",
       "quantity": 1,
       "unitPrice": 150,
       "totalPrice": 150
     } | null
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

    // Deterministic validation & normalization of actionPreview
    let validatedActionPreview: AiActionPreview | null = null;
    if (parsed.actionPreview && canManageOrders) {
      const raw = parsed.actionPreview;
      const matchedTable = findBestMatchingTable(
        userQuery,
        tables,
        raw.tableId || raw.table_id,
        raw.tableLabel || raw.table_label || raw.table || raw.tableName,
      );
      const matchedItem = findBestMatchingMenuItem(
        userQuery,
        menuItems,
        raw.menuItemId || raw.menu_item_id || raw.itemId,
        raw.menuItemName || raw.menu_item_name || raw.itemName || raw.name,
      );

      if (matchedTable && matchedItem) {
        const qty = Math.max(1, Math.min(99, Number(raw.quantity) || 1));
        const unitPrice = Number(matchedItem.price) || 0;
        const totalPrice = unitPrice * qty;

        const variants: AiActionVariant[] = (matchedItem.variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          price: Number(v.price),
        }));

        const modifierGroups: AiActionModifierGroup[] = (matchedItem.modifierGroups || []).map(
          (mg: any) => ({
            id: mg.modifierGroup.id,
            name: mg.modifierGroup.name,
            isRequired: Boolean(mg.modifierGroup.isRequired),
            minSelect: mg.modifierGroup.minSelect ?? 0,
            maxSelect: mg.modifierGroup.maxSelect ?? 1,
            modifiers: (mg.modifierGroup.modifiers || []).map((m: any) => ({
              id: m.id,
              name: m.name,
              priceDelta: Number(m.priceDelta),
            })),
          }),
        );

        const hasOptions = variants.length > 0 || modifierGroups.length > 0;

        validatedActionPreview = {
          type: "ADD_ORDER_ITEM",
          tableId: matchedTable.id,
          tableLabel: matchedTable.label,
          menuItemId: matchedItem.id,
          menuItemName: matchedItem.name,
          quantity: qty,
          unitPrice,
          totalPrice,
          hasOptions,
          variants,
          modifierGroups,
        };
      }
    }

    // 1. Intelligently infer and safeguard recommendedPage
    let finalRecommendedPage: AiRecommendedPage | null = parsed.recommendedPage || null;

    if (finalRecommendedPage) {
      const url = finalRecommendedPage.url || "";
      if (url.includes("z-report") && !canViewFinancials) finalRecommendedPage = null;
      if (url.includes("orders") && !canManageOrders) finalRecommendedPage = null;
      if (url.includes("kitchen") && !canViewKitchen) finalRecommendedPage = null;
      if (url.includes("inventory") && !isManager) finalRecommendedPage = null;
      if (url.includes("staff") && !canManageStaff) finalRecommendedPage = null;
      if (url.includes("settings") && !canManageSettings) finalRecommendedPage = null;
    }

    if (!finalRecommendedPage) {
      const combined = `${userQuery} ${parsed.reply || ""}`.toLowerCase();

      if (
        canViewFinancials &&
        (combined.includes("ciro") ||
          combined.includes("hasılat") ||
          combined.includes("kazanç") ||
          combined.includes("gelir") ||
          combined.includes("z rapor") ||
          combined.includes("finans") ||
          combined.includes("rapor") ||
          combined.includes("kasa") ||
          combined.includes("tahsilat"))
      ) {
        finalRecommendedPage = {
          title: "Finansal Raporlar & Z Raporu",
          url: "/dashboard/z-report",
          description: "Günlük ciro, tahsilatlar, ödeme türleri ve Z raporu detayları",
          icon: "report",
        };
      } else if (
        canManageOrders &&
        (combined.includes("masa") ||
          combined.includes("adisyon") ||
          combined.includes("salon") ||
          combined.includes("dolu") ||
          combined.includes("boş") ||
          combined.includes("hesap iste") ||
          combined.includes("garson çağrı"))
      ) {
        finalRecommendedPage = {
          title: "Masalar & Canlı Adisyonlar",
          url: "/dashboard/orders",
          description: "Canlı masa doluluğu, salon planı ve açık adisyon yönetimi",
          icon: "table",
        };
      } else if (
        canViewKitchen &&
        (combined.includes("mutfak") ||
          combined.includes("aşçı") ||
          combined.includes("hazır") ||
          combined.includes("piş") ||
          combined.includes("kds") ||
          combined.includes("tabak"))
      ) {
        finalRecommendedPage = {
          title: "Mutfak Hazırlık Ekranı (KDS)",
          url: "/dashboard/kitchen",
          description: "Sipariş hazırlık süreleri, bekleyen tabaklar ve mutfak akışı",
          icon: "kitchen",
        };
      } else if (
        canManageOrders &&
        (combined.includes("pos") ||
          combined.includes("hızlı satış") ||
          combined.includes("barkod") ||
          combined.includes("ödeme al"))
      ) {
        finalRecommendedPage = {
          title: "Kasa Satış Terminali (POS)",
          url: "/dashboard/pos",
          description: "Hızlı satış, adisyon tahsilatı ve masa ödemeleri",
          icon: "pos",
        };
      } else if (
        canManageOrders &&
        (combined.includes("menü") ||
          combined.includes("fiyat") ||
          combined.includes("ürün") ||
          combined.includes("kategori") ||
          combined.includes("porsiyon") ||
          combined.includes("yemek"))
      ) {
        finalRecommendedPage = {
          title: "Menü Yönetimi",
          url: "/dashboard/menu",
          description: "Ürünler, kategoriler, porsiyonlar ve fiyat güncellemeleri",
          icon: "menu",
        };
      } else if (
        isManager &&
        (combined.includes("stok") ||
          combined.includes("envanter") ||
          combined.includes("depo") ||
          combined.includes("hammadde") ||
          combined.includes("kalan"))
      ) {
        finalRecommendedPage = {
          title: "Stok & Envanter Yönetimi",
          url: "/dashboard/inventory",
          description: "Hammadde sayımları, kritik stok uyarıları ve depo takibi",
          icon: "stock",
        };
      } else if (
        canManageStaff &&
        (combined.includes("personel") ||
          combined.includes("garson") ||
          combined.includes("çalışan") ||
          combined.includes("maaş") ||
          combined.includes("pin"))
      ) {
        finalRecommendedPage = {
          title: "Personel Yönetimi",
          url: "/dashboard/staff",
          description: "Çalışan listesi, roller, PIN kodları ve yetkilendirme",
          icon: "staff",
        };
      } else if (
        canManageSettings &&
        (combined.includes("ayar") ||
          combined.includes("yazıcı") ||
          combined.includes("qr") ||
          combined.includes("wifi") ||
          combined.includes("şube"))
      ) {
        finalRecommendedPage = {
          title: "Restoran & Sistem Ayarları",
          url: "/dashboard/settings",
          description: "Restoran profili, yazıcılar, QR menü ve sistem tercihleri",
          icon: "settings",
        };
      }
    }

    // 2. Safeguard: If user asked about revenue / open balance / tables and reply was evasive or inaccurate, replace with accurate summary
    let finalReply = parsed.reply || "İşleminiz tamamlandı.";
    const qLower = userQuery.toLowerCase().trim();
    const isYesterdayQuery =
      qLower.includes("dün") ||
      qLower.includes("dun") ||
      qLower.includes("gecen gun") ||
      qLower.includes("geçen gün") ||
      qLower.includes("önceki gün") ||
      qLower.includes("onceki gun");
    const isOpenBalanceQuery =
      qLower.includes("açık") ||
      qLower.includes("acik") ||
      qLower.includes("masada") ||
      qLower.includes("masalarda") ||
      qLower.includes("bekleyen hesap");

    if (financialData) {
      if (
        isYesterdayQuery &&
        (qLower.includes("ciro") ||
          qLower.includes("hasılat") ||
          qLower.includes("kazanç") ||
          qLower.includes("kadar") ||
          qLower.includes("ne"))
      ) {
        if (
          finalReply.includes("sayfasından") ||
          finalReply.toLowerCase().includes("bugün") ||
          !finalReply.includes("₺")
        ) {
          finalReply = `Dünkü (${financialData.yesterdayFormatted}) toplam tamamlanan ciro **${currency}${financialData.yesterdayRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}**'dir (${financialData.yesterdayCount} adisyon tamamlandı).`;
        }
      } else if (
        isOpenBalanceQuery &&
        (qLower.includes("hesap") ||
          qLower.includes("para") ||
          qLower.includes("tutar") ||
          qLower.includes("ciro") ||
          qLower.includes("kadar") ||
          qLower.includes("var"))
      ) {
        if (
          finalReply.includes("0,00") ||
          finalReply.includes("0 tl") ||
          finalReply.includes("sayfasından") ||
          !finalReply.includes("₺")
        ) {
          finalReply = `Şu anda masalarda toplam **${currency}${financialData.openTablesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}** tutarında açık hesap bulunmaktadır (${financialData.openOrdersCount} açık masa).`;
        }
      } else if (
        qLower.includes("ciro") &&
        !isYesterdayQuery &&
        (finalReply.includes("sayfasından") ||
          !finalReply.includes("₺") ||
          finalReply.includes("0,00 tutarında açık hesap") ||
          finalReply.includes("₺0,00 tutarında açık hesap"))
      ) {
        finalReply = `Bugünkü toplam tamamlanan ciro **${currency}${financialData.todayCompletedRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}**'dir. Gün içinde toplam ${financialData.todayCompletedOrdersCount} adisyon tamamlanmıştır (Nakit: ${currency}${financialData.cashTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}, Kredi Kartı: ${currency}${financialData.cardTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}). Ayrıca şu anda masalarda ${currency}${financialData.openTablesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} tutarında açık hesap bulunmaktadır.`;
      }
    }

    if (
      qLower.includes("hangi masalar") ||
      (qLower.includes("masa") && qLower.includes("dolu"))
    ) {
      if (
        finalReply.includes("sayfasından ulaşabilirsiniz") ||
        finalReply.includes("sayfasından görebilirsiniz") ||
        finalReply.includes("sayfasından inceleyebilirsiniz") ||
        finalReply.includes("0,00 ₺") ||
        finalReply.includes("₺0,00")
      ) {
        if (occupiedTables.length === 0) {
          finalReply = `Şu anda restorandaki tüm masalar (${tables.length} masa) boştur.`;
        } else {
          finalReply = `Şu anda ${occupiedTables.length} masa doludur: ${occupiedTables
            .map((t) => {
              const tSum = t.orders.reduce((sum, o) => {
                const itemsSum = o.items.reduce(
                  (s, it) => s + Number(it.unitPrice || 0) * it.quantity,
                  0
                );
                return sum + (itemsSum > 0 ? itemsSum : Number(o.grandTotal || 0));
              }, 0);
              return `**${t.label}** (${tSum.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency})`;
            })
            .join(", ")}. Kalan ${emptyTablesCount} masa boştur.`;
        }
      }
    }

    return success<AiAssistantResponse>({
      reply: finalReply,
      recommendedPage: finalRecommendedPage,
      actionPreview: validatedActionPreview,
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
  action: {
    type?: string;
    tableId: string;
    tableLabel?: string;
    menuItemId: string;
    menuItemName?: string;
    quantity: number;
    selectedVariantId?: string | null;
    selectedModifierIds?: readonly string[];
    lineNote?: string | null;
  },
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
      return failure(`Masa bulunamadı (${action.tableLabel || action.tableId}).`);
    }

    // Verify MenuItem
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: action.menuItemId, restaurantId, deletedAt: null, isActive: true },
    });
    if (!menuItem) {
      return failure(`Ürün bulunamadı veya şu anda satışta değil (${action.menuItemName || action.menuItemId}).`);
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
    const variantId = action.selectedVariantId || undefined;
    const modifierIds = action.selectedModifierIds ? [...action.selectedModifierIds] : [];
    const lineNote = action.lineNote?.trim() || undefined;

    const formattedTableLabel = table.label.toLowerCase().startsWith("masa")
      ? table.label
      : `Masa ${table.label}`;

    if (openOrder) {
      await addItems(orderCtx, {
        orderId: openOrder.id,
        items: [
          {
            menuItemId: menuItem.id,
            quantity,
            variantId,
            modifierIds,
            lineNote,
            isComp: false,
          },
        ],
      });
      await fireOrder(orderCtx, openOrder.id);

      return success({
        orderId: openOrder.id,
        message: `${formattedTableLabel} siparişine ${quantity}x ${menuItem.name} başarıyla eklendi ve mutfağa iletildi.`,
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
            variantId,
            modifierIds,
            lineNote,
            isComp: false,
          },
        ],
      });

      return success({
        orderId: newOrder.id,
        message: `${formattedTableLabel} için yeni adisyon açıldı, ${quantity}x ${menuItem.name} eklendi ve mutfağa iletildi.`,
      });
    }
  } catch (error) {
    console.error("Execute AI Action Error:", error);
    return failure(
      error instanceof Error ? error.message : "İşlem gerçekleştirilirken bir hata oluştu.",
    );
  }
}
