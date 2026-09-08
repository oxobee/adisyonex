import { NetgsmProvider } from "./netgsm.provider";
import type { ITelephonyProvider, TelephonyProviderType } from "./types";

const providers: Record<TelephonyProviderType, ITelephonyProvider> = {
  NETGSM: new NetgsmProvider(),
  BULUTFON: {
    name: "BULUTFON",
    async testConnection() {
      return { success: false, message: "Bulutfon sağlayıcısı yakında eklenecektir." };
    },
    parseWebhook() {
      return null;
    },
  },
  GENERIC_SIP: {
    name: "GENERIC_SIP",
    async testConnection() {
      return { success: false, message: "Generic SIP sağlayıcısı yakında eklenecektir." };
    },
    parseWebhook() {
      return null;
    },
  },
};

export function getTelephonyProvider(name: string = "NETGSM"): ITelephonyProvider {
  const normalized = (name.toUpperCase() as TelephonyProviderType) || "NETGSM";
  return providers[normalized] || providers.NETGSM;
}
