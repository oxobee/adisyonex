/**
 * Thermal Print Routing Service
 * Handles:
 * 1. KITCHEN_KOT: OrderItem -> MenuItem -> MenuCategory -> productionZoneId -> RestaurantZone
 * 2. Fallbacks: If category has no productionZoneId, routes to KITCHEN or default zone
 * 3. CUSTOMER_BILL, SALES_RECEIPT, INVOICE: Single destination -> CASHIER zone
 * 4. ESC/POS ticket string generation for 58mm / 80mm printers
 */

import { EscPosBuilder } from "@/lib/printer/escpos";
import type { MenuCategoryDTO, MenuItemDTO } from "@/types/menu";
import type { RestaurantZoneDTO } from "@/types/staff";
import type { OrderLineDTO } from "@/types/order";

export type PrintDocumentType =
  | "KITCHEN_KOT"
  | "CUSTOMER_BILL"
  | "SALES_RECEIPT"
  | "INVOICE";

export interface RoutedItem {
  id: string;
  name: string;
  variantName?: string | null;
  quantity: number;
  lineNote?: string | null;
  modifiers: { name: string; priceDelta: number }[];
  categoryName?: string;
}

export interface RoutedKotTicket {
  zone: RestaurantZoneDTO;
  isFallback: boolean;
  items: RoutedItem[];
}

export interface OrderRoutingMetadata {
  orderNumber: number;
  tableLabel?: string | null;
  orderType: string;
  createdAt: string;
  note?: string | null;
}

/**
 * Finds the default fallback kitchen zone from the list of zones.
 * Priority:
 * 1. Zone with code === "KITCHEN"
 * 2. Zone with name matching /mutfak/i
 * 3. First non-default zone
 * 4. Default zone (e.g. Genel)
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
 * Resolves the target zone for customer billing documents (CUSTOMER_BILL, SALES_RECEIPT, INVOICE).
 * Default destination is the CASHIER / Kasa zone.
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
 * Groups items per target RestaurantZone.
 */
export function routeOrderToKitchenTickets(
  lines: readonly OrderLineDTO[],
  categories: readonly MenuCategoryDTO[],
  menuItems: readonly MenuItemDTO[],
  zones: readonly RestaurantZoneDTO[]
): RoutedKotTicket[] {
  // Only route active, non-voided kitchen items
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

  // Group items by target zone ID
  const grouped = new Map<
    string,
    { zone: RestaurantZoneDTO; isFallback: boolean; items: RoutedItem[] }
  >();

  for (const line of activeLines) {
    // Attempt lookup via menuItem -> category
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
      // No zones exist at all
      continue;
    }

    const bucket = grouped.get(targetZone.id) ?? {
      zone: targetZone,
      isFallback,
      items: [],
    };

    bucket.items.push({
      id: line.id,
      name: line.name,
      variantName: line.variantName,
      quantity: line.quantity,
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
 * Builds an ESC/POS formatted string for a KOT ticket for the designated zone.
 */
export function formatEscposKotTicket(
  ticket: RoutedKotTicket,
  metadata: OrderRoutingMetadata
): string {
  const width = ticket.zone.printerPaperWidth ?? 80;
  const builder = new EscPosBuilder({ widthMm: width });

  const typeLabels: Record<string, string> = {
    DINE_IN: "Masa Siparişi",
    TAKEAWAY: "Gel-Al Sipariş",
    DELIVERY: "Paket Sipariş",
  };

  builder
    .alignCenter()
    .doubleSize()
    .bold(true)
    .line(ticket.zone.name.toUpperCase())
    .normalSize()
    .line("MUTFAK ADİSYONU / KOT")
    .bold(false)
    .separator()
    .alignLeft()
    .bold(true)
    .twoColumnRow(
      `Sipariş #${metadata.orderNumber}`,
      metadata.tableLabel ? `Masa ${metadata.tableLabel}` : (typeLabels[metadata.orderType] ?? metadata.orderType)
    )
    .bold(false)
    .line(`Tarih: ${metadata.createdAt}`)
    .separator();

  // Item lines
  for (const item of ticket.items) {
    const itemName = item.variantName
      ? `${item.name} (${item.variantName})`
      : item.name;

    builder
      .bold(true)
      .twoColumnRow(`${item.quantity} x ${itemName}`, "")
      .bold(false);

    if (item.modifiers && item.modifiers.length > 0) {
      const modList = item.modifiers.map((m) => `+ ${m.name}`).join(", ");
      builder.line(`   ${modList}`);
    }

    if (item.lineNote) {
      builder.line(`   * Not: ${item.lineNote}`);
    }
  }

  builder.separator();

  if (metadata.note) {
    builder.line(`Sipariş Notu: ${metadata.note}`);
    builder.separator();
  }

  builder.feed(3).cut();

  return builder.build();
}

export const buildEscPosKotTicket = formatEscposKotTicket;
