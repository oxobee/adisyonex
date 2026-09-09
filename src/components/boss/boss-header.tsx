"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CrownIcon,
  StorefrontIcon,
  RefreshIcon,
  CaretDownIcon,
  ReceiptIcon,
} from "@/components/ui/icons";
import { useState } from "react";

interface RestaurantItem {
  id: string;
  name: string;
  currency: string;
}

interface BossHeaderProps {
  currentRestaurant: RestaurantItem;
  allRestaurants: RestaurantItem[];
}

export function BossHeader({ currentRestaurant, allRestaurants }: BossHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSelectRestaurant = (id: string) => {
    setDropdownOpen(false);
    router.push(`/boss?restaurantId=${id}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Sol: Logo & Marka */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20">
            <CrownIcon size={22} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                OXONOM <span className="text-amber-400 font-black">BOSS</span>
              </span>
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-400 border border-amber-400/20 uppercase">
                Yönetici Konsolu
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Gerçek Zamanlı Şube & Finansal İzleme
            </p>
          </div>
        </div>

        {/* Orta: Şube Seçici */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 focus:outline-none"
          >
            <StorefrontIcon size={16} className="text-amber-400" weight="duotone" />
            <span className="max-w-[140px] truncate sm:max-w-none">
              {currentRestaurant?.name || "Şube Seçiniz"}
            </span>
            <CaretDownIcon
              size={13}
              className={`text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 z-50 w-56 rounded-xl border border-white/10 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Şubeler ({allRestaurants.length})
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {allRestaurants.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => handleSelectRestaurant(res.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        res.id === currentRestaurant.id
                          ? "bg-amber-400/15 text-amber-300 font-medium"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{res.name}</span>
                      {res.id === currentRestaurant.id && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sağ: Durum & Canlı Aksiyonlar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Canlı İndikatör */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Canlı Veri</span>
          </div>

          {/* Yenile butonu */}
          <button
            onClick={handleRefresh}
            title="Verileri Yenile"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshIcon
              size={16}
              className={`${isRefreshing ? "animate-spin text-amber-400" : ""}`}
            />
          </button>

          {/* POS Paneli Linki */}
          <Link
            href="/pos"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            <ReceiptIcon size={15} weight="duotone" />
            <span>Kasa / POS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
