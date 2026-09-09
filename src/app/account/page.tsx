import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CaretLeftIcon,
  CheckCircleIcon,
  StorefrontIcon,
  SparkleIcon,
  ShieldCheckIcon,
  HeadphonesIcon,
  DownloadIcon,
  SlidersIcon,
  DeviceMobileIcon,
  PackageIcon,
  LightningIcon,
  ArrowRightIcon,
  LogoutIcon,
} from "@/components/ui/icons";
import { BottomNavigation } from "@/components/boss/bottom-navigation";
import { AccountClientSections } from "./account-client";

export const dynamic = "force-dynamic";

interface AccountPageProps {
  searchParams: Promise<{
    restaurantId?: string;
  }>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const resolvedSearchParams = await searchParams;

  // Restoranları çek
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, branchName: true },
    orderBy: { name: "asc" },
  });

  const currentRestaurant =
    restaurants.find((r) => r.id === resolvedSearchParams.restaurantId) ||
    restaurants[0];

  const restaurantId = currentRestaurant?.id;

  // Yetkili kullanıcı bilgilerini çek
  const restaurantWithOwner = restaurantId
    ? await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      })
    : null;

  const ownerName = restaurantWithOwner?.owner?.name || "Emre Bilgin";
  const ownerEmail = restaurantWithOwner?.owner?.email || "emre@bilginrestoran.com";
  const ownerPhone = restaurantWithOwner?.owner?.phone || "+90 (532) 741 89 20";
  const branchName = currentRestaurant?.branchName
    ? `${currentRestaurant.name} - ${currentRestaurant.branchName} Şubesi`
    : `${currentRestaurant?.name || "Oxonom"} - Karaköy Rıhtım Şubesi`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-indigo-500 selection:text-white pb-32">
      {/* Mobil Kapsayıcı (Responsive 360-420px) */}
      <div className="mx-auto w-full max-w-[420px] bg-[#F8FAFC] shadow-2xl sm:border-x sm:border-slate-200/60 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href={`/boss${restaurantId ? `?restaurantId=${restaurantId}` : ""}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
            >
              <CaretLeftIcon size={18} weight="bold" />
            </Link>
            <div>
              <h1 className="text-base font-black text-slate-900">Hesabım</h1>
              <p className="text-[11px] font-semibold text-slate-500">
                Yetkili & Lisans Yönetimi
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200/60">
            Aktif Hesap
          </span>
        </header>

        {/* Ana İçerik */}
        <main className="flex-1 space-y-4 px-4 pt-4 pb-6">
          {/* 1. Giriş Yapan Yetkili Bilgileri Kartı (Görsel 1 Birebir) */}
          <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-100 via-purple-50 to-indigo-200 text-base font-black text-indigo-700 shadow-sm">
                  EB
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <CheckCircleIcon size={13} weight="bold" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-slate-900 leading-tight">
                      {ownerName}
                    </h2>
                    <span className="text-indigo-600">
                      <CheckCircleIcon size={16} weight="fill" />
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    İşletme Sahibi / Patron
                  </p>
                  <p className="text-[11px] font-bold text-indigo-600">
                    {branchName}
                  </p>
                </div>
              </div>

              {/* Ayarlar İkonu */}
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100"
              >
                <SlidersIcon size={18} weight="bold" />
              </button>
            </div>

            {/* Email ve Telefon Satırları */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700">
                <span className="text-slate-400">✉</span>
                <span className="truncate">{ownerEmail}</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700">
                <span className="text-slate-400">📞</span>
                <span>{ownerPhone}</span>
              </div>
            </div>

            {/* Alt Durum Etiketleri */}
            <div className="flex items-center gap-2 pt-1 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Sistem Çevrimiçi</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                <StorefrontIcon size={13} weight="duotone" className="text-indigo-600" />
                <span className="truncate max-w-[170px]">Aktif Şube: Karaköy Rıhtım</span>
              </div>
            </div>
          </section>

          {/* 2. Lisans Bilgileri Kartı (Görsel 1 Alt Bölüm) */}
          <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Oxonom Pro + AI Ekosistem
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Ticari Çoklu Cihaz ve AI Mutfak İşletim Paketi
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-200/60 whitespace-nowrap">
                Yıllık • %20 İndirimli
              </span>
            </div>

            {/* Fiyat & Kalan Gün Sayısı */}
            <div className="flex items-center justify-between rounded-2xl bg-indigo-50/40 p-3.5 border border-indigo-100/50">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  AYLIK EŞDEĞER BEDEL
                </div>
                <div className="mt-0.5 text-2xl font-black text-slate-900">
                  ₺3.250<span className="text-xs font-semibold text-slate-500"> / ay</span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-xs font-black text-indigo-700">
                  <span>📅</span>
                  <span>142 Gün</span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Yenileme: 12 Oca 2025
                </div>
              </div>
            </div>

            {/* Kalan Gün Grafiği (Progress Bar) */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                <span>Lisans Süresi</span>
                <span className="text-indigo-600">%39 Kaldı (142 / 365 Gün)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: "39%" }}
                />
              </div>
            </div>

            {/* 3'lü Metrik Kartları (Modül, Cihaz, Destek) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 text-center border border-slate-100">
                <span className="text-base">🎛</span>
                <span className="mt-1 text-xs font-black text-slate-900">6 Modül</span>
                <span className="text-[10px] font-medium text-slate-500">Tam Erişim</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 text-center border border-slate-100">
                <span className="text-base">📱</span>
                <span className="mt-1 text-xs font-black text-slate-900">14 Cihaz</span>
                <span className="text-[10px] font-medium text-slate-500">POS & KDS</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 text-center border border-slate-100">
                <span className="text-base">🎧</span>
                <span className="mt-1 text-xs font-black text-slate-900">VIP</span>
                <span className="text-[10px] font-medium text-slate-500">7/24 Destek</span>
              </div>
            </div>

            {/* Aksiyon Butonları: Paket Yükselt / Değiştir */}
            <div className="pt-1">
              <button
                type="button"
                className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition active:scale-95"
              >
                <LightningIcon size={16} weight="fill" />
                <span>Paket Yükselt / Değiştir</span>
              </button>
            </div>

            {/* Mock Veri Uyarısı */}
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
              <span>⚠️</span>
              <span>Bu alandaki lisans planı bilgileri şimdilik mock veridir.</span>
            </div>
          </section>

          {/* 3, 4, 5, 6, 7. Kısımlar: İstemci Taraflı Bölümler (AI Kredi, Manuel Yükleme, Fatura, Güvenlik, Çıkış Modalı) */}
          <AccountClientSections />
        </main>

        {/* Sabit Alt Navigasyon (Hesabım Aktif) */}
        <BottomNavigation activeTab="profile" />
      </div>
    </div>
  );
}
