import { describe, it, expect } from "vitest";
import {
  routeOrderToKitchenTickets,
  resolveDefaultKitchenZone,
  resolveCashierZone,
  formatEscposKotTicket,
  formatEscposCustomerBill,
  formatEscposCourierSlip,
  type RoutedKotTicket,
} from "./print-routing.service";
import type { MenuCategoryDTO, MenuItemDTO } from "@/types/menu";
import type { RestaurantZoneDTO } from "@/types/staff";
import type { OrderLineDTO } from "@/types/order";

describe("print-routing.service", () => {
  const mutfakZone: RestaurantZoneDTO = {
    id: "zone_mutfak",
    restaurantId: "rest_1",
    name: "Mutfak",
    code: "KITCHEN",
    description: "Sıcak/soğuk mutfak",
    color: "#EF4444",
    printerIp: null,
    printerPort: null,
    printerModel: "XP-80C",
    printerEnabled: true,
    printerConnectionType: "LOCAL_OS",
    printerSystemName: "XP-80C",
    printerPaperWidth: 80,
    printerAutoPrint: true,
    isDefault: false,
    sortOrder: 1,
  };

  const barZone: RestaurantZoneDTO = {
    id: "zone_bar",
    restaurantId: "rest_1",
    name: "Bar",
    code: "BAR",
    description: "İçecek hazırlık alanı",
    color: "#8B5CF6",
    printerIp: "192.168.1.150",
    printerPort: 9100,
    printerModel: "EPSON TM-T20",
    printerEnabled: true,
    printerConnectionType: "NETWORK",
    printerSystemName: null,
    printerPaperWidth: 80,
    printerAutoPrint: true,
    isDefault: false,
    sortOrder: 2,
  };

  const kasaZone: RestaurantZoneDTO = {
    id: "zone_kasa",
    restaurantId: "rest_1",
    name: "Kasa",
    code: "CASHIER",
    description: "Kasa ve adisyon",
    color: "#10B981",
    printerIp: null,
    printerPort: null,
    printerModel: null,
    printerEnabled: false,
    isDefault: false,
    sortOrder: 3,
  };

  const genelZone: RestaurantZoneDTO = {
    id: "zone_genel",
    restaurantId: "rest_1",
    name: "Genel",
    code: "GENERAL",
    description: "Genel alan",
    color: "#6B7280",
    printerIp: null,
    printerPort: null,
    printerModel: null,
    printerEnabled: false,
    isDefault: true,
    sortOrder: 99,
  };

  const categories: MenuCategoryDTO[] = [
    {
      id: "cat_burger",
      name: "Burgerler",
      description: null,
      sortOrder: 1,
      isActive: true,
      productionZoneId: "zone_mutfak",
    },
    {
      id: "cat_pizza",
      name: "Pizzalar",
      description: null,
      sortOrder: 2,
      isActive: true,
      productionZoneId: "zone_mutfak",
    },
    {
      id: "cat_drinks",
      name: "Soğuk İçecekler",
      description: null,
      sortOrder: 3,
      isActive: true,
      productionZoneId: "zone_bar",
    },
    {
      id: "cat_coffee",
      name: "Kahveler",
      description: null,
      sortOrder: 4,
      isActive: true,
      productionZoneId: "zone_bar",
    },
    {
      id: "cat_unassigned",
      name: "Atıştırmalıklar",
      description: null,
      sortOrder: 5,
      isActive: true,
      productionZoneId: null, // Should fallback to kitchen
    },
  ];

  const menuItems: MenuItemDTO[] = [
    {
      id: "item_burger",
      categoryId: "cat_burger",
      name: "Cheeseburger",
      shortDescription: null,
      longDescription: null,
      itemType: "SERVED",
      dietaryType: null,
      price: 150,
      prepTimeMinutes: 15,
      calories: null,
      allergens: [],
      isActive: true,
      available: true,
      disabledReason: null,
      resumeAt: null,
      tax: { kind: "SERVICE", rate: 10, code: null, separatelyCharged: false, inclusive: true },
      images: [],
      variants: [],
      modifierGroups: [],
    },
    {
      id: "item_pizza",
      categoryId: "cat_pizza",
      name: "Margarita Pizza",
      shortDescription: null,
      longDescription: null,
      itemType: "SERVED",
      dietaryType: null,
      price: 200,
      prepTimeMinutes: 20,
      calories: null,
      allergens: [],
      isActive: true,
      available: true,
      disabledReason: null,
      resumeAt: null,
      tax: { kind: "SERVICE", rate: 10, code: null, separatelyCharged: false, inclusive: true },
      images: [],
      variants: [],
      modifierGroups: [],
    },
    {
      id: "item_cola",
      categoryId: "cat_drinks",
      name: "Coca-Cola",
      shortDescription: null,
      longDescription: null,
      itemType: "PACKAGED_GOODS",
      dietaryType: null,
      price: 40,
      prepTimeMinutes: 1,
      calories: null,
      allergens: [],
      isActive: true,
      available: true,
      disabledReason: null,
      resumeAt: null,
      tax: { kind: "GOODS", rate: 10, code: null, separatelyCharged: false, inclusive: true },
      images: [],
      variants: [],
      modifierGroups: [],
    },
    {
      id: "item_latte",
      categoryId: "cat_coffee",
      name: "Latte",
      shortDescription: null,
      longDescription: null,
      itemType: "SERVED",
      dietaryType: null,
      price: 60,
      prepTimeMinutes: 5,
      calories: null,
      allergens: [],
      isActive: true,
      available: true,
      disabledReason: null,
      resumeAt: null,
      tax: { kind: "SERVICE", rate: 10, code: null, separatelyCharged: false, inclusive: true },
      images: [],
      variants: [],
      modifierGroups: [],
    },
    {
      id: "item_chips",
      categoryId: "cat_unassigned",
      name: "Patates Cipsi",
      shortDescription: null,
      longDescription: null,
      itemType: "PACKAGED_GOODS",
      dietaryType: null,
      price: 30,
      prepTimeMinutes: 2,
      calories: null,
      allergens: [],
      isActive: true,
      available: true,
      disabledReason: null,
      resumeAt: null,
      tax: { kind: "GOODS", rate: 10, code: null, separatelyCharged: false, inclusive: true },
      images: [],
      variants: [],
      modifierGroups: [],
    },
  ];

  it("correctly routes order items to designated production zones (Mutfak and Bar)", () => {
    const lines: OrderLineDTO[] = [
      {
        id: "line_1",
        menuItemId: "item_burger",
        name: "Cheeseburger",
        variantName: null,
        unitPrice: 150,
        taxRate: 10,
        taxKind: "SERVICE",
        taxInclusive: true,
        quantity: 2,
        state: "FIRED",
        isComp: false,
        sortOrder: 0,
        modifiers: [],
        lineNote: "Soğansız olsun",
      },
      {
        id: "line_2",
        menuItemId: "item_pizza",
        name: "Margarita Pizza",
        variantName: null,
        unitPrice: 200,
        taxRate: 10,
        taxKind: "SERVICE",
        taxInclusive: true,
        quantity: 1,
        state: "FIRED",
        isComp: false,
        sortOrder: 1,
        modifiers: [],
      },
      {
        id: "line_3",
        menuItemId: "item_cola",
        name: "Coca-Cola",
        variantName: null,
        unitPrice: 40,
        taxRate: 10,
        taxKind: "GOODS",
        taxInclusive: true,
        quantity: 3,
        state: "FIRED",
        isComp: false,
        sortOrder: 2,
        modifiers: [],
      },
      {
        id: "line_4",
        menuItemId: "item_latte",
        name: "Latte",
        variantName: null,
        unitPrice: 60,
        taxRate: 10,
        taxKind: "SERVICE",
        taxInclusive: true,
        quantity: 1,
        state: "FIRED",
        isComp: false,
        sortOrder: 3,
        modifiers: [],
      },
    ];

    const tickets = routeOrderToKitchenTickets(
      lines,
      categories,
      menuItems,
      [mutfakZone, barZone, kasaZone, genelZone]
    );

    expect(tickets).toHaveLength(2);

    const mutfakTicket = tickets.find((t) => t.zone.id === "zone_mutfak");
    expect(mutfakTicket).toBeDefined();
    expect(mutfakTicket?.items).toHaveLength(2);
    expect(mutfakTicket?.items.map((i) => i.name)).toEqual(["Cheeseburger", "Margarita Pizza"]);
    expect(mutfakTicket?.items[0].quantity).toBe(2);
    expect(mutfakTicket?.items[0].lineNote).toBe("Soğansız olsun");

    const barTicket = tickets.find((t) => t.zone.id === "zone_bar");
    expect(barTicket).toBeDefined();
    expect(barTicket?.items).toHaveLength(2);
    expect(barTicket?.items.map((i) => i.name)).toEqual(["Coca-Cola", "Latte"]);
    expect(barTicket?.items[0].quantity).toBe(3);
  });

  it("safely falls back to default kitchen zone when category has no productionZoneId", () => {
    const lines: OrderLineDTO[] = [
      {
        id: "line_chips",
        menuItemId: "item_chips",
        name: "Patates Cipsi",
        variantName: null,
        unitPrice: 30,
        taxRate: 10,
        taxKind: "GOODS",
        taxInclusive: true,
        quantity: 1,
        state: "FIRED",
        isComp: false,
        sortOrder: 0,
        modifiers: [],
      },
    ];

    const tickets = routeOrderToKitchenTickets(
      lines,
      categories,
      menuItems,
      [mutfakZone, barZone, kasaZone, genelZone]
    );

    expect(tickets).toHaveLength(1);
    expect(tickets[0].zone.id).toBe("zone_mutfak");
    expect(tickets[0].isFallback).toBe(true);
    expect(tickets[0].items[0].name).toBe("Patates Cipsi");
  });

  it("excludes VOID lines from routing", () => {
    const lines: OrderLineDTO[] = [
      {
        id: "line_void",
        menuItemId: "item_burger",
        name: "Cheeseburger",
        variantName: null,
        unitPrice: 150,
        taxRate: 10,
        taxKind: "SERVICE",
        taxInclusive: true,
        quantity: 1,
        state: "VOID",
        isComp: false,
        sortOrder: 0,
        modifiers: [],
      },
    ];

    const tickets = routeOrderToKitchenTickets(
      lines,
      categories,
      menuItems,
      [mutfakZone, barZone]
    );

    expect(tickets).toHaveLength(0);
  });

  it("resolves default kitchen zone by code, name, or non-default", () => {
    expect(resolveDefaultKitchenZone([barZone, mutfakZone, genelZone])?.id).toBe("zone_mutfak");
    expect(resolveDefaultKitchenZone([barZone, genelZone])?.id).toBe("zone_bar");
    expect(resolveDefaultKitchenZone([genelZone])?.id).toBe("zone_genel");
  });

  it("resolves cashier zone for customer bill/receipts", () => {
    expect(resolveCashierZone([mutfakZone, barZone, kasaZone, genelZone])?.id).toBe("zone_kasa");
  });

  it("generates formatted ESC/POS ticket string", () => {
    const ticket: RoutedKotTicket = {
      zone: mutfakZone,
      isFallback: false,
      items: [
        {
          id: "1",
          name: "Cheeseburger",
          quantity: 2,
          modifiers: [{ name: "Ekstra Peynir", priceDelta: 15 }],
          lineNote: "Acısız",
        },
      ],
    };

    const raw = formatEscposKotTicket(ticket, {
      orderNumber: 42,
      tableLabel: "T-5",
      orderType: "DINE_IN",
      createdAt: "06.09.2026 11:30",
      note: "Acele lütfen",
    });

    expect(raw).toContain("MUTFAK");
    expect(raw).toContain("ADİSYON");
    expect(raw).toContain("Sipariş #42");
    expect(raw).toContain("Masa T-5");
    expect(raw).toContain("2 x Cheeseburger");
    expect(raw).toContain("Ekstra Peynir");
    expect(raw).toContain("Acısız");
    expect(raw).toContain("Acele lütfen");
  });
});

  it("formats 58mm and 80mm customer bill correctly without overflow", () => {
    const metadata = {
      orderNumber: 1042,
      orderType: "DELIVERY",
      createdAt: "08.09.2026 19:42",
      customerName: "Ahmet Yılmaz",
      customerPhone: "0532 123 45 67",
      customerAddress: "Yakuplu Mah. Hürriyet Cad. No:12 Kat:3 Daire:8 Beylikdüzü / İstanbul",
      customerNotes: "Zile basmayın, telefonla arayın",
      paymentModeLabel: "Kapıda Kredi Kartı",
      subtotal: 840,
      deliveryFee: 40,
      discountTotal: 50,
      grandTotal: 830,
    };

    const items = [
      {
        id: "1",
        name: "Adana Kebap",
        quantity: 2,
        totalPrice: 600,
        modifiers: [{ name: "Acısız", priceDelta: 0 }],
      },
      {
        id: "2",
        name: "Künefe",
        quantity: 1,
        totalPrice: 180,
        modifiers: [],
      },
    ];

    const bill80 = formatEscposCustomerBill(metadata, items, 80);
    expect(bill80).toContain("PAKET SERVİS / TELEFON SİPARİŞİ");
    expect(bill80).toContain("Ahmet Yılmaz");
    expect(bill80).toContain("0532 123 45 67");
    expect(bill80).toContain("KAPIDA KREDİ KARTI");
    expect(bill80).toContain("GENEL TOPLAM:");

    const bill58 = formatEscposCustomerBill(metadata, items, 58);
    expect(bill58).toContain("Ahmet Yılmaz");
    expect(bill58).toContain("830.00 TL");
  });

  it("formats courier delivery slip with highlighted payment and address", () => {
    const metadata = {
      orderNumber: 1042,
      orderType: "DELIVERY",
      createdAt: "19:42",
      customerName: "Ahmet Yılmaz",
      customerPhone: "0532 123 45 67",
      customerAddress: "Yakuplu Mah. Hürriyet Cad. No:12 Kat:3 Daire:8 Beylikdüzü / İstanbul",
      customerNotes: "Mavi kapı, market yanı",
      paymentModeLabel: "KAPIDA KART",
      grandTotal: 830,
    };

    const courier = formatEscposCourierSlip(metadata, 80);
    expect(courier).toContain("KURYE TESLİMAT FİŞİ");
    expect(courier).toContain("Ahmet Yılmaz");
    expect(courier).toContain("0532 123 45 67");
    expect(courier).toContain("ÖDEME ŞEKLİ: KAPIDA KART");
    expect(courier).toContain("TAHSİL EDİLECEK TUTAR: 830.00 TL");
  });
