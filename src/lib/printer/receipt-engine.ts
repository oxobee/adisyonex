/**
 * Profesyonel Termal Fiş Çıktı ve Önizleme Motoru
 * - 58mm (32 Kolon) ve 80mm (48 Kolon) tam uyumlu
 * - Ekranda %100 temiz, bozuk kontrol karakteri içermeyen monospaced metin
 * - QZ Tray / donanım çıktısı için standart ESC/POS binary komutları
 * - Türkçe tarih ve saat formatı (Örn: 08.09.2026 19:42)
 * - Güçlü hiyerarşi, belirgin ödeme blokları, kutulu adres ve not alanları
 */

export interface ReceiptItemModifier {
  name: string;
  priceDelta?: number;
}

export interface ReceiptItemData {
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  variantName?: string | null;
  modifiers?: (ReceiptItemModifier | string)[];
  lineNote?: string | null;
}

export interface ReceiptOrderMetadata {
  orderId?: string | null;
  orderNumber: number;
  orderType: string; // "DELIVERY" | "TAKEAWAY" | "DINE_IN"
  tableLabel?: string | null;
  createdAt: string | Date;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerNotes?: string | null;
  note?: string | null;
  paymentMode?: string | null; // "KAPIDA KREDİ KARTI" | "KAPIDA NAKİT" | "ONLINE" | "CASH" | "CARD"
  isPaid?: boolean;
  subtotal?: number;
  discountTotal?: number;
  deliveryFee?: number;
  taxTotal?: number;
  grandTotal?: number;
  channel?: string | null; // "Telefon / Caller ID" | "Masa QR" | "Web Sitesi" | "Yemeksepeti"
  staffName?: string | null;
  courierName?: string | null;
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

export interface ReceiptRenderResult {
  plainText: string;
  escposRaw: string;
  widthMm: 58 | 80;
  maxCols: number;
}

// Formatters
export function formatReceiptDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  }).format(d);
}

export function formatReceiptTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  }).format(d);
}

export function formatReceiptCurrency(amount?: number | null): string {
  const val = amount ?? 0;
  return `${val.toFixed(2).replace(".", ",")} TL`;
}

// Layout text helpers
function padCenter(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  const left = Math.floor((width - str.length) / 2);
  const right = width - str.length - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

function twoCols(left: string, right: string, width: number): string {
  const avail = width - right.length;
  if (avail <= 0) return `${left}\n${right.padStart(width, " ")}`;
  if (left.length <= avail) {
    return left.padEnd(avail, " ") + right;
  }
  // If left is too long, truncate or wrap
  return left.slice(0, avail - 1) + " " + right;
}

function wrapLines(text: string, width: number, indent: string = ""): string[] {
  if (!text) return [];
  const lines: string[] = [];
  const effectiveWidth = Math.max(10, width - indent.length);
  const paragraphs = text.split("\n");

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    let current = "";

    for (const word of words) {
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= effectiveWidth) {
        current += " " + word;
      } else {
        lines.push(indent + current);
        current = word;
      }
    }
    if (current) {
      lines.push(indent + current);
    }
  }

  return lines;
}

/**
 * 1. KURYE TESLİMAT FİŞİ
 */
