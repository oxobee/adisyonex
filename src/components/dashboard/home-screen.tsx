import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArmchairIcon,
  BoxesIcon,
  CalculatorIcon,
  ChefHatIcon,
  CircleHelpIcon,
  GiftIcon,
  LayoutDashboardIcon,
  LogInIcon,
  PaletteIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
  BookOpenIcon,
} from "lucide-react";

import type { SystemSettingsDTO } from "@/services/system-setting.service";

const HOME_ITEMS = [
  { title: "Anlık Durum", description: "Masalar ve açık hesaplar", href: "/dashboard/orders", icon: ReceiptTextIcon, tone: "sun" },
  { title: "Mutfak Ekranı", description: "KOT ve hazırlık takibi", href: "/dashboard/kitchen", icon: ChefHatIcon, tone: "mint" },
  { title: "POS / Kasa", description: "Hızlı sipariş oluştur", href: "/dashboard/pos", icon: CalculatorIcon, tone: "sky" },
  { title: "Genel Bakış", description: "Satış ve günlük raporlar", href: "/dashboard", icon: LayoutDashboardIcon, tone: "violet" },
  { title: "Menü", description: "Ürün ve kategori yönetimi", href: "/dashboard/menu", icon: BookOpenIcon, tone: "teal" },
  { title: "Menü Tasarım", description: "QR menünü özelleştir", href: "/dashboard/menu-design", icon: PaletteIcon, tone: "indigo" },
  { title: "Masalar", description: "Salon ve masa düzeni", href: "/dashboard/tables", icon: ArmchairIcon, tone: "rose" },
  { title: "Personel", description: "Ekip ve yetkilendirme", href: "/dashboard/staff", icon: UsersIcon, tone: "orange" },
  { title: "Stok & Envanter", description: "Stok hareketlerini yönet", href: "/dashboard/inventory", icon: BoxesIcon, tone: "slate" },
  { title: "Müşteriler", description: "Sadakat ve kampanyalar", href: "/dashboard/customers", icon: GiftIcon, tone: "pink" },
  { title: "Ayarlar", description: "Restoran ve sistem ayarları", href: "/dashboard/settings", icon: Settings2Icon, tone: "zinc" },
];

const toneClasses: Record<string, string> = {
  sun: "bg-amber-100 text-amber-800 group-hover:bg-amber-200",
  mint: "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200",
  sky: "bg-sky-100 text-sky-800 group-hover:bg-sky-200",
  violet: "bg-violet-100 text-violet-800 group-hover:bg-violet-200",
  teal: "bg-teal-100 text-teal-800 group-hover:bg-teal-200",
  indigo: "bg-indigo-100 text-indigo-800 group-hover:bg-indigo-200",
  rose: "bg-rose-100 text-rose-800 group-hover:bg-rose-200",
  orange: "bg-orange-100 text-orange-800 group-hover:bg-orange-200",
  slate: "bg-slate-100 text-slate-800 group-hover:bg-slate-200",
  pink: "bg-pink-100 text-pink-800 group-hover:bg-pink-200",
  zinc: "bg-zinc-100 text-zinc-800 group-hover:bg-zinc-200",
};

export function HomeScreen({
  settings,
  isAdmin,
  restaurantUsername,
}: {
  readonly settings: SystemSettingsDTO;
  readonly isAdmin: boolean;
  readonly restaurantUsername: string | null;
}) {
  return (
    <main className="home-screen min-h-[calc(100vh-4.4rem)] bg-[#d10000] px-4 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-7xl">
        <header className="home-screen-enter mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_16px_35px_rgba(71,0,0,0.28)] sm:h-24 sm:w-24">
            {settings.logoUrl ? (
              <Image src={settings.logoUrl} alt={settings.systemName} width={160} height={80} className="max-h-full w-full object-contain" unoptimized />
            ) : settings.faviconUrl ? (
              <Image src={settings.faviconUrl} alt={settings.systemName} width={72} height={72} className="max-h-full w-full object-contain" unoptimized />
            ) : (
              <ReceiptTextIcon className="size-12 text-[#d10000]" strokeWidth={1.8} />
            )}
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-100">Hoş geldiniz</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{settings.systemName}</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-red-100 sm:text-base">
            {settings.systemTagline || "Restoranınızı tek ekrandan yönetin."}
          </p>
        </header>

        <section aria-label="Ana menü" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {HOME_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="home-menu-card group flex min-h-36 flex-col justify-between rounded-[18px] bg-white p-4 text-zinc-950 shadow-[0_10px_24px_rgba(84,0,0,0.18)] outline-none transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_32px_rgba(84,0,0,0.25)] focus-visible:ring-4 focus-visible:ring-white/70 active:scale-[0.97] sm:min-h-40 sm:p-5"
                style={{ "--home-delay": `${index * 45}ms` } as CSSProperties}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex size-11 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-110 ${toneClasses[item.tone]}`}>
                    <Icon className="size-6" strokeWidth={2.1} />
                  </span>
                  <span className="text-lg font-bold text-zinc-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#d10000]">↗</span>
                </div>
                <span>
                  <span className="block text-sm font-black sm:text-base">{item.title}</span>
                  <span className="mt-1 block text-[11px] font-medium leading-snug text-zinc-500 sm:text-xs">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </section>

        <div className="home-screen-enter mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {restaurantUsername && (
            <Link href={`/${restaurantUsername}/personals`} target="_blank" className="group flex items-center gap-3 rounded-[18px] border border-white/20 bg-black/10 p-4 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/20">
              <LogInIcon className="size-5 transition-transform group-hover:scale-110" />
              <span>Personel Girişi</span>
              <span className="ml-auto text-red-100">↗</span>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="group flex items-center gap-3 rounded-[18px] border border-white/20 bg-black/10 p-4 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/20">
              <ShieldCheckIcon className="size-5 transition-transform group-hover:scale-110" />
              <span>Süper Yönetici Paneli</span>
              <span className="ml-auto text-red-100">↗</span>
            </Link>
          )}
          <Link href="#" className="group flex items-center gap-3 rounded-[18px] border border-white/20 bg-black/10 p-4 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/20">
            <CircleHelpIcon className="size-5 transition-transform group-hover:scale-110" />
            <span>Yardım Al</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
