"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FlameIcon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";

const DIET_BADGES = {
  VEG: { label: "Vejetaryen", icon: "🌱" },
  NON_VEG: { label: "Et / Tavuk", icon: "🥩" },
  EGG: { label: "Yumurtalı", icon: "🥚" },
};

const CATEGORY_EMOJIS: Record<string, string> = {
  burger: "🍔",
  hamburger: "🍔",
  pizza: "🍕",
  pizzalar: "🍕",
  makarna: "🍝",
  salata: "🥗",
  tatli: "🍰",
  tatlı: "🍰",
  tatlılar: "🍰",
  icecek: "🥤",
  içecek: "🥤",
  içecekler: "🥤",
  kahve: "☕",
  kahveler: "☕",
  corba: "🥣",
  çorba: "🥣",
  çorbalar: "🥣",
  atistirmalik: "🍟",
  atıştırmalık: "🍟",
  kahvalti: "🍳",
  kahvaltı: "🍳",
  kebap: "🍢",
  kebaplar: "🍢",
  doner: "🥙",
  döner: "🥙",
  durum: "🌯",
  dürüm: "🌯",
  pide: "🥖",
  lahmacun: "🫓",
  tavuk: "🍗",
  et: "🥩",
  balik: "🐟",
  balık: "🐟",
};

const getCategoryEmoji = (name: string): string => {
  const normalized = name.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, "");
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (normalized.includes(key)) return emoji;
  }
  return "🍽️";
};

