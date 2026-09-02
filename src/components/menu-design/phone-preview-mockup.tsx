"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  BatteryChargingIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UtensilsCrossedIcon,
  WifiIcon,
  StarIcon,
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
  tableLabel = "Masa 4",
}: PhonePreviewProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = menu?.categories || [
    { id: "c1", name: "Popüler Lezzetler" },
    { id: "c2", name: "Ana Yemekler" },
    { id: "c3", name: "Burger & Dürüm" },
    { id: "c4", name: "Tatlılar & İçecekler" },
  ];

  const items = menu?.items && menu.items.length > 0
    ? menu.items
    : [
        {
          id: "demo-1",
          name: "Özel Soslu Dana Burger",
          categoryId: "c1",
          price: 280,
          shortDescription: "Karamelize soğan, cheddar peyniri ve çıtır patates ile",
          images: [],
        },
        {
          id: "demo-2",
          name: "Izgara Tavuk Salata",
          categoryId: "c1",
          price: 210,
          shortDescription: "Taze yeşillikler, parmesan ve ballı hardal sos",
          images: [],
        },
        {
          id: "demo-3",
          name: "Fırınlanmış San Sebastian",
          categoryId: "c4",
          price: 160,
          shortDescription: "Sıcak Belçika çikolatası eşliğinde",
          images: [],
        },
        {
          id: "demo-4",
          name: "Ev Yapımı Limonata",
          categoryId: "c4",
          price: 85,
          shortDescription: "Taze nane ve zencefil aromalı",
          images: [],
        },
      ];

  const filteredItems = items.filter((it) => {
    if (activeCategory !== "ALL" && it.categoryId !== activeCategory) return false;
    if (searchQuery.trim() && !it.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="relative mx-auto w-[320px] sm:w-[340px] h-[640px] rounded-[48px] bg-zinc-950 p-3 shadow-2xl border-4 border-zinc-800 ring-1 ring-zinc-700/50 select-none flex flex-col justify-between">
      {/* Smartphone Dynamic Island / Speaker Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-900 rounded-full z-40 flex items-center justify-between px-3 border border-zinc-800/80 shadow-inner">
        <div className="size-2 rounded-full bg-zinc-800" />
        <div className="size-2.5 rounded-full bg-zinc-950 border border-zinc-800" />
      </div>

      {/* Screen Inner Viewport */}
      <div className="relative size-full rounded-[38px] overflow-hidden bg-background flex flex-col justify-between text-foreground">
        
        {/* Status Bar */}
        <div className="shrink-0 h-9 pt-1.5 px-6 flex items-center justify-between text-[11px] font-bold text-foreground/80 z-30">
          <span>14:30</span>
          <div className="flex items-center gap-1.5">
            <WifiIcon className="size-3" />
            <BatteryChargingIcon className="size-3.5" />
          </div>
        </div>

        {/* Scrollable Theme Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-16 space-y-3 scrollbar-none">
          
          {/* THEME 1: MODERN (Default AdisyonEx Cards) */}
          {theme === "MODERN" && (
            <div className="space-y-3 pt-1 animate-in fade-in-50 duration-300">
              {/* Header Card */}
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

              {/* Search Bar */}
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ürün veya lezzet ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/60 border border-border/80 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
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

          {/* THEME 2: ELEGANT DARK (Lüks & Gece / Fine Dining Slate) */}
          {theme === "ELEGANT_DARK" && (
            <div className="space-y-3 pt-1 animate-in fade-in-50 duration-300 bg-zinc-950 -mx-3 -mt-3 p-3 min-h-full text-zinc-100">
              {/* Luxury Header */}
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

              {/* Dark Gold Category Filter */}
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

              {/* Luxury Items */}
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

          {/* THEME 3: MINIMAL LIST (Kafe & Bistro Hızlı Liste) */}
          {theme === "MINIMAL_LIST" && (
            <div className="space-y-2.5 pt-1 animate-in fade-in-50 duration-300">
              {/* Minimal Clean Header */}
              <div className="border-b pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-foreground">{restaurantName}</h3>
                  <p className="text-[9px] text-muted-foreground">{tableLabel}</p>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                  BISTRO
                </span>
              </div>

              {/* Clean Row List Items */}
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

          {/* THEME 4: VISUAL GRID (Büyük Görsel Izgara / Fast Food & Tatlı) */}
          {theme === "VISUAL_GRID" && (
            <div className="space-y-2.5 pt-1 animate-in fade-in-50 duration-300">
              {/* Vibrant Header */}
              <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black">{restaurantName}</h3>
                  <p className="text-[9px] opacity-90">İştah Açıcı Lezzetler</p>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{tableLabel}</span>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/80 bg-card p-2 flex flex-col justify-between shadow-2xs gap-1.5"
                  >
                    <div className="h-14 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 text-xl font-bold">
                      🍔
                    </div>
                    <div>
                      <h4 className="text-[10px] font-extrabold text-foreground truncate">{item.name}</h4>
                      <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="w-full py-1 rounded-lg bg-orange-600 text-white text-[9px] font-bold text-center active:scale-95"
                    >
                      Ekle +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Floating Bottom Cart Bar */}
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

        {/* Bottom Home Indicator Bar */}
        <div className="h-4 pb-1 flex items-center justify-center">
          <div className="w-24 h-1 rounded-full bg-foreground/20" />
        </div>

      </div>
    </div>
  );
}
