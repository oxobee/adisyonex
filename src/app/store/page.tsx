import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CaretLeftIcon,
  SlidersIcon,
  SparkleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  BagIcon,
  DeviceMobileIcon,
  FileTextIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { getSession } from "@/lib/session";
import { BottomNavigation } from "@/components/boss/bottom-navigation";

export const dynamic = "force-dynamic";

interface StorePageProps {
  searchParams: Promise<{
    restaurantId?: string;
  }>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const session = await getSession();
  const resolvedSearchParams = await searchParams;

  let restaurants = await prisma.restaurant.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(session?.userId ? { ownerId: session.userId } : {}),
    },
    select: { id: true, name: true, branchName: true },
    orderBy: { name: "asc" },
  });

  if (!restaurants.length) {
    restaurants = await prisma.restaurant.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, branchName: true },
      orderBy: { name: "asc" },
    });
  }

  const currentRestaurant =
    (resolvedSearchParams.restaurantId &&
      restaurants.find((r) => r.id === resolvedSearchParams.restaurantId)) ||
    restaurants[0];

  const branchDisplay = currentRestaurant?.branchName
    ? `${currentRestaurant.branchName} Şubesi`
    : `${currentRestaurant?.name || "Karaköy"} Şubesi`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased pb-28 selection:bg-indigo-500 selection:text-white">
      {/* Mobil Genişlik Kapsayıcısı (Responsive 360-420px) */}
      <div className="mx-auto w-full max-w-[420px] bg-[#F8FAFC] shadow-2xl sm:border-x sm:border-slate-200/60 min-h-screen flex flex-col">
        {/* Üst Arama Çubuğu */}
        <div className="sticky top-0 z-30 bg-white/95 px-4 pt-3 pb-2.5 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <SearchIcon
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Uygulama, donanım veya baskı ara..."
                className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
              aria-label="Filtrele"
            >
              <SlidersIcon size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Ana İçerik */}
        <main className="flex-1 space-y-6 px-4 pt-4 pb-6">
          {/* 1. Mavi Hero Banner: AI Studio + Patron App */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 p-5 text-white shadow-xl shadow-indigo-600/25">
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
                <SparkleIcon size={12} weight="fill" className="text-amber-300" />
                <span>YENİ SEZON AVANTAJI</span>
              </span>
              <div className="text-right">
                <span className="text-[11px] line-through text-indigo-300">
                  ₺1.698/ay
                </span>
                <div className="text-xl font-black text-white leading-none">
                  ₺1.273<span className="text-xs font-semibold text-indigo-200">/ay</span>
                </div>
              </div>
            </div>

            <h2 className="mt-3 text-lg font-black leading-snug text-white">
              AI Studio + Patron App
            </h2>
            <p className="mt-1 text-xs text-indigo-100/90 leading-relaxed max-w-[280px]">
              Yıllık toplu abonelikte anında %25 indirim ve 5.000 hediye AI görsel kredisi.
            </p>

            <div className="mt-5 flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
                <CheckCircleIcon size={15} weight="fill" className="text-emerald-400" />
                <span>Aynı Gün Kurulum</span>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-xs font-black text-indigo-700 shadow-md transition hover:bg-indigo-50 active:scale-95"
              >
                <span>İncele</span>
                <ArrowRightIcon size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* 2. Filtre Hapları (Pill Tabs) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Tümü
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-white shadow-md shadow-indigo-600/25"
            >
              <span>Uygulamalar</span>
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Donanım
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Matbaa
            </button>
          </div>

          {/* 3. Restoran Donanımları */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Restoran Donanımları
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Oxonom sistemleriyle tak-çalıştır tam uyumlu cihazlar
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Tümü
              </button>
            </div>

            {/* Yatay Kaydırılabilir Donanım Kartları */}
            <div className="flex items-stretch gap-3 overflow-x-auto pb-2 no-scrollbar">
              {/* Donanım 1: Oxonom HandPOS v3 */}
              <div className="w-[240px] shrink-0 rounded-[22px] border border-slate-200/90 bg-white p-3.5 shadow-sm">
                <div className="relative h-32 w-full overflow-hidden rounded-xl bg-slate-100">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-700 flex flex-col items-center justify-center text-white">
                    <DeviceMobileIcon size={44} weight="duotone" className="text-amber-400" />
                    <span className="mt-1 text-[10px] font-bold text-slate-300">Oxonom POS Terminal</span>
                  </div>
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-extrabold text-white backdrop-blur-sm">
                    Tak-Çalıştır
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-xs font-black text-slate-900">
                    Oxonom HandPOS v3
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                    5.5 inç parlak ekran, dahili 58mm termal yazıcı, düşmeye dayanıklı kasa.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-black text-slate-900">
                    ₺7.450
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-800 hover:bg-slate-200 transition"
                  >
                    <span>Sepete Ekle</span>
                  </button>
                </div>
              </div>

              {/* Donanım 2: Kitchen KDS Ekran */}
              <div className="w-[240px] shrink-0 rounded-[22px] border border-slate-200/90 bg-white p-3.5 shadow-sm">
                <div className="relative h-32 w-full overflow-hidden rounded-xl bg-slate-100">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-slate-800 flex flex-col items-center justify-center text-white">
                    <div className="text-2xl font-black text-indigo-300">KDS 21.5&quot;</div>
                    <span className="mt-1 text-[10px] font-bold text-slate-300">Mutfak Ekran Paneli</span>
                  </div>
                  <span className="absolute left-2 top-2 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold text-white">
                    IP65 Dayanıklı
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-xs font-black text-slate-900">
                    Kitchen KDS Pro
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                    21.5 inç IP65 suya dayanıklı endüstriyel mutfak dokunmatik ekranı.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-black text-slate-900">
                    ₺14.200
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-800 hover:bg-slate-200 transition"
                  >
                    <span>Sepete Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Matbaa & Özelleştirilmiş Baskı */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Matbaa & Özelleştirilmiş Baskı
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Özel logolu baskı ürünleriniz doğrudan kapınıza teslim
              </p>
            </div>

            {/* 3 Sütunlu Baskı Kartları */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50/50 p-3 text-center border border-indigo-100/60">
                <FileTextIcon size={22} weight="duotone" className="text-indigo-600" />
                <span className="mt-1 text-[11px] font-bold text-slate-900">Lamine Menü</span>
                <span className="text-[10px] text-slate-500">₺18 / adet</span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50/50 p-3 text-center border border-indigo-100/60">
                <div className="text-indigo-600 font-black text-base">QR</div>
                <span className="mt-1 text-[11px] font-bold text-slate-900">Masa Stickerı</span>
                <span className="text-[10px] text-slate-500">100 Adet · ₺340</span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50/50 p-3 text-center border border-indigo-100/60">
                <BagIcon size={22} weight="duotone" className="text-indigo-600" />
                <span className="mt-1 text-[11px] font-bold text-slate-900">Paket Broşürü</span>
                <span className="text-[10px] text-slate-500">1000 Adet · ₺790</span>
              </div>
            </div>

            {/* Dosya Yükle / Tasarla Aksiyonu */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span className="text-emerald-500">✦</span>
                <span>Ücretsiz grafik kontrolü</span>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-black text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition active:scale-95"
              >
                <span>Dosya Yükle / Tasarla</span>
              </button>
            </div>
          </section>

          {/* 5. Taahhütsüz & Esnek Altyapı Rozeti */}
          <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircleIcon size={20} weight="fill" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  Taahhütsüz & Esnek Altyapı
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-500 font-medium leading-relaxed">
                  14 Gün Koşulsuz İade · İstediğin Zaman İptal Et · Anında Aktivasyon
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Sabit Alt Navigasyon (Mağaza aktif) */}
        <BottomNavigation activeTab="store" />
      </div>
    </div>
  );
}