export function MenuBrowser({
  menu,
  onQuickAdd,
  onOpenDetail,
}: {
  menu: MenuDTO;
  onQuickAdd: (item: MenuItemDTO) => void;
  onOpenDetail: (item: MenuItemDTO) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const categories = useMemo(
    () => menu.categories.filter((c) => c.isActive),
    [menu.categories],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of menu.items) {
      if (item.isActive) {
        counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
      }
    }
    return counts;
  }, [menu.items]);

  const items = useMemo(() => {
    return menu.items.filter((item) => {
      if (!item.isActive) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc =
          item.shortDescription?.toLowerCase().includes(q) ?? false;
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [menu.items, categoryId, query]);

  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="flex flex-col gap-3">
      {/* 1. STICKY TOP CONTROLS: Clean Full-Width Search & Categories */}
      <div className="sticky top-0 z-20 -mx-1 bg-background/95 px-1 pt-1 pb-2 backdrop-blur-md">
        <div className="relative w-full">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün Ara…"
            className="h-12 w-full rounded-full border-border/80 bg-card/90 pl-10 pr-10 text-sm shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
            inputMode="search"
          />
          {query.trim() ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold"
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* 2. HORIZONTAL CATEGORY CHIPS */}
        <div className="no-scrollbar mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scroll-smooth">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 select-none active:scale-95",
              categoryId === null
                ? "border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                : "border-border/70 bg-card text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
            )}
          >
            <span>⭐</span>
            <span>Tümü</span>
            <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", categoryId === null ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {menu.items.filter((i) => i.isActive).length}
            </span>
          </button>

          {categories.map((c) => {
            const count = categoryCounts[c.id] ?? 0;
            const isSelected = categoryId === c.id;
            const emoji = getCategoryEmoji(c.name);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 select-none active:scale-95",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "border-border/70 bg-card text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
                )}
              >
                <span>{emoji}</span>
                <span>{c.name}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION HEADER: Category Title + View Switcher Icons */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          {query.trim()
            ? `"${query}" Arama Sonuçları`
            : activeCategory
              ? activeCategory.name
              : "Menü"}
        </h2>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="Liste Görünümü"
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              viewMode === "list" ? "text-foreground bg-muted font-bold" : "hover:text-foreground",
            )}
          >
            <ListIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Izgara Görünümü"
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              viewMode === "grid" ? "text-foreground bg-muted font-bold" : "hover:text-foreground",
            )}
          >
            <LayoutGridIcon className="size-5" />
          </button>
        </div>
      </div>

      {/* 4. PRODUCTS LIST / GRID WITH SCROLL REVEAL ANIMATION */}
      {items.length === 0 ? (
        <div className="bg-card flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
          <div className="bg-muted text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-full">
            <SearchIcon className="size-6" />
          </div>
          <p className="font-semibold text-foreground">Ürün bulunamadı</p>
          <p className="text-muted-foreground text-xs mt-1">
            Farklı bir arama yapmayı veya kategori değiştirmeyi deneyebilirsiniz.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* --- LIST VIEW --- */
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const photo =
              item.images.find((i) => i.isPrimary) ?? item.images[0] ?? null;
            const hasOptions =
              item.variants.length > 0 || item.modifierGroups.length > 0;
            const diet = item.dietaryType ? DIET_BADGES[item.dietaryType] : null;

            return (
              <div
                key={item.id}
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                className={cn(
                  "group relative flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3 shadow-xs transition-all duration-200 hover:shadow-md hover:border-border active:scale-[0.99] animate-in fade-in slide-in-from-bottom-4 duration-300 fill-mode-both",
                  !item.available && "opacity-60",
                )}
              >
                {/* Left Photo */}
                <div
                  onClick={() => onOpenDetail(item)}
                  className="bg-muted/20 relative size-26 sm:size-28 shrink-0 aspect-square cursor-pointer overflow-hidden rounded-xl border border-border/40 p-1"
                >
                  {photo ? (
                    <Image
                      src={photo.url}
                      alt={item.name}
                      fill
                      className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                      sizes="120px"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-lg">
                      <ImageIcon className="size-8 opacity-40" />
                    </div>
                  )}
                </div>

                {/* Right Content */}
                <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
                  <div
                    onClick={() => onOpenDetail(item)}
                    className="cursor-pointer"
                  >
                    <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    {item.shortDescription ? (
                      <p className="text-muted-foreground text-xs line-clamp-2 mt-1 leading-relaxed">
                        {item.shortDescription}
                      </p>
                    ) : null}

                    {/* Allergens & Diet */}
                    {item.allergens && item.allergens.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {item.allergens.slice(0, 3).map((a) => (
                          <span
                            key={a.name}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            <span>{a.icon}</span>
                            <span>{a.name}</span>
                          </span>
                        ))}
                        {item.allergens.length > 3 ? (
                          <span className="text-[10px] text-muted-foreground">
                            +{item.allergens.length - 3}
                          </span>
                        ) : null}
                      </div>
                    ) : diet ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-xs">{diet.icon}</span>
                        <span className="text-[11px] text-muted-foreground">{diet.label}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Price & Action Row */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black text-foreground tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Calories badge */}
                      {item.calories ? (
                        <span className="text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                          <FlameIcon className="size-3 text-amber-500" />
                          {item.calories} kcal
                        </span>
                      ) : null}

                      {/* Quick Add / Option Trigger */}
                      <button
                        type="button"
                        disabled={!item.available}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasOptions) {
                            onOpenDetail(item);
                          } else {
                            onQuickAdd(item);
                          }
                        }}
                        aria-label={`${item.name} sepete ekle`}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-foreground transition-all duration-150 active:scale-85 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xs",
                          !item.available && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <PlusIcon className="size-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- GRID VIEW (2 Columns) --- */
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, index) => {
            const photo =
              item.images.find((i) => i.isPrimary) ?? item.images[0] ?? null;
            const hasOptions =
              item.variants.length > 0 || item.modifierGroups.length > 0;

            return (
              <div
                key={item.id}
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-3 shadow-xs transition-all duration-200 hover:shadow-md hover:border-border active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-300 fill-mode-both",
                  !item.available && "opacity-60",
                )}
              >
                <div onClick={() => onOpenDetail(item)} className="cursor-pointer">
                  {/* Photo */}
                  <div className="bg-muted/20 relative aspect-square w-full overflow-hidden rounded-xl border border-border/40 p-2">
                    {photo ? (
                      <Image
                        src={photo.url}
                        alt={item.name}
                        fill
                        className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 200px"
                      />
                    ) : (
                      <div className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-lg">
                        <ImageIcon className="size-8 opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div className="mt-2.5">
                    <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    {item.shortDescription ? (
                      <p className="text-muted-foreground text-xs line-clamp-2 mt-1 leading-relaxed">
                        {item.shortDescription}
                      </p>
                    ) : null}

                    {item.calories ? (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <FlameIcon className="size-3 text-amber-500" />
                        {item.calories} kcal
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Price & Add */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="font-black text-foreground text-sm tabular-nums">
                    {formatCurrency(item.price)}
                  </span>
                  <button
                    type="button"
                    disabled={!item.available}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasOptions) {
                        onOpenDetail(item);
                      } else {
                        onQuickAdd(item);
                      }
                    }}
                    className="flex size-7 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-foreground transition-all duration-150 active:scale-85 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xs"
                    aria-label={`${item.name} ekle`}
                  >
                    <PlusIcon className="size-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
