import {
  ArmchairIcon,
  BarChart3Icon,
  BookOpenIcon,
  BoxesIcon,
  CalculatorIcon,
  ChefHatIcon,
  FileSpreadsheetIcon,
  GiftIcon,
  HeadphonesIcon,
  ImagesIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  PaletteIcon,
  QrCodeIcon,
  ReceiptIcon,
  ReceiptTextIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StoreIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PermissionScreenItem {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  badge?: string;
}

export interface PermissionCategoryGroup {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  items: PermissionScreenItem[];
}

export const PERMISSION_MATRIX_GROUPS: PermissionCategoryGroup[] = [
  {
    id: "operasyon",
    title: "1. Temel Operasyonel Ekranlar",
    desc: "Masa siparişleri, mutfak hazırlık takibi ve hızlı kasa",
    icon: ArmchairIcon,
    items: [
      {
        id: "/dashboard/orders",
        title: "Masalar & Canlı Adisyon",
        desc: "Masa yerleşimi, açık adisyonlar ve sipariş alma",
        icon: ReceiptTextIcon,
        badge: "01",
      },
      {
        id: "/dashboard/kitchen",
        title: "Mutfak & Hazırlık (KOT)",
        desc: "Aşçı ve mutfak sipariş hazırlık ekranı",
        icon: ChefHatIcon,
        badge: "02",
      },
      {
        id: "/dashboard/pos",
        title: "POS / Hızlı Kasa",
        desc: "Hızlı satış, adisyon kapatma ve tahsilat",
        icon: CalculatorIcon,
        badge: "03",
      },
    ],
  },
  {
    id: "analitik_raporlar",
    title: "2. Raporlama, Müşteriler & Gün Sonu",
    desc: "Finansal özetler, müşteri sadakat listesi ve Z raporları",
    icon: BarChart3Icon,
    items: [
      {
        id: "/dashboard",
        title: "Analitik & Satış Grafikleri",
        desc: "Günlük ciro, trendler ve operasyonel metrikler",
        icon: LayoutDashboardIcon,
        badge: "04",
      },
      {
        id: "/dashboard/customers",
        title: "Kayıtlı Müşteriler",
        desc: "Müşteri profilleri ve sadakat puanları",
        icon: TrendingUpIcon,
        badge: "05",
      },
      {
        id: "/dashboard/z-report",
        title: "Z Raporu / Gün Sonu",
        desc: "Kasa mutabakatı ve gün sonu mali raporları",
        icon: FileSpreadsheetIcon,
        badge: "Mali",
      },
    ],
  },
  {
    id: "sistem_modulleri",
    title: "3. Sistem Yönetim Merkezi & Alt Modülleri",
    desc: "Menü, masa & QR, personel, stok ve yapay zeka yapılandırması",
    icon: SlidersHorizontalIcon,
    items: [
      {
        id: "/dashboard/system",
        title: "Sistem (Genel Hub)",
        desc: "Sistem yönetim merkezi ana ekranı",
        icon: SlidersHorizontalIcon,
      },
      {
        id: "/dashboard/menu",
        title: "Sistem - Menü Yönetimi",
        desc: "Kategoriler, ürünler, fiyatlar ve porsiyonlar",
        icon: BookOpenIcon,
      },
      {
        id: "/dashboard/menu-design",
        title: "Sistem - QR Menü Tasarımı",
        desc: "Görsel menü şablonları ve tema ayarları",
        icon: PaletteIcon,
      },
      {
        id: "/dashboard/tables",
        title: "Sistem - Masa ve QR Yönetimi",
        desc: "Salon yerleşimi, masa numaraları ve QR kodları",
        icon: ArmchairIcon,
      },
      {
        id: "/dashboard/staff",
        title: "Sistem - Personel Yönetimi",
        desc: "Çalışan listesi, roller, bölgeler ve yetkiler",
        icon: UsersIcon,
      },
      {
        id: "/dashboard/inventory",
        title: "Sistem - Stok & Envanter",
        desc: "Hammadde takibi ve kritik stok uyarıları",
        icon: BoxesIcon,
      },
      {
        id: "/dashboard/ai-studio",
        title: "Sistem - Yapay Zeka Stüdyosu",
        desc: "AI fotoğraf geliştirme ve ürün açıklama stüdyosu",
        icon: SparklesIcon,
      },
      {
        id: "/dashboard/modules",
        title: "Sistem - Sistem Modülleri",
        desc: "Aktif modül vitrini ve ek paketler",
        icon: SparklesIcon,
      },
    ],
  },
  {
    id: "restoran_ayarlari",
    title: "4. Restoran Ayarları & Alt Sekmeleri",
    desc: "İşletme profili, lisans, vergi, konum harita ve güvenlik ayarları",
    icon: Settings2Icon,
    items: [
      {
        id: "/dashboard/settings",
        title: "Restoran Ayarları (Genel)",
        desc: "Restoran ayarları ana ekranı",
        icon: Settings2Icon,
      },
      {
        id: "/dashboard/settings#profile",
        title: "Restoran Ayarları - İşletme Profili",
        desc: "Restoran adı, logo, iletişim ve marka renkleri",
        icon: StoreIcon,
      },
      {
        id: "/dashboard/settings#license",
        title: "Restoran Ayarları - Lisans & Satış Temsilcisi",
        desc: "Abonelik durumu ve temsilci bilgileri",
        icon: HeadphonesIcon,
      },
      {
        id: "/dashboard/settings#location",
        title: "Restoran Ayarları - Konum & Harita",
        desc: "GPS koordinatları ve harita yerleşimi",
        icon: MapPinIcon,
      },
      {
        id: "/dashboard/settings#ordering",
        title: "Restoran Ayarları - QR Menü & Sipariş",
        desc: "Masadan müşteri siparişi yapılandırması",
        icon: QrCodeIcon,
      },
      {
        id: "/dashboard/settings#billing",
        title: "Restoran Ayarları - Fatura & Vergi",
        desc: "KDV oranları, fatura alt notu ve fiş ayarları",
        icon: ReceiptIcon,
      },
      {
        id: "/dashboard/settings#media",
        title: "Restoran Ayarları - Görseller & Medya",
        desc: "Fotoğraf galerisi ve tanıtım videoları",
        icon: ImagesIcon,
      },
      {
        id: "/dashboard/settings#access",
        title: "Restoran Ayarları - Giriş & Güvenlik",
        desc: "Kullanıcı adı, ekran kilidi ve PIN kodları",
        icon: KeyRoundIcon,
      },
    ],
  },
];

export const ALL_PERMISSION_ROUTE_IDS: string[] = PERMISSION_MATRIX_GROUPS.flatMap(
  (group) => group.items.map((item) => item.id)
);

/**
 * Rol adına veya unvanına göre varsayılan izin listesi üretir
 */
export function getDefaultRoutesForRoleTitle(roleTitle: string): string[] {
  const lower = roleTitle.toLowerCase();
  if (lower.includes("müdür") || lower.includes("yönetici") || lower.includes("admin")) {
    return [...ALL_PERMISSION_ROUTE_IDS];
  }
  if (lower.includes("aşçı") || lower.includes("şef") || lower.includes("mutfak")) {
    return ["/dashboard/kitchen"];
  }
  if (lower.includes("kasiyer") || lower.includes("kasa")) {
    return ["/dashboard/pos", "/dashboard/orders", "/dashboard/z-report"];
  }
  if (lower.includes("garson") || lower.includes("komi")) {
    return ["/dashboard/orders"];
  }
  if (lower.includes("barista")) {
    return ["/dashboard/orders", "/dashboard/pos"];
  }
  return ["/dashboard/orders"];
}

/**
 * Belirli bir rotaya erişim yetkisinin olup olmadığını kontrol eder
 */
export function hasPermissionForRoute(
  allowedRoutes: readonly string[] | null | undefined,
  targetRoute: string
): boolean {
  if (!allowedRoutes || allowedRoutes.length === 0) return true;

  // Doğrudan eşleşme
  if (allowedRoutes.includes(targetRoute)) return true;

  // Ayarlar alt sekmesi kontrolü
  if (targetRoute.startsWith("/dashboard/settings")) {
    const hasAnySettings = allowedRoutes.some((r) => r.startsWith("/dashboard/settings"));
    if (hasAnySettings) return true;
  }

  // Sistem alt rotaları kontrolü
  if (targetRoute === "/dashboard/system") {
    const systemSubRoutes = [
      "/dashboard/menu",
      "/dashboard/menu-design",
      "/dashboard/tables",
      "/dashboard/staff",
      "/dashboard/inventory",
      "/dashboard/ai-studio",
      "/dashboard/modules",
      "/dashboard/settings",
      "/dashboard/system",
    ];
    return systemSubRoutes.some((r) => allowedRoutes.includes(r));
  }

  return false;
}
