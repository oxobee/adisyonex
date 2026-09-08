/**
 * OXONOM POS - Müşteri Kaynakları ve Sipariş Kanalları Tanımları
 * - Müşteri Kaynağı: Müşterinin ilk defa sisteme dahil olduğu kanal (sabit kalır).
 * - Sipariş Kanalı: İlgili siparişin açıldığı kanal (dinamik).
 */

export type CustomerSourceSlug =
  | "phone"
  | "qr_table"
  | "website"
  | "marketplace"
  | "pos"
  | "manual"
  | "other";

export type OrderChannelSlug =
  | "phone"
  | "qr_table"
  | "website"
  | "pos"
  | "marketplace"
  | "manual"
  | "other";

export interface ChannelMeta {
  id: string;
  label: string;
  icon: string;
  badgeClass: string;
  dotColor: string;
  description?: string;
}

export const CUSTOMER_SOURCES: ChannelMeta[] = [
  {
    id: "phone",
    label: "Telefon / Caller ID",
    icon: "📞",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
    dotColor: "bg-purple-500",
    description: "Telefonla arayıp sipariş veren veya çağrı merkezinden kaydedilen müşteri.",
  },
  {
    id: "qr_table",
    label: "Masa QR Menü",
    icon: "📱",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    description: "Masadaki QR kodu okutarak sipariş veren veya kampanyaya katılan müşteri.",
  },
  {
    id: "website",
    label: "Web Sitesi",
    icon: "🌐",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300",
    dotColor: "bg-sky-500",
    description: "Restoranın online web sitesinden sipariş vererek sisteme katılan müşteri.",
  },
  {
    id: "marketplace",
    label: "Pazaryeri",
    icon: "🛍️",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    dotColor: "bg-amber-500",
    description: "Yemeksepeti, Trendyol Yemek, GetirYemek vb. platformlardan gelen müşteri.",
  },
  {
    id: "pos",
    label: "POS / Kasa",
    icon: "💳",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    dotColor: "bg-slate-500",
    description: "Kasa personelinin doğrudan satış esnasında telefon ve isimle kaydettiği müşteri.",
  },
  {
    id: "manual",
    label: "Manuel Kayıt",
    icon: "✍️",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
    dotColor: "bg-orange-500",
    description: "Yönetim panelinden manuel olarak eklenen müşteri kartı.",
  },
  {
    id: "other",
    label: "Diğer",
    icon: "🏷️",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
    dotColor: "bg-gray-500",
    description: "Diğer harici kanallardan sisteme aktarılan müşteri.",
  },
];

export const ORDER_CHANNELS: ChannelMeta[] = [
  {
    id: "phone",
    label: "Telefon / Caller ID",
    icon: "📞",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
    dotColor: "bg-purple-500",
    description: "Caller ID veya telefon ile alınan siparişler.",
  },
  {
    id: "pos",
    label: "POS / Kasa",
    icon: "💳",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    dotColor: "bg-slate-500",
    description: "Doğrudan kasa satış terminalinden girilen siparişler.",
  },
  {
    id: "qr_table",
    label: "Masa QR Menü",
    icon: "📱",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    description: "Müşterinin masadaki QR menü üzerinden verdiği siparişler.",
  },
  {
    id: "website",
    label: "Web Sitesi",
    icon: "🌐",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300",
    dotColor: "bg-sky-500",
    description: "Restoranın online web sitesinden oluşturulan siparişler.",
  },
  {
    id: "marketplace",
    label: "Pazaryeri Entegrasyonu",
    icon: "🛍️",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
    dotColor: "bg-amber-500",
    description: "Yemeksepeti, Trendyol, Getir vb. platform siparişleri.",
  },
  {
    id: "manual",
    label: "Manuel Giriş",
    icon: "✍️",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
    dotColor: "bg-orange-500",
    description: "Yönetim ekranından açılan manuel siparişler.",
  },
  {
    id: "other",
    label: "Diğer",
    icon: "🏷️",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
    dotColor: "bg-gray-500",
    description: "Harici API veya entegrasyon siparişleri.",
  },
];

export const MARKETPLACE_PROVIDERS = [
  { id: "yemeksepeti", label: "Yemeksepeti", icon: "🔴", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
  { id: "trendyol", label: "Trendyol Yemek", icon: "🟠", badgeClass: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "getir", label: "GetirYemek", icon: "🟣", badgeClass: "bg-violet-100 text-violet-800 border-violet-200" },
  { id: "migros", label: "Migros Yemek", icon: "🟢", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
];

const CUSTOMER_SOURCES_MAP = new Map<string, ChannelMeta>(
  CUSTOMER_SOURCES.map((s) => [s.id, s])
);

const ORDER_CHANNELS_MAP = new Map<string, ChannelMeta>(
  ORDER_CHANNELS.map((c) => [c.id, c])
);

/**
 * Müşteri kaynağını Türkçe rozet ve icon ile döndürür
 */
export function getCustomerSourceMeta(source?: string | null, provider?: string | null): ChannelMeta {
  if (provider && provider.trim()) {
    const p = provider.trim().toLowerCase();
    if (p.includes("yemeksepeti")) {
      return {
        id: "marketplace:yemeksepeti",
        label: "Yemeksepeti",
        icon: "🔴",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
        dotColor: "bg-rose-500",
      };
    }
    if (p.includes("trendyol")) {
      return {
        id: "marketplace:trendyol",
        label: "Trendyol Yemek",
        icon: "🟠",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
        dotColor: "bg-orange-500",
      };
    }
    if (p.includes("getir")) {
      return {
        id: "marketplace:getir",
        label: "GetirYemek",
        icon: "🟣",
        badgeClass: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300",
        dotColor: "bg-violet-500",
      };
    }
    return {
      id: `marketplace:${provider}`,
      label: provider,
      icon: "🛍️",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
      dotColor: "bg-amber-500",
    };
  }

  if (!source) {
    return CUSTOMER_SOURCES_MAP.get("pos") || CUSTOMER_SOURCES[4];
  }
  const found = CUSTOMER_SOURCES_MAP.get(source.toLowerCase());
  if (found) return found;

  return {
    id: source,
    label: source,
    icon: "🏷️",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
    dotColor: "bg-gray-500",
  };
}

/**
 * Sipariş kanalını Türkçe ve rozet bilgisiyle döndürür
 */
export function getOrderChannelMeta(channel?: string | null, provider?: string | null): ChannelMeta {
  if (provider && provider.trim()) {
    const p = provider.trim().toLowerCase();
    if (p.includes("yemeksepeti")) {
      return {
        id: "marketplace:yemeksepeti",
        label: "Yemeksepeti",
        icon: "🔴",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
        dotColor: "bg-rose-500",
      };
    }
    if (p.includes("trendyol")) {
      return {
        id: "marketplace:trendyol",
        label: "Trendyol Yemek",
        icon: "🟠",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
        dotColor: "bg-orange-500",
      };
    }
    if (p.includes("getir")) {
      return {
        id: "marketplace:getir",
        label: "GetirYemek",
        icon: "🟣",
        badgeClass: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300",
        dotColor: "bg-violet-500",
      };
    }
    return {
      id: `marketplace:${provider}`,
      label: provider,
      icon: "🛍️",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
      dotColor: "bg-amber-500",
    };
  }

  if (!channel) {
    return ORDER_CHANNELS_MAP.get("pos") || ORDER_CHANNELS[1];
  }
  const found = ORDER_CHANNELS_MAP.get(channel.toLowerCase());
  if (found) return found;

  return {
    id: channel,
    label: channel,
    icon: "🏷️",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
    dotColor: "bg-gray-500",
  };
}
