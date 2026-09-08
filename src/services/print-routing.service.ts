/**
 * Thermal Print Routing Service
 * Handles:
 * 1. KITCHEN_KOT: OrderItem -> MenuItem -> MenuCategory -> productionZoneId -> RestaurantZone
 * 2. Fallbacks: If category has no productionZoneId, routes to KITCHEN or default zone
 * 3. CUSTOMER_BILL (Paket / Müşteri Fişi)
 * 4. COURIER_SLIP (Kurye / Teslimat Fişi)
 * 5. SALES_RECEIPT (Kasa / İşletme Kopyası)
 * 6. ESC/POS ticket string generation for 58mm / 80mm printers
 */

import { EscPosBuilder } from "@/lib/printer/escpos";
import type { MenuCategoryDTO, MenuItemDTO } from "@/types/menu";
import type { RestaurantZoneDTO } from "@/types/staff";
import type { OrderLineDTO } from "@/types/order";

export type PrintDocumentType =
  | "KITCHEN_KOT"
  | "CUSTOMER_BILL"
  | "COURIER_SLIP"
  | "SALES_RECEIPT"
  | "INVOICE";

export interface RoutedItem {
  id?: string;
  orderLineId?: string;
  menuItemId?: string | null;
  name: string;
  variantName?: string | null;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  lineTotal?: number;
  lineNote?: string | null;
  modifiers?: ({ name: string; priceDelta?: number } | string)[];
  categoryName?: string;
  categoryId?: string;
}

export interface RoutedKotTicket {
  zone: RestaurantZoneDTO;
  isFallback: boolean;
  items: RoutedItem[];
}

export interface OrderRoutingMetadata {
  orderId?: string | null;
  orderNumber: number;
  tableLabel?: string | null;
  orderType: string;
  createdAt: string;
  note?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerNotes?: string | null;
  paymentModeLabel?: string | null;
  paymentMode?: string | null;
  isPaid?: boolean;
  subtotal?: number;
  discountTotal?: number;
  deliveryFee?: number;
  taxTotal?: number;
  grandTotal?: number;
  isSimulation?: boolean;
  restaurantInfo?: {
    name?: string;
    branchName?: string;
    phone?: string;
    website?: string;
    address?: string;
    taxOffice?: string;
    taxNumber?: string;
  };
}

/**
 * Finds the default fallback kitchen zone from the list of zones.
 */
export function resolveDefaultKitchenZone(
  zones: readonly RestaurantZoneDTO[]
): RestaurantZoneDTO | null {
  if (!zones || zones.length === 0) return null;

  const byCode = zones.find((z) => z.code?.toUpperCase() === "KITCHEN");
  if (byCode) return byCode;

  const byName = zones.find((z) => /mutfak/i.test(z.name));
  if (byName) return byName;

  const nonDefault = zones.find((z) => !z.isDefault);
  if (nonDefault) return nonDefault;

  return zones[0] ?? null;
}

/**
 * Resolves the target zone for customer billing documents (CUSTOMER_BILL, SALES_RECEIPT, COURIER_SLIP).
 */
export function resolveCashierZone(
  zones: readonly RestaurantZoneDTO[]
): RestaurantZoneDTO | null {
  if (!zones || zones.length === 0) return null;

  const byCode = zones.find((z) => z.code?.toUpperCase() === "CASHIER");
  if (byCode) return byCode;

  const byName = zones.find((z) => /kasa|cashier/i.test(z.name));
  if (byName) return byName;

  return zones.find((z) => z.isDefault) || zones[0] || null;
}

/**
 * Routes order items to their designated production zones based on Category -> productionZoneId.
 */