export function renderCourierSlip(
  metadata: ReceiptOrderMetadata,
  items: readonly ReceiptItemData[] = [],
  options?: { widthMm?: 58 | 80 }
): ReceiptRenderResult {
  const widthMm = options?.widthMm === 58 ? 58 : 80;
  const W = widthMm === 58 ? 32 : 48;
  const sepDouble = "=".repeat(W);
  const sepSingle = "-".repeat(W);

  const lines: string[] = [];

  // Header
  lines.push(sepDouble);
  const restName = (metadata.restaurantInfo?.name || "OXONOM RESTAURANT").toLocaleUpperCase("tr-TR");
  lines.push(padCenter(restName, W));
  lines.push(padCenter("KURYE TESLİMAT", W));
  lines.push(sepDouble);

  lines.push(twoCols(`Sipariş No : #${metadata.orderNumber}`, "", W));
  lines.push(twoCols(`Tarih      : ${formatReceiptDate(metadata.createdAt)}`, "", W));
  const channelText = metadata.channel || "Telefon / Caller ID";
  lines.push(twoCols(`Kaynak     : ${channelText}`, "", W));

  // Müşteri
  lines.push(sepSingle);
  lines.push("MÜŞTERİ");
  lines.push(sepSingle);
  lines.push(metadata.customerName || "İsimsiz Müşteri");
  lines.push(metadata.customerPhone || "Telefon Yok");

  // Teslimat Adresi
  lines.push(sepSingle);
  lines.push("TESLİMAT ADRESİ");
  lines.push(sepSingle);
  if (metadata.customerAddress) {
    const addrLines = wrapLines(metadata.customerAddress, W);
    lines.push(...addrLines);
  } else {
    lines.push("Adres bilgisi girilmemiş.");
  }

  // Sipariş Özeti (Ürünler)
  if (items.length > 0) {
    lines.push(sepSingle);
    lines.push("SİPARİŞ ÖZETİ");
    lines.push(sepSingle);

    for (const it of items) {
      const name = it.variantName ? `${it.name} (${it.variantName})` : it.name;
      const left = `${it.quantity} x ${name}`;
      const price = formatReceiptCurrency(it.totalPrice ?? ((it.unitPrice ?? 0) * it.quantity));
      lines.push(twoCols(left, price, W));

      if (it.modifiers && it.modifiers.length > 0) {
        for (const m of it.modifiers) {
          const modName = typeof m === "string" ? m : m.name;
          lines.push(`   - ${modName}`);
        }
      }
    }
  }

  // Toplam
  lines.push(sepSingle);
  lines.push("TOPLAM");
  lines.push(sepSingle);
  lines.push(twoCols("Genel Toplam", formatReceiptCurrency(metadata.grandTotal), W));

  // Ödeme Bloğu (En Kritik Alan)
  lines.push(sepDouble);
  const rawPay = (metadata.paymentMode || "").toLocaleUpperCase("tr-TR");
  let payTitle = "ÖDEME: KAPIDA KREDİ KARTI";
  let paySub = "POS CİHAZI GÖTÜRÜLECEK";

  if (rawPay.includes("KART") || rawPay.includes("CARD") || rawPay.includes("POS")) {
    payTitle = "ÖDEME: KAPIDA KREDİ KARTI";
    paySub = "POS CİHAZI GÖTÜRÜLECEK";
  } else if (rawPay.includes("NAK") || rawPay.includes("CASH")) {
    payTitle = "ÖDEME: KAPIDA NAKİT";
    paySub = `TAHSİLAT: ${formatReceiptCurrency(metadata.grandTotal)}`;
  } else if (metadata.isPaid || rawPay.includes("ONLINE") || rawPay.includes("ÖDENDİ") || rawPay.includes("PAID")) {
    payTitle = "ÖDEME: ONLINE ÖDENDİ";
    paySub = "TAHSİLAT YAPMAYIN";
  } else if (rawPay.includes("YEMEK") || rawPay.includes("SODEXO") || rawPay.includes("MULTINET")) {
    payTitle = `ÖDEME: ${rawPay}`;
    paySub = "YEMEK KARTI CİHAZI GÖTÜRÜLECEK";
  } else if (rawPay) {
    payTitle = `ÖDEME: ${rawPay}`;
    paySub = `TAHSİLAT: ${formatReceiptCurrency(metadata.grandTotal)}`;
  }

  lines.push(padCenter(payTitle, W));
  lines.push(padCenter(paySub, W));
  lines.push(sepDouble);

  // Teslimat Notu
  const finalNote = metadata.customerNotes || metadata.note;
  if (finalNote) {
    lines.push(sepSingle);
    lines.push("TESLİMAT NOTU");
    lines.push(sepSingle);
    lines.push(...wrapLines(finalNote, W));
  }

  // Operasyon Bilgisi
  lines.push(sepSingle);
  if (metadata.staffName) {
    lines.push(twoCols("Siparişi Alan :", metadata.staffName, W));
  }
  if (metadata.courierName) {
    lines.push(twoCols("Kurye         :", metadata.courierName, W));
  }
  lines.push(sepSingle);

  const plainText = lines.join("\n");
  const escposRaw = buildEscposFromPlain(lines, W);

  return { plainText, escposRaw, widthMm, maxCols: W };
}

/**
 * 2. MÜŞTERİ FİŞİ
 */
