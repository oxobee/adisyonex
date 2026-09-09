import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CaretLeftIcon,
  ReceiptIcon,
  UsersIcon,
  CookingPotIcon,
  ChartLineUpIcon,
  QrCodeIcon,
  ClipboardTextIcon,
  SparkleIcon,
  ArmchairIcon,
  BroadcastIcon,
  TerminalIcon,
  SlidersIcon,
  CheckCircleIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { BottomNavigation } from "@/components/boss/bottom-navigation";

export const dynamic = "force-dynamic";

interface AppStorePageProps {
  searchParams: Promise<{
    restaurantId?: string;
  }>;
}

export default async function AppStorePage({ searchParams }: AppStorePageProps) {
  const resolvedSearchParams = await searchParams;

  // Restoranları ve aktif olanı bul
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, branchName: true },
    orderBy: { name: "asc" },
  });

  const currentRestaurant =
    restaurants.find((r) => r.id === resolvedSearchParams.restaurantId) ||
    restaurants[0];

  const restaurantId = currentRestaurant?.id;

  // Sistemdeki tüm modülleri çek
  const allModules = await prisma.systemModule.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Restorana atanmış aktif modülleri çek
  const restaurantModules = restaurantId
    ? await prisma.restaurantModule.findMany({
        where: { restaurantId, isActive: true },
        select: { moduleId: true },
      })
    : [];

  const activeModuleIds = new Set(restaurantModules.map((rm) => rm.moduleId));

  // Aktif modüller ve pasif modüller
  const activeModules = allModules.filter((m) => activeModuleIds.has(m.id));
  const passiveModules = allModules.filter((m) => !activeModuleIds.has(m.id));

  // Fallback: Eğer DB'de henüz modül atanmamışsa standart 4 temel modülü aktif gösterelim
  const fallbackActive = activeModules.length > 0 ? activeModules : allModules.slice(0, 4);
  const fallbackPassive = activeModules.length > 0 ? passiveModules : allModules.slice(4);

  const getModuleIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case "pos":
      case "cashier":
        return <ReceiptIcon size={26} weight="duotone" className="text-white" />;
      case "waiter":
      case "staff":
        return <UsersIcon size={26} weight="duotone" className="text-white" />;
      case "kitchen":
      case "kds":
        return <CookingPotIcon size={26} weight="duotone" className="text-white" />;
      case "reports":
      case "analytics":
        return <ChartLineUpIcon size={26} weight="duotone" className="text-white" />;
      case "menu":
      case "qr":
        return <QrCodeIcon size={26} weight="duotone" className="text-white" />;
      case "inventory":
      case "stock":
        return <ClipboardTextIcon size={26} weight="duotone" className="text-white" />;
      case "tables":
        return <ArmchairIcon size={26} weight="duotone" className="text-white" />;
      default:
        return <SparkleIcon size={26} weight="duotone" className="text-white" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased pb-24">
      {/* Mobil Genişlik Kapsayıcısı (Responsive 360-420px) */}
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
              <h1 className="text-base font-black text-slate-900">Uygulama Mağazası</h1>
              <p className="text-[11px] font-medium text-slate-400">
                {currentRestaurant?.name || "Oxonom App Store"}
              </p>
            </div>
          </div>

          <div className="flex h-8 items-center rounded-full bg-indigo-50 px-2.5 text-[11px] font-bold text-indigo-600 border border-indigo-100">
            {fallbackActive.length} Aktif Modül
          </div>
        </header>

        <main className="flex-1 space-y-6 px-3.5 pt-3.5 pb-6 sm:px-4 sm:pt-4">
          {/* Mavi Slider Banner */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-5 text-white shadow-lg shadow-indigo-600/20">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
                YENİ NESİL RESTORAN EKOSİSTEMİ
              </span>
              <h2 className="mt-2 text-lg font-black leading-tight text-white">
                İşletmenizi Büyüten Akıllı Modüller
              </h2>
              <p className="mt-1 text-xs text-indigo-100">
                Kasa, Mutfak KDS, Garson ve QR Menüyü tek tıkla senkronize edin.
              </p>
            </div>
          </div>

          {/* 1. Kısım: Uygulamalarım (Aktif Modüller) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-900">
                Uygulamalarım
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                {fallbackActive.length} Uygulama Açık
              </span>
            </div>

            {/* Referans Tasarıma Birebir Uygun Kart Yapısı */}
            <div className="space-y-3">
              {fallbackActive.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  {/* Üst Satır: İkon + Başlık + Aktif Rozeti */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Gradient İkon Kutusu */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20">
                        {getModuleIcon(mod.key)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {mod.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {mod.description || "Hızlı satış, adisyon, masa ve mali entegrasyon..."}
                        </p>
                      </div>
                    </div>

                    {/* Aktif Badge */}
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>Aktif</span>
                    </div>
                  </div>

                  {/* Orta Bilgi Satırları */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2 font-semibold">
                      <TerminalIcon size={16} className="text-indigo-600" />
                      <span>2 Terminal · 3 Kasiyer Yetkili</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-[11px]">
                      <CheckCircleIcon size={15} weight="fill" />
                      <span>Tüm terminaller çevrimiçi</span>
                    </div>
                  </div>

                  {/* Alt Butonlar (Referans Tasarım: Ayar/Filtre, Cihaz Ata, Uygulamaya Git) */}
                  <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-100">
                    {/* Küçük Ayar Butonu */}
                    <button
                      type="button"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      title="Ayarlar"
                    >
                      <SlidersIcon size={18} weight="bold" />
                    </button>

                    {/* Cihaz Ata Butonu */}
                    <button
                      type="button"
                      className="flex h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                    >
                      <BroadcastIcon size={16} weight="bold" />
                      <span>Cihaz Ata</span>
                    </button>

                    {/* Uygulamaya Git Butonu (Referanstaki Terminali Aç yerine) */}
                    <button
                      type="button"
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 transition active:scale-95"
                    >
                      <TerminalIcon size={16} weight="bold" />
                      <span>Uygulamaya Git</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Kısım: Bunları da Beğenebilirsiniz (Pasif / Keşfet Modülleri) */}
          {fallbackPassive.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="px-1">
                <h2 className="text-sm font-bold text-slate-900">
                  Bunları da Beğenebilirsiniz
                </h2>
                <p className="text-[11px] text-slate-500">
                  İşletmenizin ihtiyacına göre tek tıkla aktif edebileceğiniz çözümler
                </p>
              </div>

              <div className="space-y-3">
                {fallbackPassive.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                          {getModuleIcon(mod.key)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {mod.description || "Gelişmiş restoran ve operasyon aracı"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
                      >
                        <PlusIcon size={13} weight="bold" />
                        <span>Etkinleştir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Alt Navigasyon (Uygulamalar sekmesi aktif) */}
        <BottomNavigation activeTab="apps" />
      </div>
    </div>
  );
}