export function routeOrderToKitchenTickets(
  lines: readonly OrderLineDTO[],
  categories: readonly MenuCategoryDTO[],
  menuItems: readonly MenuItemDTO[],
  zones: readonly RestaurantZoneDTO[]
): RoutedKotTicket[] {
  const activeLines = lines.filter((l) => l.state !== "VOID");
  if (activeLines.length === 0 || zones.length === 0) {
    return [];
  }

  const categoryMap = new Map<string, MenuCategoryDTO>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  const itemToCategoryMap = new Map<string, MenuCategoryDTO>();
  for (const item of menuItems) {
    const cat = categoryMap.get(item.categoryId);
    if (cat) {
      itemToCategoryMap.set(item.id, cat);
    }
  }

  const zoneMap = new Map<string, RestaurantZoneDTO>();
  for (const z of zones) {
    zoneMap.set(z.id, z);
  }

  const fallbackZone = resolveDefaultKitchenZone(zones);

  const grouped = new Map<
    string,
    { zone: RestaurantZoneDTO; isFallback: boolean; items: RoutedItem[] }
  >();

  for (const line of activeLines) {
    let targetZone: RestaurantZoneDTO | null = null;
    let isFallback = false;
    let categoryName: string | undefined;

    const cat = line.menuItemId ? itemToCategoryMap.get(line.menuItemId) : undefined;
    if (cat) {
      categoryName = cat.name;
      if (cat.productionZoneId && zoneMap.has(cat.productionZoneId)) {
        targetZone = zoneMap.get(cat.productionZoneId)!;
      }
    }

    if (!targetZone) {
      targetZone = fallbackZone;
      isFallback = true;
    }

    if (!targetZone) {
      continue;
    }

    const bucket = grouped.get(targetZone.id) ?? {
      zone: targetZone,
      isFallback,
      items: [],
    };

    const modTotal = line.modifiers.reduce((s, m) => s + m.priceDelta, 0);
    bucket.items.push({
      id: line.id,
      name: line.name,
      variantName: line.variantName,
      quantity: line.quantity,
      unitPrice: line.unitPrice + modTotal,
      totalPrice: (line.unitPrice + modTotal) * line.quantity,
      lineNote: line.lineNote,
      modifiers: line.modifiers.map((m) => ({
        name: m.name,
        priceDelta: m.priceDelta,
      })),
      categoryName,
    });

    grouped.set(targetZone.id, bucket);
  }

  return Array.from(grouped.values());
}

/**
 * 1. MUTFAK HAZIRLIK FİŞİ (KOT)
 * Mutfak personelinin 1 metre mesafeden bile rahatça görebileceği büyük, bold, net fiş.
 */
export function formatEscposKotTicket(
  ticket: RoutedKotTicket,
  metadata: OrderRoutingMetadata
): string {
  const width = ticket.zone.printerPaperWidth ?? 80;
  const builder = new EscPosBuilder({ widthMm: width });

  const isDelivery = metadata.orderType === "DELIVERY";
  const typeLabel = isDelivery
    ? "!!! PAKET SERVİS / TELEFON !!!"
    : metadata.orderType === "TAKEAWAY"
    ? "GEL-AL SİPARİŞ"
    : "MASA SİPARİŞİ";

  if (metadata.isSimulation) {
    builder.alignCenter().line("*** TEST / SİMÜLASYON ***").separator();
  }

  builder
    .alignCenter()
    .doubleSize()
    .bold(true)
    .line(ticket.zone.name.toUpperCase())
    .normalSize()
    .line("MUTFAK ADİSYONU / KOT")
    .bold(false)
    .doubleSeparator()
    .alignLeft()
    .bold(true)
    .line(typeLabel)
    .twoColumnRow(
      `Sipariş #${metadata.orderNumber}`,
      metadata.tableLabel ? `Masa ${metadata.tableLabel}` : ""
    )
    .bold(false)
    .line(`Saat: ${metadata.createdAt}`)
    .separator();

  // Item lines (Büyük ve bold)
  for (const item of ticket.items) {
    const itemName = item.variantName
      ? `${item.name} (${item.variantName})`
      : item.name;

    builder
      .bold(true)
      .line(`${item.quantity} x ${itemName}`)
      .bold(false);

    if (item.modifiers && item.modifiers.length > 0) {
      const modList = item.modifiers
        .map((m) => (typeof m === "string" ? `+ ${m}` : `+ ${m.name}`))
        .join(", ");
      builder.wrappedLine(modList, "  ");
    }

    if (item.lineNote) {
      builder.wrappedLine(`* Not: ${item.lineNote}`, "  ");
    }
  }

  builder.separator();

  if (metadata.customerNotes) {
    builder
      .bold(true)
      .line("MÜŞTERİ NOTU:")
      .bold(false)
      .wrappedLine(metadata.customerNotes, "  ")
      .separator();
  }

  if (metadata.note) {
    builder
      .bold(true)
      .line("SİPARİŞ NOTU:")
      .bold(false)
      .wrappedLine(metadata.note, "  ")
      .separator();
  }

  builder.feed(3).cut();
  return builder.build();
}

/**
 * 2. PAKET SERVİS / MÜŞTERİ FİŞİ (CUSTOMER_BILL)
 * Müşteri paketi içine konan veya kapıda verilen detaylı teslimat ve ödeme fişi.
 */