export function renderCustomerBill(
  metadata: ReceiptOrderMetadata,
  items: readonly ReceiptItemData[] = [],
  options?: { widthMm?: 58 | 80 }
): ReceiptRenderResult {
  const widthMm = options?.widthMm === 58 ? 58 : 80;
  const W = widthMm === 58 ? 32 : 48;
  const sepDouble = "=".repeat(W);
  const sepSingle = "-".repeat(W);

  const lines: string[] = [];

  // Firma Başlığı
  lines.push(sepDouble);
  const restName = (metadata.restaurantInfo?.name || "OXONOM RESTAURANT").toLocaleUpperCase("tr-TR");
  lines.push(padCenter(restName, W));
  if (metadata.restaurantInfo?.branchName) {
    lines.push(padCenter(`${metadata.restaurantInfo.branchName} Şubesi`, W));
  }
  lines.push(sepDouble);

  if (metadata.restaurantInfo?.address) {
    lines.push(...wrapLines(metadata.restaurantInfo.address, W));
  }
  if (metadata.restaurantInfo?.phone) {
    lines.push(`Tel: ${metadata.restaurantInfo.phone}`);
  }
  if (metadata.restaurantInfo?.website) {
    lines.push(metadata.restaurantInfo.website);
  }

  if (metadata.restaurantInfo?.taxOffice || metadata.restaurantInfo?.taxNumber) {
    lines.push("");
    if (metadata.restaurantInfo?.taxOffice) {
      lines.push(`Vergi Dairesi: ${metadata.restaurantInfo.taxOffice}`);
    }
    if (metadata.restaurantInfo?.taxNumber) {
      lines.push(`VKN: ${metadata.restaurantInfo.taxNumber}`);
    }
  }

  // Sipariş No & Tarih
  lines.push(sepSingle);
  lines.push(twoCols(`Sipariş No : #${metadata.orderNumber}`, "", W));
  lines.push(twoCols(`Tarih      : ${formatReceiptDate(metadata.createdAt)}`, "", W));
  lines.push(sepSingle);

  // Ürünler
  lines.push("");
  for (const it of items) {
    const name = it.variantName ? `${it.name} (${it.variantName})` : it.name;
    const left = `${it.quantity} x ${name}`;
    const price = formatReceiptCurrency(it.totalPrice ?? ((it.unitPrice ?? 0) * it.quantity));
    lines.push(twoCols(left, price, W));

    if (it.modifiers && it.modifiers.length > 0) {
      for (const m of it.modifiers) {
        const modName = typeof m === "string" ? m : m.name;
        lines.push(`   - ${modName}`);
      }
    }
  }
  lines.push("");

  // Finansallar
  if (metadata.subtotal !== undefined && metadata.subtotal !== metadata.grandTotal) {
    lines.push(twoCols("Ara Toplam", formatReceiptCurrency(metadata.subtotal), W));
  }
  if (metadata.deliveryFee && metadata.deliveryFee > 0) {
    lines.push(twoCols("Teslimat Bedeli", formatReceiptCurrency(metadata.deliveryFee), W));
  }
  if (metadata.discountTotal && metadata.discountTotal > 0) {
    lines.push(twoCols("İndirim", `-${formatReceiptCurrency(metadata.discountTotal)}`, W));
  }

  lines.push(sepSingle);
  lines.push(twoCols("GENEL TOPLAM", formatReceiptCurrency(metadata.grandTotal), W));
  lines.push(sepSingle);

  const payMode = metadata.paymentMode || "Nakit";
  lines.push(`Ödeme: ${payMode}`);
  lines.push("");
  lines.push("Siparişiniz için teşekkür ederiz.");
  lines.push("Afiyet olsun.");
  lines.push("");
  lines.push("*** BİLGİ FİŞİDİR - RESMİ MALİ BELGE DEĞİLDİR ***");
  lines.push(sepDouble);

  const plainText = lines.join("\n");
  const escposRaw = buildEscposFromPlain(lines, W);

  return { plainText, escposRaw, widthMm, maxCols: W };
}

/**
 * 3. MUTFAK FİŞİ (KOT)
 */
export function renderKitchenTicket(
  metadata: ReceiptOrderMetadata,
  items: readonly ReceiptItemData[] = [],
  options?: { widthMm?: 58 | 80; stationName?: string }
): ReceiptRenderResult {
  const widthMm = options?.widthMm === 58 ? 58 : 80;
  const W = widthMm === 58 ? 32 : 48;
  const sepDouble = "=".repeat(W);
  const sepSingle = "-".repeat(W);

  const lines: string[] = [];

  lines.push(sepDouble);
  if (options?.stationName) {
    lines.push(padCenter(`[ ${options.stationName.toLocaleUpperCase("tr-TR")} ]`, W));
  }
  const headerTitle = metadata.orderType === "DELIVERY"
    ? `PAKET #${metadata.orderNumber}`
    : metadata.orderType === "TAKEAWAY"
    ? `GEL-AL #${metadata.orderNumber}`
    : `MASA ${metadata.tableLabel || "?"} (#${metadata.orderNumber})`;
  lines.push(padCenter(headerTitle, W));
  lines.push(sepDouble);

  lines.push(`Saat: ${formatReceiptTime(metadata.createdAt)}`);
  const channel = (metadata.channel || metadata.orderType).toLocaleUpperCase("tr-TR");
  lines.push(`Kanal: ${channel}`);
  lines.push(sepSingle);

  for (const it of items) {
    const name = it.variantName ? `${it.name} (${it.variantName})` : it.name;
    lines.push(`${it.quantity} x ${name.toLocaleUpperCase("tr-TR")}`);

    if (it.modifiers && it.modifiers.length > 0) {
      for (const m of it.modifiers) {
        const modName = typeof m === "string" ? m : m.name;
        lines.push(`   + ${modName}`);
      }
    }
    if (it.lineNote) {
      lines.push(`   * Not: ${it.lineNote}`);
    }
    lines.push("");
  }

  const finalNote = metadata.customerNotes || metadata.note;
  if (finalNote) {
    lines.push(sepSingle);
    lines.push("NOT");
    lines.push(sepSingle);
    lines.push(...wrapLines(finalNote, W));
    lines.push(sepDouble);
  } else {
    lines.push(sepDouble);
  }

  const plainText = lines.join("\n");
  const escposRaw = buildEscposFromPlain(lines, W);

  return { plainText, escposRaw, widthMm, maxCols: W };
}

