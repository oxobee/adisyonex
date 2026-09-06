/**
 * Unified Thermal Printer Client Abstraction
 * Supports LOCAL_OS (via QZ Tray / local print agent) and NETWORK (direct TCP socket).
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
 * Low-level QZ Tray / Local Agent WebSocket client
 */
class QzTrayConnector {
  private ws: WebSocket | null = null;
  private reqId: number = 0;
  private pending = new Map<
    number,
    { resolve: (val: unknown) => void; reject: (err: Error) => void }
  >();

  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        return reject(new Error("Browser environment required for QZ Tray."));
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        return resolve(this.ws);
      }

      // Standard QZ Tray local ports (8182 unsecure, 8181 secure)
      const ports = [8182, 8181];
      let currentPortIndex = 0;

      const tryNext = () => {
        if (currentPortIndex >= ports.length) {
          return reject(
            new Error(
              "QZ Tray servisi bulunamadı. Lütfen bilgisayarınızda QZ Tray uygulamasını çalıştırın."
            )
          );
        }

        const port = ports[currentPortIndex++];
        const protocol = port === 8181 ? "wss" : "ws";
        const url = `${protocol}://localhost:${port}`;

        try {
          const socket = new WebSocket(url);
          const timer = setTimeout(() => {
            socket.close();
            tryNext();
          }, 1500);

          socket.onopen = () => {
            clearTimeout(timer);
            this.ws = socket;
            this.setupListeners(socket);
            resolve(socket);
          };

          socket.onerror = () => {
            clearTimeout(timer);
            socket.close();
            tryNext();
          };
        } catch {
          tryNext();
        }
      };

      tryNext();
    });
  }

  private setupListeners(socket: WebSocket) {
    socket.onmessage = (event) => {
      try {
        const res = JSON.parse(event.data);
        if (res.uid && this.pending.has(res.uid)) {
          const { resolve, reject } = this.pending.get(res.uid)!;
          this.pending.delete(res.uid);
          if (res.error) {
            reject(new Error(res.error));
          } else {
            resolve(res.result);
          }
        }
      } catch {
        // ignore malformed frame
      }
    };

    socket.onclose = () => {
      this.ws = null;
    };
  }

  async sendRequest<T = unknown>(call: string, params: unknown[] = []): Promise<T> {
    const socket = await this.connect();
    const uid = ++this.reqId;

    const payload = JSON.stringify({
      call,
      params,
      uid,
      timestamp: Date.now(),
    });

    return new Promise<T>((resolve, reject) => {
      this.pending.set(uid, {
        resolve: resolve as (val: unknown) => void,
        reject,
      });
      socket.send(payload);

      setTimeout(() => {
        if (this.pending.has(uid)) {
          this.pending.delete(uid);
          reject(new Error("Yazıcı yanıt zaman aşımına uğradı."));
        }
      }, 7000);
    });
  }
}

const connector = new QzTrayConnector();

export class PrinterClient {
  /**
   * Scans for all printers installed on the local operating system.
   */
  static async detectPrinters(): Promise<DetectedPrintersResult> {
    try {
      if (typeof window === "undefined") {
        return { available: false, printers: [] };
      }

      // Try QZ Tray native call
      const printers = await connector.sendRequest<string[]>("printers.find");
      return {
        available: true,
        printers: Array.isArray(printers) ? printers : [],
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
        await connector.sendRequest("print", [
          { name: printerName },
          [{ type: "raw", format: "plain", data: rawText }],
        ]);
        return {
          success: true,
          message: `${printerName} yazıcısına başarıyla gönderildi.`,
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

      // Network printer dispatch via local agent or server bridge
      try {
        // Attempt sending via local QZ socket or server endpoint if available
        await connector.sendRequest("print", [
          { host: zone.printerIp, port: zone.printerPort || 9100 },
          [{ type: "raw", format: "plain", data: rawText }],
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