export function formatEscposCustomerBill(
  metadata: OrderRoutingMetadata,
  items: readonly RoutedItem[],
  widthMm: number = 80
): string {
  const builder = new EscPosBuilder({ widthMm });

  if (metadata.isSimulation) {
    builder.alignCenter().line("*** TEST / SİMÜLASYON ***").separator();
  }

  // Firma Başlığı (Boş alanlar basılmaz)
  builder.alignCenter().bold(true);
  if (metadata.restaurantInfo?.name) {
    builder.doubleSize().line(metadata.restaurantInfo.name).normalSize();
  } else {
    builder.doubleSize().line("OXONOM RESTAURANT").normalSize();
  }

  if (metadata.restaurantInfo?.branchName) {
    builder.line(`${metadata.restaurantInfo.branchName} Şubesi`);
  }
  builder.bold(false);

  if (metadata.restaurantInfo?.phone) {
    builder.line(`Tel: ${metadata.restaurantInfo.phone}`);
  }
  if (metadata.restaurantInfo?.address) {
    builder.wrappedLine(metadata.restaurantInfo.address);
  }
  if (metadata.restaurantInfo?.website) {
    builder.line(metadata.restaurantInfo.website);
  }

  builder.doubleSeparator();

  // Sipariş Başlığı
  const orderTitle = metadata.orderType === "DELIVERY"
    ? "PAKET SERVİS / TELEFON SİPARİŞİ"
    : metadata.orderType === "TAKEAWAY"
    ? "GEL-AL SİPARİŞ"
    : "MASA SİPARİŞİ";

  builder
    .alignLeft()
    .bold(true)
    .twoColumnRow(orderTitle, `#${metadata.orderNumber}`)
    .bold(false)
    .line(`Tarih: ${metadata.createdAt}`)
    .separator();

  // Müşteri & Teslimat Bilgileri
  if (metadata.customerName || metadata.customerPhone || metadata.customerAddress) {
    builder.bold(true).line("MÜŞTERİ & TESLİMAT BİLGİLERİ").bold(false);
    if (metadata.customerName) {
      builder.line(`İsim: ${metadata.customerName}`);
    }
    if (metadata.customerPhone) {
      builder.line(`Tel : ${metadata.customerPhone}`);
    }
    if (metadata.customerAddress) {
      builder.bold(true).line("Adres:").bold(false);
      builder.wrappedLine(metadata.customerAddress, "  ");
    }
    builder.separator();
  }

  // Kalemler
  builder.bold(true).twoColumnRow("ÜRÜN", "TUTAR").bold(false).separator();

  for (const item of items) {
    const itemName = item.variantName
      ? `${item.name} (${item.variantName})`
      : item.name;
    const priceVal = item.totalPrice ?? item.lineTotal;
    const priceStr = priceVal !== undefined ? `${priceVal.toFixed(2)} TL` : "";

    builder.twoColumnRow(`${item.quantity} x ${itemName}`, priceStr);

    if (item.modifiers && item.modifiers.length > 0) {
      const modList = item.modifiers
        .map((m) => (typeof m === "string" ? `+ ${m}` : `+ ${m.name}`))
        .join(", ");
      builder.wrappedLine(modList, "  ");
    }
    if (item.lineNote) {
      builder.wrappedLine(`* ${item.lineNote}`, "  ");
    }
  }

  builder.separator();

  // Finansal Hiyerarşi
  if (metadata.subtotal !== undefined) {
    builder.twoColumnRow("Ara Toplam:", `${metadata.subtotal.toFixed(2)} TL`);
  }
  if (metadata.deliveryFee && metadata.deliveryFee > 0) {
    builder.twoColumnRow("Teslimat Bedeli:", `${metadata.deliveryFee.toFixed(2)} TL`);
  }
  if (metadata.discountTotal && metadata.discountTotal > 0) {
    builder.twoColumnRow("İndirim:", `-${metadata.discountTotal.toFixed(2)} TL`);
  }

  builder.doubleSeparator();

  // GENEL TOPLAM (Çok büyük ve belirgin)
  const gTotal = metadata.grandTotal ?? 0;
  builder
    .bold(true)
    .twoColumnRow("GENEL TOPLAM:", `${gTotal.toFixed(2)} TL`)
    .bold(false)
    .doubleSeparator();

  // ÖDEME YÖNTEMİ (ÇOK BELİRGİN & DİKKAT ÇEKİCİ)
  const payMode =
    (metadata.paymentModeLabel || metadata.paymentMode)?.toLocaleUpperCase("tr-TR") ||
    "KAPIDA ÖDEME";
  builder
    .alignCenter()
    .bold(true)
    .line(`================================`)
    .line(`ÖDEME: ${payMode}`)
    .line(`================================`)
    .bold(false)
    .alignLeft();

  // Notlar
  if (metadata.customerNotes) {
    builder.line(`Müşteri Notu: ${metadata.customerNotes}`);
  }
  if (metadata.note) {
    builder.line(`Sipariş Notu: ${metadata.note}`);
  }

  // Alt Bilgi
  builder
    .separator()
    .alignCenter()
    .line("Siparişinizi afiyetle tüketmenizi dileriz.")
    .line("*** BİLGİ FİŞİDİR - RESMİ MALİ BELGE DEĞİLDİR ***");

  if (metadata.restaurantInfo?.taxOffice || metadata.restaurantInfo?.taxNumber) {
    builder.line(
      `${metadata.restaurantInfo.taxOffice || ""} ${metadata.restaurantInfo.taxNumber ? "V.No: " + metadata.restaurantInfo.taxNumber : ""}`.trim()
    );
  }

  builder.feed(3).cut();
  return builder.build();
}

