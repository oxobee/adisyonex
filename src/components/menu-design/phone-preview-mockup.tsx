"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  BatteryChargingIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  SparklesIcon,
  StarIcon,
  UtensilsCrossedIcon,
  WifiIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuDTO } from "@/types/menu";

export interface PhonePreviewProps {
  readonly theme: string;
  readonly restaurantName: string;
  readonly logoUrl?: string | null;
  readonly menu?: MenuDTO | null;
  readonly tableLabel?: string;
}

export function PhonePreviewMockup({
  theme,
  restaurantName,
  logoUrl,
  menu,
  tableLabel = "Masa 1",
}: PhonePreviewProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = menu?.categories && menu.categories.length > 0
    ? menu.categories
    : [
        { id: "c1", name: "Destaques (Öne Çıkanlar)" },
        { id: "c2", name: "Sorvetes (Dondurmalar)" },
        { id: "c3", name: "Sanduíches (Burgerler)" },
        { id: "c4", name: "Combos & Menüler" },
      ];

  const items = menu?.items && menu.items.length > 0
    ? menu.items
    : [
        {
          id: "demo-1",
          name: "Sorvete McFlurry",
          categoryId: "c2",
          price: 120,
          shortDescription: "Kakaolu çıtır parçacıklar ve krema",
          images: [],
        },
        {
          id: "demo-2",
          name: "Big Mac Burger",
          categoryId: "c3",
          price: 280,
          shortDescription: "Çift dana köfte, cheddar ve özel sos",
          images: [],
        },
        {
          id: "demo-3",
          name: "Combo Menü 1",
          categoryId: "c4",
          price: 380,
          shortDescription: "Burger + Çıtır Patates + Soğuk İçecek",
          images: [],
        },
        {
          id: "demo-4",
          name: "Çıtır Tavuk Sandviç",
          categoryId: "c3",
          price: 240,
          shortDescription: "Marul, mayonez ve susamlı ekmek",
          images: [],
        },
      ];

  const filteredItems = items.filter((it) => {
    if (activeCategory !== "ALL" && it.categoryId !== activeCategory) return false;
    if (searchQuery.trim() && !it.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="relative mx-auto w-[320px] sm:w-[340px] h-[650px] rounded-[48px] bg-zinc-950 p-3 shadow-2xl border-4 border-zinc-800 ring-1 ring-zinc-700/50 select-none flex flex-col justify-between">
      {/* Smartphone Dynamic Island / Speaker Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-900 rounded-full z-40 flex items-center justify-between px-3 border border-zinc-800/80 shadow-inner">
        <div className="size-2 rounded-full bg-zinc-800" />
        <div className="size-2.5 rounded-full bg-zinc-950 border border-zinc-800" />
      </div>

      {/* Screen Inner Viewport */}
      <div className={cn(
        "relative size-full rounded-[38px] overflow-hidden flex flex-col justify-between text-foreground transition-colors",
        theme === "QSR_FASTFOOD" ? "bg-[#f8f8f9]" : theme === "ELEGANT_DARK" ? "bg-zinc-950 text-zinc-100" : "bg-background",
      )}>
        
        {/* Status Bar */}
        <div className={cn(
          "shrink-0 h-9 pt-1.5 px-6 flex items-center justify-between text-[11px] font-bold z-30",
          theme === "ELEGANT_DARK" ? "text-zinc-400" : "text-zinc-800",
        )}>
          <span>14:30</span>
          <div className="flex items-center gap-1.5">
            <WifiIcon className="size-3" />
            <BatteryChargingIcon className="size-3.5" />
          </div>
        </div>

        {/* Scrollable Theme Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-20 space-y-3 scrollbar-none">
          
          {/* ============================================================ */}
          {/* THEME 2: QSR_FASTFOOD (McDonald's / Fast-Food Self Order Stili) */}
          {/* ============================================================ */}
          {theme === "QSR_FASTFOOD" && (
            <div className="space-y-3 pt-0.5 animate-in fade-in-50 duration-300">
              
              {/* Top Clean White Header with Brand Logo and Search Input */}
              <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-zinc-100 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-8 rounded-xl overflow-hidden bg-amber-500/10 flex items-center justify-center font-black text-xs text-amber-600 shrink-0 border border-amber-500/20">
                    {logoUrl ? (
                      <Image src={logoUrl} alt={restaurantName} width={32} height={32} className="size-full object-contain" unoptimized />
                    ) : (
                      <span>🍔</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-zinc-900 truncate tracking-tight">{restaurantName}</h3>
                    <span className="text-[9px] font-bold text-zinc-400 block -mt-0.5">Masa: {tableLabel}</span>
                  </div>
                </div>

                <div className="relative w-28">
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-100 border-none rounded-lg pl-6 pr-2 py-1 text-[10px] text-zinc-800 placeholder:text-zinc-400 outline-none"
                  />
                </div>
              </div>

              {/* Red Category Capsule Tabs (Exact McDonald's Style) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("ALL")}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all shadow-xs",
                    activeCategory === "ALL"
                      ? "bg-red-600 text-white shadow-red-500/20"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50",
                  )}
                >
                  Tümü
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all shadow-xs",
                      activeCategory === c.id
                        ? "bg-red-600 text-white shadow-red-500/20"
                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* 2-Column Clean Food Grid (Centered cards with price pills) */}
              <div className="grid grid-cols-2 gap-2.5">
                {filteredItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-2.5 shadow-xs border border-zinc-150/80 hover:border-red-500/30 flex flex-col items-center justify-between text-center gap-1.5 transition-all group"
                  >
                    {/* Food Photo Container */}
                    <div className="relative size-20 rounded-xl overflow-hidden bg-zinc-50 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                      {idx % 4 === 0 ? "🍦" : idx % 4 === 1 ? "🍔" : idx % 4 === 2 ? "🍟" : "🥤"}
                    </div>

                    {/* Food Title */}
                    <h4 className="text-[11px] font-black text-zinc-900 line-clamp-2 leading-tight">
                      {item.name}
                    </h4>

                    {/* Price Capsule (R$ / ₺ Style) */}
                    <div className="bg-zinc-100 group-hover:bg-amber-100 text-zinc-900 group-hover:text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full tabular-nums transition-colors">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* THEME 1: MODERN (AdisyonEx Standart) */}
          {/* ============================================================ */}
          {theme === "MODERN" && (
            <div className="space-y-3 pt-1 animate-in fade-in-50 duration-300">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-card border border-primary/20 shadow-xs flex items-center gap-3">
                <div className="size-11 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-black shadow-xs shrink-0 border border-primary/30">
                  {logoUrl ? (
                    <Image src={logoUrl} alt={restaurantName} width={44} height={44} className="size-full object-cover" unoptimized />
                  ) : (
                    <UtensilsCrossedIcon className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-black text-foreground truncate">{restaurantName}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold mt-0.5">
                    <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Canlı QR Menü · {tableLabel}</span>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveCategory("ALL")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all",
                    activeCategory === "ALL"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  Tümü
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all",
                      activeCategory === c.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Product Cards */}
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-card border border-border/70 hover:border-primary/40 shadow-2xs flex items-center justify-between gap-2.5 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-extrabold text-foreground truncate">{item.name}</h4>
                      {item.shortDescription && (
                        <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">{item.shortDescription}</p>
                      )}
                      <span className="text-[11px] font-black text-primary tabular-nums mt-1 block">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0 active:scale-90 transition-transform"
                    >
                      <PlusIcon className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* THEME 3: ELEGANT DARK (Lüks Koyu / Fine Dining Slate) */}
          {/* ============================================================ */}
          {theme === "ELEGANT_DARK" && (
            <div className="space-y-3 pt-1 animate-in fade-in-50 duration-300 bg-zinc-950 -mx-3 -mt-3 p-3 min-h-full text-zinc-100">
              <div className="text-center py-3 border-b border-amber-500/20">
                <div className="size-10 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-black mb-1.5 shadow-sm">
                  {logoUrl ? (
                    <Image src={logoUrl} alt={restaurantName} width={40} height={40} className="size-full rounded-full object-cover" unoptimized />
                  ) : (
                    <SparklesIcon className="size-4" />
                  )}
                </div>
                <h3 className="text-xs font-black font-serif tracking-widest uppercase text-amber-300/90">{restaurantName}</h3>
                <p className="text-[9px] text-zinc-400 tracking-wider font-mono uppercase mt-0.5">Özel Gurme Menü · {tableLabel}</p>
              </div>

              <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1">
                {categories.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider transition-all border",
                      activeCategory === c.id
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-zinc-900/80 border border-amber-500/15 shadow-sm flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <StarIcon className="size-2 text-amber-400 fill-amber-400 shrink-0" />
                        <h4 className="text-[11px] font-bold text-zinc-100 truncate">{item.name}</h4>
                      </div>
                      <p className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5">{item.shortDescription}</p>
                      <span className="text-[11px] font-extrabold text-amber-400 tabular-nums mt-1 block">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="size-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-xs shrink-0"
                    >
                      <PlusIcon className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* THEME 4: MINIMAL_LIST (Kafe & Bistro Hızlı Liste) */}
          {/* ============================================================ */}
          {theme === "MINIMAL_LIST" && (
            <div className="space-y-2.5 pt-1 animate-in fade-in-50 duration-300">
              <div className="border-b pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-foreground">{restaurantName}</h3>
                  <p className="text-[9px] text-muted-foreground">{tableLabel}</p>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                  BISTRO
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {filteredItems.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <h4 className="text-[11px] font-bold text-foreground truncate">{item.name}</h4>
                        <span className="text-[11px] font-mono font-bold text-foreground tabular-nums shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground line-clamp-1">{item.shortDescription}</p>
                    </div>
                    <button
                      type="button"
                      className="size-6 rounded bg-muted hover:bg-foreground hover:text-background text-foreground flex items-center justify-center shrink-0 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* Floating Cart Button */}
        {/* In QSR_FASTFOOD theme: Golden Yellow Floating Cart Bubble    */}
        {/* ============================================================ */}
        {theme === "QSR_FASTFOOD" ? (
          <div className="absolute bottom-4 right-4 z-30">
            <button
              type="button"
              className="relative flex items-center justify-center size-12 rounded-full bg-[#FFBC0D] text-black shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-amber-300/80"
              aria-label="Sepet"
            >
              <ShoppingBagIcon className="size-5 stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-black shadow-md border-2 border-white">
                3
              </span>
            </button>
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 right-2 p-2 rounded-2xl bg-zinc-900 text-white shadow-xl flex items-center justify-between z-30 border border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black">
                2
              </div>
              <span className="text-[11px] font-bold">Sepetiniz (2 Ürün)</span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-[11px] text-primary">
              <span>490,00 ₺</span>
              <ShoppingBagIcon className="size-3.5" />
            </div>
          </div>
        )}

        {/* Bottom Home Indicator Bar */}
        <div className="h-4 pb-1 flex items-center justify-center">
          <div className="w-24 h-1 rounded-full bg-foreground/20" />
        </div>

      </div>
    </div>
  );
}
