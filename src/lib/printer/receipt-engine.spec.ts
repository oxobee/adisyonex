import { describe, it, expect } from "vitest";
import {
  renderCourierSlip,
  renderCustomerBill,
  renderKitchenTicket,
  renderMerchantCopy,
  formatReceiptDate,
  formatReceiptTime,
  type ReceiptOrderMetadata,
  type ReceiptItemData,
} from "./receipt-engine";

const SAMPLE_META: ReceiptOrderMetadata = {
  orderId: "ord-test-1",
  orderNumber: 1042,
  orderType: "DELIVERY",
  createdAt: "2026-09-08T16:42:00.000Z",
  customerName: "Ahmet Yılmaz",
  customerPhone: "0532 555 12 34",
  customerAddress: "Atatürk Mah. Karanfil Sok. No:14 Daire:8 Kadıköy / İstanbul (Zil: Yılmaz)",
  customerNotes: "Zil çalmayın lütfen, bebek uyuyor. Kapıya bırakıp mesaj atın.",
  paymentMode: "KAPIDA KREDİ KARTI",
  grandTotal: 385.0,
  channel: "Telefon / Caller ID",
  staffName: "Ayşe",
  courierName: "Mehmet Kaya",
  restaurantInfo: {
    name: "OXONOM RESTAURANT",
    branchName: "Kadıköy",
    address: "Atatürk Mah. Örnek Cad. No:10 Kadıköy / İstanbul",
    phone: "0212 000 00 00",
    website: "www.oxonompos.com",
    taxOffice: "Kadıköy",
    taxNumber: "1234567890",
  },
};

const SAMPLE_ITEMS: ReceiptItemData[] = [
  {
    name: "Özel Karışık Kebap",
    quantity: 1,
    unitPrice: 220,
    totalPrice: 220,
    modifiers: [{ name: "Acılı" }, { name: "Bol Yeşillik" }],
  },
  {
    name: "Fındık Lahmacun",
    quantity: 2,
    unitPrice: 60,
    totalPrice: 120,
    modifiers: ["Limon & Maydanoz"],
  },
  {
    name: "Yayık Ayranı",
    quantity: 1,
    unitPrice: 45,
    totalPrice: 45,
  },
];

describe("receipt-engine", () => {
  it("formats Turkish date and time without ISO timestamps", () => {
    const formattedDate = formatReceiptDate(SAMPLE_META.createdAt);
    expect(formattedDate).toMatch(/^\d{2}\.\d{2}\.\d{4}\s\d{2}:\d{2}$/);
    expect(formattedDate).not.toContain("T");
    expect(formattedDate).not.toContain("Z");
  });

  it("renders Courier Slip cleanly without control code artifacts", () => {
    const res = renderCourierSlip(SAMPLE_META, SAMPLE_ITEMS, { widthMm: 80 });
    expect(res.plainText).not.toContain("\x1b");
    expect(res.plainText).not.toContain("@ a E !0");
    expect(res.plainText).not.toContain("d VA");
    expect(res.plainText).not.toContain("GS V");
    expect(res.plainText).toContain("KURYE TESLİMAT");
    expect(res.plainText).toContain("Ahmet Yılmaz");
    expect(res.plainText).toContain("ÖDEME: KAPIDA KREDİ KARTI");
    expect(res.plainText).toContain("POS CİHAZI GÖTÜRÜLECEK");
    expect(res.plainText).toContain("Zil çalmayın lütfen, bebek uyuyor.");

    // Check line width constraint (48 chars)
    const lines = res.plainText.split("\n");
    for (const l of lines) {
      expect(l.length).toBeLessThanOrEqual(48);
    }
  });

  it("renders 58mm Courier Slip strictly within 32 columns", () => {
    const res = renderCourierSlip(SAMPLE_META, SAMPLE_ITEMS, { widthMm: 58 });
    const lines = res.plainText.split("\n");
    for (const l of lines) {
      expect(l.length).toBeLessThanOrEqual(32);
    }
  });

  it("renders Customer Bill with company details and no courier clutter", () => {
    const res = renderCustomerBill(SAMPLE_META, SAMPLE_ITEMS, { widthMm: 80 });
    expect(res.plainText).toContain("OXONOM RESTAURANT");
    expect(res.plainText).toContain("VKN: 1234567890");
    expect(res.plainText).toContain("GENEL TOPLAM");
    expect(res.plainText).toContain("BİLGİ FİŞİDİR");
    expect(res.plainText).not.toContain("Kurye         :");
  });

  it("renders Kitchen Ticket (KOT) with items, notes, and no prices or phones", () => {
    const res = renderKitchenTicket(SAMPLE_META, SAMPLE_ITEMS, { widthMm: 80 });
    expect(res.plainText).toContain("PAKET #1042");
    expect(res.plainText).toContain("ÖZEL KARIŞIK KEBAP");
    expect(res.plainText).toContain("+ Acılı");
    expect(res.plainText).not.toContain("0532 555 12 34");
    expect(res.plainText).not.toContain("385,00 TL");
  });

  it("renders Merchant Copy with archive summary", () => {
    const res = renderMerchantCopy(SAMPLE_META, SAMPLE_ITEMS, { widthMm: 80 });
    expect(res.plainText).toContain("İŞLETME SİPARİŞ KOPYASI");
    expect(res.plainText).toContain("SİPARİŞ #1042");
    expect(res.plainText).toContain("GENEL TOPLAM");
  });
});