/**
 * 3. KURYE / TESLİMAT FİŞİ (COURIER_SLIP)
 * Kurye için sadece teslimat, telefon, adres, ödeme şekli ve tahsil edilecek tutarı öne çıkaran kompakt fiş.
 */
export function formatEscposCourierSlip(
  metadata: OrderRoutingMetadata,
  widthMm: number = 80
): string {
  const builder = new EscPosBuilder({ widthMm });

  if (metadata.isSimulation) {
    builder.alignCenter().line("*** TEST / SİMÜLASYON ***").separator();
  }

  builder
    .alignCenter()
    .doubleSize()
    .bold(true)
    .line("KURYE TESLİMAT FİŞİ")
    .normalSize()
    .line(`SİPARİŞ #${metadata.orderNumber}`)
    .bold(false)
    .doubleSeparator()
    .alignLeft();

  // Müşteri İsim & Telefon
  builder
    .bold(true)
    .line(`MÜŞTERİ: ${metadata.customerName || "İsimsiz Müşteri"}`)
    .line(`TELEFON: ${metadata.customerPhone || "—"}`)
    .bold(false)
    .separator();

  // Adres (Geniş ve okunaklı)
  builder
    .bold(true)
    .line("TESLİMAT ADRESİ:")
    .bold(false)
    .wrappedLine(metadata.customerAddress || "Adres belirtilmemiş", "  ")
    .separator();

  // Ödeme & Tahsilat (En Kritik Bölüm)
  const gTotal = metadata.grandTotal ?? 0;
  const payMode =
    (metadata.paymentModeLabel || metadata.paymentMode)?.toLocaleUpperCase("tr-TR") ||
    "KAPIDA ÖDEME";

  builder
    .alignCenter()
    .bold(true)
    .line(`ÖDEME ŞEKLİ: ${payMode}`)
    .line(`TAHSİL EDİLECEK TUTAR: ${gTotal.toFixed(2)} TL`)
    .bold(false)
    .alignLeft()
    .separator();

  if (metadata.customerNotes) {
    builder.line(`Adres / Müşteri Notu: ${metadata.customerNotes}`);
  }
  if (metadata.note) {
    builder.line(`Sipariş Notu: ${metadata.note}`);
  }

  builder
    .separator()
    .twoColumnRow(`Saat: ${metadata.createdAt}`, "Sipariş Kaynağı: TELEFON")
    .feed(3)
    .cut();

  return builder.build();
}

/**
 * 4. İŞLETME / KASA KOPYASI (SALES_RECEIPT)
 * Kasa mutabakatı ve işletme arşivleme amaçlı özet fiş.
 */
export function formatEscposMerchantCopy(
  metadata: OrderRoutingMetadata,
  items: readonly RoutedItem[],
  widthMm: number = 80
): string {
  const builder = new EscPosBuilder({ widthMm });

  if (metadata.isSimulation) {
    builder.alignCenter().line("*** TEST / SİMÜLASYON ***").separator();
  }

  builder
    .alignCenter()
    .bold(true)
    .line("İŞLETME SİPARİŞ KOPYASI")
    .line(`SİPARİŞ #${metadata.orderNumber}`)
    .bold(false)
    .separator()
    .alignLeft()
    .twoColumnRow(`Tarih: ${metadata.createdAt}`, `Tür: ${metadata.orderType}`)
    .twoColumnRow(`Kaynak: TELEFON / CALLER ID`, metadata.customerPhone ? `Tel: ${metadata.customerPhone}` : "")
    .separator();

  for (const it of items) {
    const priceVal = it.totalPrice ?? it.lineTotal;
    const priceStr = priceVal !== undefined ? `${priceVal.toFixed(2)} TL` : "";
    builder.twoColumnRow(`${it.quantity}x ${it.name}`, priceStr);
  }

  builder
    .separator()
    .bold(true)
    .twoColumnRow("TOPLAM TUTAR:", `${(metadata.grandTotal ?? 0).toFixed(2)} TL`)
    .twoColumnRow("ÖDEME:", (metadata.paymentModeLabel || metadata.paymentMode || "Nakit"))
    .bold(false)
    .feed(2)
    .cut();

  return builder.build();
}

export const buildEscPosKotTicket = formatEscposKotTicket;
