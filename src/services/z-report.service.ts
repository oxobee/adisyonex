import { prisma } from "@/lib/prisma";
import type {
  AuditItemDTO,
  CategorySalesItem,
  ChannelSalesItem,
  DiscountSummary,
  DiscountTypeItem,
  HourlySalesPoint,
  OpenOrderItem,
  PaymentMixItem,
  PosBreakdownItem,
  StaffDiscountItem,
  StaffPerformanceItem,
  TaxSummaryItem,
  TopItemSalesItem,
  ZReportDTO,
  ZReportHistoryItem,
} from "@/types/z-report";

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown): number => Number(v) || 0;
const pad = (n: number): string => String(n).padStart(2, "0");

// Türkiye saat dilimi (UTC+3)
const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;

export function getTurkeyDayRange(dateInput?: string | Date): {
  dayStart: Date;
  dayEnd: Date;
  dateKey: string;
  formattedDate: string;
} {
  let target: Date;
  if (!dateInput) {
    target = new Date();
  } else if (typeof dateInput === "string") {
    // "YYYY-MM-DD"
    const [y, m, d] = dateInput.split("-").map(Number);
    if (y && m && d) {
      target = new Date(Date.UTC(y, m - 1, d) - TURKEY_OFFSET_MS + 12 * 3600 * 1000);
    } else {
      target = new Date(dateInput);
    }
  } else {
    target = dateInput;
  }

  const shifted = new Date(target.getTime() + TURKEY_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();

  const dayStart = new Date(Date.UTC(y, m - 1, d) - TURKEY_OFFSET_MS);
  const dayEnd = new Date(dayStart.getTime() + 86400 * 1000 - 1);
  const dateKey = `${y}-${pad(m)}-${pad(d)}`;

  const monthsTr = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const formattedDate = `${pad(d)} ${monthsTr[m - 1]} ${y}`;

  return { dayStart, dayEnd, dateKey, formattedDate };
}

/**
 * Belirli bir tarih için Z Raporu verilerini döner.
 * Eğer gün daha önce kapatılmışsa DEĞİŞTİRİLEMEZ SNAPSHOT'tan döner.
 * Açık gün ise veritabanından anlık hesaplar.
 */
export async function getZReportData(
  restaurantId: string,
  dateInput?: string,
  zReportId?: string,
  customCountedCash?: number,
): Promise<ZReportDTO> {
  const { dayStart, dayEnd, dateKey, formattedDate } = getTurkeyDayRange(dateInput);

  // 1. Eğer zReportId verilmişse veya bu gün kapanmış bir Z Raporu varsa snapshot'ı oku
  let existingReport = null;
  if (zReportId) {
    existingReport = await prisma.zReport.findFirst({
      where: { id: zReportId, restaurantId },
    });
  } else {
    existingReport = await prisma.zReport.findFirst({
      where: {
        restaurantId,
        reportDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });
  }

  if (existingReport) {
    const snapshot = existingReport.snapshotData as unknown as ZReportDTO;
    return {
      ...snapshot,
      id: existingReport.id,
      status: "CLOSED",
      zNumber: existingReport.zNumber,
      zNumberFormatted: existingReport.zNumberFormatted,
      closedAt: existingReport.closedAt.toISOString(),
      closedByName: existingReport.closedByName || "Yönetici",
      notes: existingReport.notes,
    };
  }

  // 2. AÇIK GÜN — Gerçek Canlı Veritabanı Verilerini Hesapla
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true },
  });

  const [orders, cashMovements, staffList, categories] = await Promise.all([
    prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cashMovement.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.staff.findMany({
      where: { restaurantId },
      select: { id: true, name: true, role: true, employeeCode: true },
    }),
    prisma.menuCategory.findMany({
      where: { restaurantId },
      select: { id: true, name: true },
    }),
  ]);

  const staffMap = new Map(staffList.map((s) => [s.id, s]));

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const openOrders = orders.filter((o) => o.status === "OPEN");
  const voidOrders = orders.filter((o) => o.status === "VOID");

  // Parasal Toplamlar
  let grossSales = 0;
  let discountTotal = 0;
  let compTotal = 0;
  let netSales = 0;
  let taxTotal = 0;
  let totalCollections = 0;
  let soldItemCount = 0;

  const orderAmounts: number[] = [];
  const taxMap = new Map<number, { matrah: number; taxAmount: number }>();
  const channelMap = new Map<string, { count: number; sales: number }>();
  const paymentMap = new Map<string, { count: number; amount: number; sub: Map<string, { count: number; amount: number }> }>();
  const itemMap = new Map<string, { name: string; categoryName: string; quantity: number; sales: number }>();
  const categoryMap = new Map<string, { categoryName: string; count: number; gross: number; net: number }>();
  const staffPerfMap = new Map<string, { staffName: string; role: string; count: number; sales: number; discount: number; voidTotal: number; compTotal: number }>();
  const audits: AuditItemDTO[] = [];
  const hourlyMap = new Map<string, { orders: number; sales: number }>();

  // Saatlik aralıkları 09:00 - 24:00 arası başlat
  for (let h = 9; h <= 24; h++) {
    const hh = h === 24 ? "00" : pad(h);
    hourlyMap.set(`${hh}:00`, { orders: 0, sales: 0 });
  }

  // 1. TAMAMLANMIŞ SİPARİŞLERİ İŞLE
  for (const o of completedOrders) {
    const orderNet = num(o.grandTotal);
    const orderTax = num(o.taxTotal);
    const orderDisc = num(o.discountTotal);
    const orderComp = num(o.compTotal);

    netSales += orderNet;
    taxTotal += orderTax;
    discountTotal += orderDisc;
    compTotal += orderComp;
    orderAmounts.push(orderNet);

    // Saatlik
    const orderHour = new Date(o.createdAt.getTime() + TURKEY_OFFSET_MS).getUTCHours();
    const hourKey = `${pad(orderHour)}:00`;
    const hEntry = hourlyMap.get(hourKey) || { orders: 0, sales: 0 };
    hEntry.orders += 1;
    hEntry.sales += orderNet;
    hourlyMap.set(hourKey, hEntry);

    // Satış Kanalı
    const chKey = o.orderType;
    const chEntry = channelMap.get(chKey) || { count: 0, sales: 0 };
    chEntry.count += 1;
    chEntry.sales += orderNet;
    channelMap.set(chKey, chEntry);

    // Personel Performansı
    const staffId = o.placedByStaffId || o.placedById || "MANAGER";
    const staffInfo = staffMap.get(staffId);
    const staffName = staffInfo ? staffInfo.name : "Yönetici";
    const staffRole = staffInfo ? staffInfo.role : "Yönetici";
    const sEntry = staffPerfMap.get(staffId) || {
      staffName,
      role: staffRole,
      count: 0,
      sales: 0,
      discount: 0,
      voidTotal: 0,
      compTotal: 0,
    };
    sEntry.count += 1;
    sEntry.sales += orderNet;
    sEntry.discount += orderDisc;
    sEntry.compTotal += orderComp;
    staffPerfMap.set(staffId, sEntry);

    // Sipariş Kalemleri
    for (const item of o.items) {
      const isItemVoid = item.state === "VOID";
      const uPrice = num(item.unitPrice);
      const modDelta = item.modifiers.reduce((s, m) => s + num(m.priceDelta), 0);
      const itemSingleTotal = uPrice + modDelta;
      const lineTotal = itemSingleTotal * item.quantity;

      if (isItemVoid) {
        audits.push({
          id: item.id,
          time: new Date(item.createdAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          orderNumber: o.orderNumber,
          tableLabel: o.tableLabel,
          itemName: item.name + (item.variantName ? ` (${item.variantName})` : ""),
          type: "VOID",
          quantity: item.quantity,
          amount: lineTotal,
          staffName,
          reason: item.voidReason || "İptal Edildi",
        });
        sEntry.voidTotal += lineTotal;
        continue;
      }

      if (item.isComp) {
        audits.push({
          id: item.id,
          time: new Date(item.createdAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          orderNumber: o.orderNumber,
          tableLabel: o.tableLabel,
          itemName: item.name + (item.variantName ? ` (${item.variantName})` : ""),
          type: "COMP",
          quantity: item.quantity,
          amount: lineTotal,
          staffName,
          reason: item.compReason || "İkram",
        });
      }

      grossSales += lineTotal;
      soldItemCount += item.quantity;

      // Vergi Dağılımı
      const tRate = num(item.taxRate);
      const currentTax = taxMap.get(tRate) || { matrah: 0, taxAmount: 0 };
      if (item.taxInclusive) {
        const itemMatrah = lineTotal / (1 + tRate / 100);
        const itemTax = lineTotal - itemMatrah;
        currentTax.matrah += itemMatrah;
        currentTax.taxAmount += itemTax;
      } else {
        const itemTax = (lineTotal * tRate) / 100;
        currentTax.matrah += lineTotal;
        currentTax.taxAmount += itemTax;
      }
      taxMap.set(tRate, currentTax);

      // Ürün Liderlik
      const itmKey = item.name;
      const itmEntry = itemMap.get(itmKey) || {
        name: item.name,
        categoryName: "Genel Menü",
        quantity: 0,
        sales: 0,
      };
      itmEntry.quantity += item.quantity;
      itmEntry.sales += lineTotal;
      itemMap.set(itmKey, itmEntry);
    }

    // Ödemeler
    for (const p of o.payments) {
      const pAmt = num(p.amount);
      totalCollections += pAmt;
      const pMode = p.mode;
      const pEntry = paymentMap.get(pMode) || {
        count: 0,
        amount: 0,
        sub: new Map<string, { count: number; amount: number }>(),
      };
      pEntry.count += 1;
      pEntry.amount += pAmt;

      // Kredi Kartı POS Banka Ayrımı
      if (pMode === "CARD") {
        const refName = p.reference ? p.reference.trim() : "Genel POS Terminali";
        const subEntry = pEntry.sub.get(refName) || { count: 0, amount: 0 };
        subEntry.count += 1;
        subEntry.amount += pAmt;
        pEntry.sub.set(refName, subEntry);
      }
      paymentMap.set(pMode, pEntry);
    }
  }

  // 2. İPTAL EDİLMİŞ SİPARİŞLER (VOID ORDERS)
  let voidTotal = 0;
  for (const vo of voidOrders) {
    const vAmt = num(vo.grandTotal) || num(vo.subtotal);
    voidTotal += vAmt;
    audits.push({
      id: vo.id,
      time: new Date(vo.createdAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      orderNumber: vo.orderNumber,
      tableLabel: vo.tableLabel,
      itemName: "Tüm Adisyon İptali",
      type: "VOID",
      quantity: 1,
      amount: vAmt,
      staffName: "Yönetici",
      reason: vo.voidReason || "Adisyon Komple İptal Edildi",
    });
  }

  // 3. AÇIK ADİSYONLAR
  const openOrdersList: OpenOrderItem[] = openOrders.map((oo) => {
    const amount = num(oo.grandTotal) || num(oo.subtotal);
    const openedAt = new Date(oo.createdAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const elapsedMinutes = Math.max(0, Math.round((Date.now() - oo.createdAt.getTime()) / 60000));
    return {
      orderId: oo.id,
      orderNumber: oo.orderNumber,
      tableLabel: oo.tableLabel,
      amount,
      openedAt,
      elapsedMinutes,
    };
  });
  const openOrdersTotal = openOrdersList.reduce((s, o) => s + o.amount, 0);

  // 4. KASA HAREKETLERİ & KASA MUTABAKATI
  let openingCash = 0;
  let cashInTotal = 0;
  let cashOutTotal = 0;

  const movementDTOs = cashMovements.map((cm) => {
    const amt = num(cm.amount);
    if (cm.category.toLowerCase().includes("açılış")) {
      openingCash += amt;
    } else if (cm.type === "IN") {
      cashInTotal += amt;
    } else {
      cashOutTotal += amt;
    }
    return {
      id: cm.id,
      type: cm.type,
      category: cm.category,
      amount: amt,
      description: cm.description,
      performedByName: cm.performedByName,
      createdAt: new Date(cm.createdAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const cashSales = paymentMap.get("CASH")?.amount || 0;
  const expectedCash = round2(openingCash + cashSales + cashInTotal - cashOutTotal);
  const countedCash = customCountedCash !== undefined ? customCountedCash : expectedCash;
  const cashDifference = round2(countedCash - expectedCash);
  const differenceType =
    cashDifference === 0 ? "MATCH" : cashDifference > 0 ? "SURPLUS" : "DEFICIT";

  // 5. VERGİ DÖKÜMÜ
  const taxes: TaxSummaryItem[] = Array.from(taxMap.entries())
    .map(([taxRate, val]) => ({
      taxRate,
      matrah: round2(val.matrah),
      taxAmount: round2(val.taxAmount),
      total: round2(val.matrah + val.taxAmount),
    }))
    .sort((a, b) => a.taxRate - b.taxRate);

  // 6. ÖDEME YÖNTEMLERİ LİSTESİ
  const paymentLabels: Record<string, string> = {
    CASH: "Nakit",
    CARD: "Kredi Kartı",
    UPI: "Havale / EFT",
    OTHER: "Diğer",
  };
  const payments: PaymentMixItem[] = Array.from(paymentMap.entries()).map(([mode, val]) => {
    const subBreakdown: PosBreakdownItem[] = Array.from(val.sub.entries()).map(([name, sVal]) => ({
      name,
      count: sVal.count,
      amount: round2(sVal.amount),
    }));

    return {
      mode,
      label: paymentLabels[mode] || mode,
      count: val.count,
      amount: round2(val.amount),
      percentage: totalCollections > 0 ? round2((val.amount / totalCollections) * 100) : 0,
      subBreakdown: subBreakdown.length > 0 ? subBreakdown : undefined,
    };
  });

  // 7. SATIŞ KANALLARI
  const channelLabels: Record<string, string> = {
    DINE_IN: "Masa Siparişi",
    TAKEAWAY: "Gel-Al",
    DELIVERY: "Paket Servis",
  };
  const channels: ChannelSalesItem[] = Array.from(channelMap.entries()).map(([ch, val]) => ({
    channel: ch,
    label: channelLabels[ch] || ch,
    orderCount: val.count,
    netSales: round2(val.sales),
    percentage: netSales > 0 ? round2((val.sales / netSales) * 100) : 0,
  }));

  // 8. EN ÇOK SATAN 10 ÜRÜN
  const topItems: TopItemSalesItem[] = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((item) => ({
      name: item.name,
      categoryName: item.categoryName,
      quantity: item.quantity,
      netSales: round2(item.sales),
      percentage: netSales > 0 ? round2((item.sales / netSales) * 100) : 0,
    }));

  // 9. KATEGORİ SATIŞLARI
  const categoriesList: CategorySalesItem[] = Array.from(categoryMap.values()).map((c) => ({
    categoryId: c.categoryName,
    categoryName: c.categoryName,
    itemCount: c.count,
    grossSales: round2(c.gross),
    netSales: round2(c.net),
    percentage: netSales > 0 ? round2((c.net / netSales) * 100) : 0,
  }));

  // 10. İNDİRİM ÖZETİ
  const discountTypes: DiscountTypeItem[] = [
    { type: "STAFF", label: "Personel İndirimi", count: 0, amount: 0 },
    { type: "CAMPAIGN", label: "Kampanya / Kupon", count: 0, amount: 0 },
    { type: "MANUAL", label: "Yönetici / Manuel İndirim", count: completedOrders.filter((o) => num(o.discountTotal) > 0).length, amount: round2(discountTotal) },
  ];

  const staffDiscounts: StaffDiscountItem[] = Array.from(staffPerfMap.values())
    .filter((s) => s.discount > 0)
    .map((s) => ({
      staffName: s.staffName,
      count: 1,
      amount: round2(s.discount),
    }));

  const discountsSummary: DiscountSummary = {
    total: round2(discountTotal),
    orderCount: completedOrders.filter((o) => num(o.discountTotal) > 0).length,
    avgDiscount: completedOrders.length > 0 ? round2(discountTotal / completedOrders.length) : 0,
    percentageOfSales: grossSales > 0 ? round2((discountTotal / grossSales) * 100) : 0,
    types: discountTypes,
    staffDiscounts,
  };

  // 11. PERSONEL PERFORMANSI
  const staffPerformance: StaffPerformanceItem[] = Array.from(staffPerfMap.entries()).map(([sId, val]) => ({
    staffId: sId,
    staffName: val.staffName,
    role: val.role,
    orderCount: val.count,
    netSales: round2(val.sales),
    avgOrderAmount: val.count > 0 ? round2(val.sales / val.count) : 0,
    discountTotal: round2(val.discount),
    voidTotal: round2(val.voidTotal),
    compTotal: round2(val.compTotal),
  }));

  // 12. SAATLİK SATIŞLAR
  const hourlySales: HourlySalesPoint[] = Array.from(hourlyMap.entries())
    .map(([hour, val]) => ({
      hour,
      orders: val.orders,
      sales: round2(val.sales),
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const orderCount = completedOrders.length;
  const avgOrder = orderCount > 0 ? round2(netSales / orderCount) : 0;
  const maxOrder = orderAmounts.length > 0 ? Math.max(...orderAmounts) : 0;
  const minOrder = orderAmounts.length > 0 ? Math.min(...orderAmounts) : 0;
  const avgItemPerOrder = orderCount > 0 ? round2(soldItemCount / orderCount) : 0;

  const firstOrderTime = completedOrders[0]
    ? new Date(completedOrders[0].createdAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "09:00";

  return {
    id: null,
    restaurantId,
    restaurantName: restaurant?.name || "AdisyonEx Restoran",
    status: "OPEN",
    zNumber: null,
    zNumberFormatted: null,
    date: dateKey,
    dateFormatted: formattedDate,
    openedAt: firstOrderTime,
    closedAt: null,
    closedByName: null,
    kpis: {
      grossSales: round2(grossSales),
      netSales: round2(netSales),
      totalCollections: round2(totalCollections),
      avgOrderAmount: avgOrder,
      openOrdersCount: openOrders.length,
      openOrdersTotal: round2(openOrdersTotal),
      cashDifference,
      orderCount,
      discountTotal: round2(discountTotal),
      voidTotal: round2(voidTotal),
      compTotal: round2(compTotal),
      taxTotal: round2(taxTotal),
    },
    financial: {
      grossSales: round2(grossSales),
      discountTotal: round2(discountTotal),
      voidTotal: round2(voidTotal),
      returnTotal: 0,
      compTotal: round2(compTotal),
      netSales: round2(netSales),
      orderCount,
      itemCount: soldItemCount,
      avgOrderAmount: avgOrder,
      avgItemPerOrder,
      maxOrderAmount: round2(maxOrder),
      minOrderAmount: round2(minOrder),
    },
    payments,
    cashReconciliation: {
      openingCash: round2(openingCash),
      cashSales: round2(cashSales),
      cashInTotal: round2(cashInTotal),
      cashOutTotal: round2(cashOutTotal),
      expectedCash,
      countedCash: round2(countedCash),
      cashDifference,
      differenceType,
    },
    taxes,
    channels,
    categories: categoriesList,
    topItems,
    discounts: discountsSummary,
    audits,
    staffPerformance,
    openOrders: openOrdersList,
    hourlySales,
    cashMovements: movementDTOs,
    notes: null,
  };
}

/**
 * GÜN SONUNU GÜVENLİ VE DEĞİŞTİRİLEMEZ BİÇİMDE KAPATIR (Z RAPORU ALMA)
 */
export async function closeDayAndCreateZReport(
  restaurantId: string,
  closedById: string | null,
  closedByName: string,
  countedCash: number,
  notes?: string,
): Promise<{ success: boolean; zNumberFormatted: string; reportId: string }> {
  const { dayStart, dayEnd, dateKey } = getTurkeyDayRange();

  // 1. Zaten kapatılmış mı kontrol et
  const existing = await prisma.zReport.findFirst({
    where: {
      restaurantId,
      reportDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  if (existing) {
    throw new Error(`Bugün için Z Raporu zaten alınmış (${existing.zNumberFormatted}). Bir günde yalnızca 1 kez gün sonu kapatılabilir.`);
  }

  // 2. Anlık verileri eksiksiz hesapla
  const liveData = await getZReportData(restaurantId, dateKey, undefined, countedCash);

  // 3. Transaction-safe Z Numarası üretimi ve Snapshot kaydı
  return await prisma.$transaction(async (tx) => {
    // En son Z numarasını bul
    const lastReport = await tx.zReport.findFirst({
      where: { restaurantId },
      orderBy: { zNumber: "desc" },
    });

    const nextZNumber = (lastReport?.zNumber ?? 0) + 1;
    const zNumberFormatted = `Z #${String(nextZNumber).padStart(6, "0")}`;
    const closedAt = new Date();

    // Dondurulmuş Snapshot Data
    const snapshotPayload = {
      ...liveData,
      status: "CLOSED",
      zNumber: nextZNumber,
      zNumberFormatted,
      closedAt: closedAt.toISOString(),
      closedByName,
      notes: notes || null,
      cashReconciliation: {
        ...liveData.cashReconciliation,
        countedCash,
        cashDifference: round2(countedCash - liveData.cashReconciliation.expectedCash),
      },
    };

    const created = await tx.zReport.create({
      data: {
        restaurantId,
        zNumber: nextZNumber,
        zNumberFormatted,
        reportDate: dayStart,
        openedAt: dayStart,
        closedAt,
        closedById,
        closedByName,
        grossSales: liveData.kpis.grossSales,
        discountTotal: liveData.kpis.discountTotal,
        voidTotal: liveData.kpis.voidTotal,
        compTotal: liveData.kpis.compTotal,
        netSales: liveData.kpis.netSales,
        taxTotal: liveData.kpis.taxTotal,
        orderCount: liveData.kpis.orderCount,
        itemCount: liveData.financial.itemCount,
        avgOrderAmount: liveData.kpis.avgOrderAmount,
        openingCash: liveData.cashReconciliation.openingCash,
        cashSales: liveData.cashReconciliation.cashSales,
        cashInTotal: liveData.cashReconciliation.cashInTotal,
        cashOutTotal: liveData.cashReconciliation.cashOutTotal,
        expectedCash: liveData.cashReconciliation.expectedCash,
        countedCash,
        cashDifference: round2(countedCash - liveData.cashReconciliation.expectedCash),
        snapshotData: snapshotPayload as any,
        notes: notes || null,
      },
    });

    return {
      success: true,
      zNumberFormatted,
      reportId: created.id,
    };
  });
}

/**
 * Kasa hareketi ekle (Giriş / Çıkış)
 */
export async function addCashMovement(
  restaurantId: string,
  data: {
    type: "IN" | "OUT";
    category: string;
    amount: number;
    description?: string;
    performedByName?: string;
  },
) {
  return await prisma.cashMovement.create({
    data: {
      restaurantId,
      type: data.type,
      category: data.category.trim(),
      amount: data.amount,
      description: data.description?.trim() || null,
      performedByName: data.performedByName?.trim() || "Kasiyer",
    },
  });
}

/**
 * Kasa hareketi sil
 */
export async function removeCashMovement(restaurantId: string, id: string) {
  return await prisma.cashMovement.deleteMany({
    where: { id, restaurantId },
  });
}

/**
 * Geçmiş Z Raporları Arşiv Listesi
 */
export async function listHistoricalZReports(
  restaurantId: string,
): Promise<ZReportHistoryItem[]> {
  const reports = await prisma.zReport.findMany({
    where: { restaurantId },
    orderBy: { zNumber: "desc" },
    take: 50,
  });

  return reports.map((r) => {
    const d = new Date(r.reportDate.getTime() + TURKEY_OFFSET_MS);
    const dateFormatted = `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
    const openedFormatted = new Date(r.openedAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const closedFormatted = new Date(r.closedAt.getTime() + TURKEY_OFFSET_MS).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

    return {
      id: r.id,
      zNumber: r.zNumber,
      zNumberFormatted: r.zNumberFormatted,
      date: dateFormatted,
      openedAt: openedFormatted,
      closedAt: closedFormatted,
      orderCount: r.orderCount,
      netSales: num(r.netSales),
      cashSales: num(r.cashSales),
      cardSales: num(r.netSales) - num(r.cashSales),
      cashDifference: num(r.cashDifference),
      closedByName: r.closedByName || "Yönetici",
    };
  });
}