/**
 * 4. İŞLETME SİPARİŞ KOPYASI
 */
export function renderMerchantCopy(
  metadata: ReceiptOrderMetadata,
  items: readonly ReceiptItemData[] = [],
  options?: { widthMm?: 58 | 80 }
): ReceiptRenderResult {
  const widthMm = options?.widthMm === 58 ? 58 : 80;
  const W = widthMm === 58 ? 32 : 48;
  const sepDouble = "=".repeat(W);
  const sepSingle = "-".repeat(W);

  const lines: string[] = [];

  lines.push(sepDouble);
  lines.push(padCenter("İŞLETME SİPARİŞ KOPYASI", W));
  lines.push(padCenter(`SİPARİŞ #${metadata.orderNumber}`, W));
  lines.push(sepDouble);

  lines.push(twoCols(`Tarih: ${formatReceiptDate(metadata.createdAt)}`, "", W));
  const typeStr = metadata.orderType === "DELIVERY" ? "Paket Servis" : metadata.orderType === "TAKEAWAY" ? "Gel-Al" : "Masa";
  lines.push(twoCols(`Tür  : ${typeStr}`, "", W));
  lines.push(twoCols(`Kanal: ${metadata.channel || "Telefon / Caller ID"}`, "", W));

  if (metadata.customerName || metadata.customerPhone) {
    lines.push(`Müşteri: ${metadata.customerName || ""} ${metadata.customerPhone ? "(" + metadata.customerPhone + ")" : ""}`);
  }

  lines.push(sepSingle);
  for (const it of items) {
    const name = it.variantName ? `${it.name} (${it.variantName})` : it.name;
    const price = formatReceiptCurrency(it.totalPrice ?? ((it.unitPrice ?? 0) * it.quantity));
    lines.push(twoCols(`${it.quantity}x ${name}`, price, W));
  }

  lines.push(sepSingle);
  lines.push(twoCols("GENEL TOPLAM", formatReceiptCurrency(metadata.grandTotal), W));
  lines.push(twoCols("ÖDEME", metadata.paymentMode || "KAPIDA ÖDEME", W));
  lines.push(sepDouble);

  const plainText = lines.join("\n");
  const escposRaw = buildEscposFromPlain(lines, W);

  return { plainText, escposRaw, widthMm, maxCols: W };
}

/**
 * Cleanly transforms plain formatted lines into ESC/POS binary command string
 * for physical thermal printers. Never displays on screen!
 */
function buildEscposFromPlain(lines: string[], width: number): string {
  const ESC = "\x1B";
  const GS = "\x1D";

  let out = `${ESC}@`; // Initialize printer
  out += `${ESC}t\x12`; // Code page PC857 / Windows-1254 for Turkish

  for (const line of lines) {
    // Detect lines that should be bold
    const isDoubleSep = line.startsWith("===");
    const isSingleSep = line.startsWith("---");
    const isPayBox = line.startsWith("ÖDEME:") || line.startsWith("TAHSİLAT:") || line.startsWith("POS CİHAZI");
    const isHeader = line.includes("KURYE TESLİMAT") || line.includes("OXONOM RESTAURANT") || line.includes("İŞLETME SİPARİŞ KOPYASI") || line.startsWith("PAKET #") || line.startsWith("MASA ");

    if (isHeader || isPayBox) {
      out += `${ESC}E\x01`; // Bold ON
      out += line + "\n";
      out += `${ESC}E\x00`; // Bold OFF
    } else if (isDoubleSep || isSingleSep) {
      out += line + "\n";
    } else {
      out += line + "\n";
    }
  }

  // Feed lines & cut
  out += `${ESC}d\x03`; // Feed 3 lines
  out += `${GS}V\x01`; // Partial cut

  return out;
}
