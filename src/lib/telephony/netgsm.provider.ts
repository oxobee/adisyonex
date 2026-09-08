import { normalizePhoneNumber } from "@/lib/phone";
import type {
  CallLifecycleEvent,
  ITelephonyProvider,
  NormalizedTelephonyEvent,
  TelephonyConnectionTestResult,
  TelephonyCredentials,
} from "./types";

export class NetgsmProvider implements ITelephonyProvider {
  readonly name = "NETGSM" as const;

  /**
   * Tests Netgsm credentials against official Netgsm HTTP API.
   */
  async testConnection(credentials: TelephonyCredentials): Promise<TelephonyConnectionTestResult> {
    const username = credentials.apiUsername?.trim();
    const password = credentials.apiPassword?.trim();

    if (!username || !password) {
      return {
        success: false,
        message: "Bağlantı testi başarısız.",
        error: "API kullanıcı adı veya şifre eksik.",
      };
    }

    try {
      // Netgsm bakiye/hesap kontrol servisi üzerinden kimlik doğrulama testi
      const endpoint = `https://api.netgsm.com.tr/balance/list/get/?usercode=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "text/plain, application/xml, text/xml",
        },
      });
      clearTimeout(timeout);

      const text = (await res.text()).trim();

      // Netgsm returns:
      // "00" or credit amount on success e.g. "125.50" or "00 Paket Bilgisi: ..."
      // "30" -> Geçersiz kullanıcı adı veya şifre
      // "40" -> Arama terimi bulunamadı / Yetkisiz IP
      // "70" -> Hatalı sorgulama
      if (text.startsWith("30")) {
        return {
          success: false,
          message: "Netgsm bağlantısı kurulamadı.",
          error: "API kullanıcı adı veya şifre hatalı görünüyor.",
          details: { responseCode: text },
        };
      }

      if (text.startsWith("40")) {
        return {
          success: false,
          message: "Netgsm bağlantısı kurulamadı.",
          error: "Yetkisiz IP veya hesap API erişimine kapalı.",
          details: { responseCode: text },
        };
      }

      if (res.ok && !text.startsWith("70") && !text.startsWith("60")) {
        return {
          success: true,
          message: "Netgsm bağlantısı başarılı.",
          details: { rawResponse: text },
        };
      }

      return {
        success: false,
        message: "Netgsm santral bağlantısı kurulamadı.",
        error: `Netgsm yanıtı: ${text || "Bilinmeyen hata"}`,
        details: { status: res.status, rawResponse: text },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isTimeout = errorMsg.includes("abort") || errorMsg.includes("timeout");

      return {
        success: false,
        message: "Netgsm sunucusuna ulaşılamadı.",
        error: isTimeout
          ? "Netgsm sunucusundan zaman aşımı (timeout) nedeniyle yanıt alınamadı."
          : "Ağ bağlantısı kurulamadı. Lütfen internet bağlantınızı ve güvenlik duvarı ayarlarınızı kontrol edin.",
        details: { error: errorMsg },
      };
    }
  }

  /**
   * Parses Netgsm webhook payload (query or body) into standard event model.
   */
  parseWebhook(
    body: Record<string, unknown> = {},
    query: Record<string, string> = {}
  ): NormalizedTelephonyEvent | null {
    const merged: Record<string, unknown> = { ...query, ...body };

    // Netgsm caller parameter keys
    const rawCaller =
      merged.caller ||
      merged.from ||
      merged.caller_id ||
      merged.source ||
      merged.numara ||
      merged.calling ||
      merged.phone;

    if (!rawCaller || typeof rawCaller !== "string") {
      return null;
    }

    const rawCallee =
      merged.callee ||
      merged.to ||
      merged.destination ||
      merged.aranan ||
      merged.trunk;

    const rawCallId =
      merged.callid ||
      merged.call_id ||
      merged.id ||
      merged.session_id ||
      `netgsm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const rawEvent = String(
      merged.event ||
      merged.status ||
      merged.durum ||
      merged.action ||
      "ringing"
    ).toLowerCase();

    let event: CallLifecycleEvent = "RINGING";
    if (
      rawEvent.includes("answer") ||
      rawEvent.includes("baglandi") ||
      rawEvent.includes("aktif") ||
      rawEvent.includes("up")
    ) {
      event = "ANSWERED";
    } else if (
      rawEvent.includes("miss") ||
      rawEvent.includes("cevapsiz") ||
      rawEvent.includes("noanswer") ||
      rawEvent.includes("busy") ||
      rawEvent.includes("cancel")
    ) {
      event = "MISSED";
    } else if (
      rawEvent.includes("end") ||
      rawEvent.includes("hangup") ||
      rawEvent.includes("closed") ||
      rawEvent.includes("bitti") ||
      rawEvent.includes("bye")
    ) {
      event = "ENDED";
    }

    const rawExtension = merged.dahili || merged.extension || merged.internal;

    return {
      provider: this.name,
      providerCallId: String(rawCallId),
      fromNumber: String(rawCaller).trim(),
      normalizedFromNumber: normalizePhoneNumber(String(rawCaller)),
      toNumber: rawCallee ? String(rawCallee).trim() : undefined,
      sipExtension: rawExtension ? String(rawExtension).trim() : undefined,
      event,
      timestamp: new Date(),
      rawPayload: merged,
    };
  }
}
