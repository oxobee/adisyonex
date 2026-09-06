/**
 * Unified Thermal Printer Client Abstraction
 * Powered by official QZ Tray integration.
 * Decoupled from UI components to allow future swap-in of custom native agents.
 */

import { EscPosBuilder } from "./escpos";
import type { RestaurantZoneDTO } from "@/types/staff";

export interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface DetectedPrintersResult {
  available: boolean;
  printers: string[];
  error?: string;
}

/**
 * Dynamically loads official qz-tray module in client-side environment only.
 */
async function getQz() {
  if (typeof window === "undefined") {
    throw new Error("QZ Tray sadece tarayıcı ortamında çalışır.");
  }
  const qzMod = await import("qz-tray");
  return qzMod.default || qzMod;
}

/**
 * Ensures a healthy active connection with local QZ Tray instance.
 */
async function ensureQzConnected() {
  const qz = await getQz();
  if (qz.websocket.isActive()) {
    return qz;
  }

  try {
    // retries: 3, delay: 1 gives enough time for QZ Tray dialog prompt
    await qz.websocket.connect({ retries: 3, delay: 1 });
  } catch (err: unknown) {
    if (qz.websocket.isActive()) {
      return qz;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("already exists") ||
      msg.includes("already connected") ||
      msg.includes("already active")
    ) {
      return qz;
    }

    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const sslHint = isHttps
      ? " HTTPS üzerinde çalışıyorsanız, bir kereye mahsus yeni sekmede https://localhost:8181 adresini açıp 'Gelişmiş -> localhost sitesine ilerle' seçeneğini onaylamanız gerekebilir."
      : "";

    throw new Error(
      `QZ Tray servisine bağlanılamadı. Lütfen QZ Tray uygulamasının çalıştığından ve izin penceresinde 'İzin Ver' (Allow) seçtiğinizden emin olun.${sslHint}`
    );
  }

  return qz;
}

export class PrinterClient {
  /**
   * Scans for all printers installed on the local operating system via QZ Tray.
   */
  static async detectPrinters(): Promise<DetectedPrintersResult> {
    try {
      if (typeof window === "undefined") {
        return { available: false, printers: [] };
      }

      const qz = await ensureQzConnected();
      const printers = await qz.printers.find();
      const list = Array.isArray(printers) ? printers : [];
      return {
        available: true,
        printers: list,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Yazıcılar taranamadı.";
      return {
        available: false,
        printers: [],
        error: msg,
      };
    }
  }

  /**
   * Prints raw ESC/POS commands directly to the targeted zone printer.
   */
  static async printRaw(
    zone: RestaurantZoneDTO,
    rawText: string
  ): Promise<PrintResult> {
    if (!zone.printerEnabled && zone.printerEnabled !== undefined) {
      return {
        success: false,
        error: `'${zone.name}' bölgesinde yazıcı etkinleştirilmemiş.`,
      };
    }

    const connectionType =
      zone.printerConnectionType ||
      (zone.printerIp ? "NETWORK" : "LOCAL_OS");

    if (connectionType === "LOCAL_OS") {
      const printerName = zone.printerSystemName || zone.printerModel;
      if (!printerName) {
        return {
          success: false,
          error: "Bölge için seçili bir Sistem Yazıcısı bulunamadı.",
        };
      }

      try {
        const qz = await ensureQzConnected();
        const config = qz.configs.create(printerName, {
          encoding: "windows-1254",
        });
        await qz.print(config, [
          {
            type: "raw",
            format: "command",
            flavor: "plain",
            data: rawText,
          },
        ]);
        return {
          success: true,
          message: `'${printerName}' yazıcısına başarıyla gönderildi.`,
        };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Yazıcıya gönderilirken bir hata oluştu.",
        };
      }
    }

    if (connectionType === "NETWORK") {
      if (!zone.printerIp) {
        return {
          success: false,
          error: "Ağ yazıcısı için IP adresi tanımlı değil.",
        };
      }

      try {
        const qz = await ensureQzConnected();
        const config = qz.configs.create({
          host: zone.printerIp,
          port: String(zone.printerPort || 9100),
        });
        await qz.print(config, [
          {
            type: "raw",
            format: "command",
            flavor: "plain",
            data: rawText,
          },
        ]);
        return {
          success: true,
          message: `${zone.printerIp}:${zone.printerPort || 9100} IP yazıcısına iletildi.`,
        };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Ağ yazıcısına ulaşılamadı. IP ve Port ayarlarını kontrol edin.",
        };
      }
    }

    return {
      success: false,
      error: "Bilinmeyen bağlantı türü.",
    };
  }

  /**
   * Generates and prints the standard diagnostic test ticket for a RestaurantZone.
   * Requirement #7:
   * MUTFAK
   * ADİSYOON
   * YAZICI TESTİ
   * ---
   * Bölge: Mutfak
   * Yazıcı: XP-80C
   * Durum: Başarılı
   * ---------------
   */
  static async printTestReceipt(zone: RestaurantZoneDTO): Promise<PrintResult> {
    const width = zone.printerPaperWidth ?? 80;
    const builder = new EscPosBuilder({ widthMm: width });

    const nowStr = new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date());

    builder
      .alignCenter()
      .doubleSize()
      .bold(true)
      .line(zone.name.toUpperCase())
      .normalSize()
      .line("ADİSYOON")
      .bold(false)
      .line("YAZICI TESTİ")
      .separator()
      .alignLeft()
      .twoColumnRow("Bölge:", zone.name)
      .twoColumnRow(
        "Yazıcı:",
        zone.printerSystemName || zone.printerModel || zone.printerIp || "Tanımsız"
      )
      .twoColumnRow(
        "Bağlantı:",
        zone.printerConnectionType === "NETWORK"
          ? `Ağ (${zone.printerIp}:${zone.printerPort || 9100})`
          : "Bilgisayara Bağlı (OS)"
      )
      .twoColumnRow("Kağıt:", `${width} mm`)
      .twoColumnRow("Durum:", "Başarılı")
      .separator()
      .alignCenter()
      .line(`Tarih: ${nowStr}`)
      .feed(3)
      .cut();

    const raw = builder.build();
    return this.printRaw(zone, raw);
  }
}
