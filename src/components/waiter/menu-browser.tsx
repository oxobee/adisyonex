"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  FlameIcon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DietaryType, MenuDTO, MenuItemDTO } from "@/types/menu";

const DIET_BADGES: Record<string, { label: string; icon: string }> = {
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
  qrMenuTheme = "MODERN",
}: {
  menu: MenuDTO;
  onQuickAdd: (item: MenuItemDTO) => void;
  onOpenDetail: (item: MenuItemDTO) => void;
  qrMenuTheme?: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    qrMenuTheme === "QSR_FASTFOOD" || qrMenuTheme === "VISUAL_GRID" ? "grid" : "list",
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Detailed Filter States
  const [selectedDiet, setSelectedDiet] = useState<DietaryType | "ALL">("ALL");
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [priceSort, setPriceSort] = useState<"DEFAULT" | "ASC" | "DESC">("DEFAULT");

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

  // Extract all unique allergens available in the menu
  const availableAllergens = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of menu.items) {
      if (item.allergens) {
        for (const a of item.allergens) {
          const key = a.name.trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, a.icon || "⚠️");
          }
        }
      }
    }
    return Array.from(map.entries()).map(([name, icon]) => ({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      icon,
    }));
  }, [menu.items]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDiet !== "ALL") count++;
    if (excludedAllergens.length > 0) count += excludedAllergens.length;
    if (maxCalories !== null) count++;
    if (priceSort !== "DEFAULT") count++;
    return count;
  }, [selectedDiet, excludedAllergens, maxCalories, priceSort]);

  const resetFilters = () => {
    setSelectedDiet("ALL");
    setExcludedAllergens([]);
    setMaxCalories(null);
    setPriceSort("DEFAULT");
  };

  const toggleExcludedAllergen = (allergenName: string) => {
    const key = allergenName.toLowerCase();
    setExcludedAllergens((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  };

  const hasChefSpecials = useMemo(
    () => menu.items.some((i) => i.isActive && i.isChefSpecial),
    [menu.items],
  );

  const items = useMemo(() => {
    let result = menu.items.filter((item) => {
      if (!item.isActive) return false;
      if (categoryId === "CHEF_SPECIALS") {
        if (!item.isChefSpecial) return false;
      } else if (categoryId && item.categoryId !== categoryId) {
        return false;
      }

      // Search Query
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc =
          item.shortDescription?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesDesc) return false;
      }

      // Dietary filter
      if (selectedDiet !== "ALL") {
        if (item.dietaryType !== selectedDiet) return false;
      }

      // Allergen Exclusions (Hide items containing any excluded allergen)
      if (excludedAllergens.length > 0 && item.allergens) {
        const itemAllergens = item.allergens.map((a) => a.name.toLowerCase());
        const hasExcluded = excludedAllergens.some((excluded) =>
          itemAllergens.includes(excluded),
        );
        if (hasExcluded) return false;
      }

      // Calorie filter
      if (maxCalories !== null) {
        if (item.calories && item.calories > maxCalories) return false;
      }

      return true;
    });

    // Sorting
    if (priceSort === "ASC") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (priceSort === "DESC") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [menu.items, categoryId, query, selectedDiet, excludedAllergens, maxCalories, priceSort]);

  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="flex flex-col gap-3">
      {/* 1. STICKY TOP CONTROLS: Search Bar with Detailed Filter Trigger */}
      <div className="sticky top-0 z-20 -mx-1 bg-background/95 px-1 pt-1 pb-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
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

          {/* Filter Button with Active Badge */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/90 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer",
              activeFilterCount > 0
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                : "text-foreground hover:bg-accent",
            )}
            title="Detaylı Filtreleme"
            aria-label="Detaylı Filtreleme"
          >
            <SlidersHorizontalIcon className="size-4.5" />
            {activeFilterCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-xs">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Active Filter Tags Row (Quick Dismiss) */}
        {activeFilterCount > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 px-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Aktif Filtreler:
            </span>

            {selectedDiet !== "ALL" ? (
              <button
                type="button"
                onClick={() => setSelectedDiet("ALL")}
                className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20"
              >
                <span>{DIET_BADGES[selectedDiet]?.icon}</span>
                <span>{DIET_BADGES[selectedDiet]?.label}</span>
                <XIcon className="size-3 ml-0.5" />
              </button>
            ) : null}

            {excludedAllergens.map((alg) => (
              <button
                key={alg}
                type="button"
                onClick={() => toggleExcludedAllergen(alg)}
                className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20"
              >
                <span>🚫 {alg} içermeyen</span>
                <XIcon className="size-3 ml-0.5" />
              </button>
            ))}

            {maxCalories !== null ? (
              <button
                type="button"
                onClick={() => setMaxCalories(null)}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400"
              >
                <span>🔥 ≤ {maxCalories} kcal</span>
                <XIcon className="size-3 ml-0.5" />
              </button>
            ) : null}

            {priceSort !== "DEFAULT" ? (
              <button
                type="button"
                onClick={() => setPriceSort("DEFAULT")}
                className="inline-flex items-center gap-1 rounded-full bg-muted border px-2.5 py-0.5 text-[11px] font-bold text-foreground"
              >
                <span>{priceSort === "ASC" ? "Fiyat: Artan" : "Fiyat: Azalan"}</span>
                <XIcon className="size-3 ml-0.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground underline ml-auto cursor-pointer"
            >
              Temizle
            </button>
          </div>
        ) : null}

        {/* 2. HORIZONTAL CATEGORY CHIPS */}
        <div className="no-scrollbar mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scroll-smooth">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 select-none active:scale-95 cursor-pointer",
              qrMenuTheme === "QSR_FASTFOOD"
                ? categoryId === null
                  ? "border-red-600 bg-red-600 text-white shadow-sm shadow-red-500/25 scale-[1.02]"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                : categoryId === null
                  ? "border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "border-border/70 bg-card text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
            )}
          >
            <span>⭐</span>
            <span>Tümü</span>
            <span className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px]",
              qrMenuTheme === "QSR_FASTFOOD"
                ? categoryId === null ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                : categoryId === null ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {menu.items.filter((i) => i.isActive).length}
            </span>
          </button>

          {hasChefSpecials && (
            <button
              type="button"
              onClick={() => setCategoryId(categoryId === "CHEF_SPECIALS" ? null : "CHEF_SPECIALS")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-black transition-all duration-200 select-none active:scale-95 cursor-pointer shadow-xs",
                categoryId === "CHEF_SPECIALS"
                  ? "border-amber-500 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-[1.03]"
                  : "border-amber-400/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 text-amber-900 dark:text-amber-200 hover:border-amber-500",
              )}
            >
              <span className="animate-pulse">👨‍🍳</span>
              <span>Şefin Seçtikleri</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-black text-amber-800 dark:text-amber-200">
                {menu.items.filter((i) => i.isActive && i.isChefSpecial).length}
              </span>
            </button>
          )}

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
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 select-none active:scale-95 cursor-pointer",
                  qrMenuTheme === "QSR_FASTFOOD"
                    ? isSelected
                      ? "border-red-600 bg-red-600 text-white shadow-sm shadow-red-500/25 scale-[1.02]"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    : isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                      : "border-border/70 bg-card text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
                )}
              >
                <span>{emoji}</span>
                <span>{c.name}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    qrMenuTheme === "QSR_FASTFOOD"
                      ? isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                      : isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
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
              "p-1.5 rounded-lg transition-colors cursor-pointer",
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
              "p-1.5 rounded-lg transition-colors cursor-pointer",
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
          <p className="font-semibold text-foreground">Filtrelere uygun ürün bulunamadı</p>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs">
            Aramayı değiştirmeyi veya seçili filtreleri temizlemeyi deneyebilirsiniz.
          </p>
          {activeFilterCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4 rounded-xl font-bold cursor-pointer"
            >
              <RotateCcwIcon className="size-3.5 mr-1.5" />
              Filtreleri Sıfırla
            </Button>
          ) : null}
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
                style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
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
                          "flex size-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-foreground transition-all duration-150 active:scale-85 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xs cursor-pointer",
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

            if (qrMenuTheme === "QSR_FASTFOOD") {
              return (
                <div
                  key={item.id}
                  style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
                  onClick={() => {
                    if (hasOptions) onOpenDetail(item);
                    else onQuickAdd(item);
                  }}
                  className={cn(
                    "group relative flex flex-col justify-between items-center text-center rounded-3xl border border-zinc-200/80 bg-white p-3.5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-red-500/40 active:scale-[0.97] cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-300 fill-mode-both",
                    !item.available && "opacity-60",
                  )}
                >
                  {/* Food Photo Container */}
                  <div className="relative size-24 sm:size-28 rounded-2xl overflow-hidden bg-zinc-50 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                    {photo ? (
                      <Image
                        src={photo.url}
                        alt={item.name}
                        fill
                        className="object-contain object-center"
                        sizes="(max-width: 640px) 50vw, 200px"
                        unoptimized
                      />
                    ) : (
                      <span className="text-4xl">🍔</span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div className="mt-2 flex flex-col items-center gap-1 w-full">
                    <h3 className="font-black text-zinc-900 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                      {item.name}
                    </h3>
                    {item.shortDescription ? (
                      <p className="text-zinc-500 text-[10px] line-clamp-1">
                        {item.shortDescription}
                      </p>
                    ) : null}
                  </div>

                  {/* Price Capsule (R$ / ₺ Style) */}
                  <div className="mt-2.5 w-full flex items-center justify-center">
                    <div className="bg-zinc-100 group-hover:bg-amber-100 text-zinc-900 group-hover:text-amber-950 font-black text-xs px-3.5 py-1 rounded-full tabular-nums transition-colors shadow-2xs">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
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
                    className="flex size-7 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-foreground transition-all duration-150 active:scale-85 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-xs cursor-pointer"
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

      {/* 5. DETAILED FILTER BOTTOM SHEET DRAWER */}
      <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-5 py-6">
          <div className="mx-auto max-w-md flex flex-col gap-6">
            <SheetHeader className="text-left border-b pb-3">
              <SheetTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <SlidersHorizontalIcon className="size-5 text-primary" />
                Detaylı Menü Filtreleme
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Diyet türünüze veya alerjenlerinize göre menüyü kişiselleştirin.
              </SheetDescription>
            </SheetHeader>

            {/* SECTION 1: BESLENME TERCİHİ */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-foreground">
                🥗 Beslenme Tercihleri
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDiet("ALL")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                    selectedDiet === "ALL"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border/70 hover:bg-muted text-muted-foreground",
                  )}
                >
                  <span>Tümü</span>
                  {selectedDiet === "ALL" ? <CheckIcon className="size-3.5" /> : null}
                </button>

                {Object.entries(DIET_BADGES).map(([key, diet]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDiet(key as DietaryType)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                      selectedDiet === key
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{diet.icon}</span>
                      <span>{diet.label}</span>
                    </span>
                    {selectedDiet === key ? <CheckIcon className="size-3.5" /> : null}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 2: ALERJEN DIŞLAMA (Alerjen İçermeyenleri Göster) */}
            {availableAllergens.length > 0 ? (
              <div className="flex flex-col gap-2.5 border-t pt-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">
                    🚫 Alerjen Filtresi (İçermeyenleri Göster)
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    İşaretlediğiniz alerjenleri içeren ürünler menüden gizlenecektir:
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableAllergens.map((alg) => {
                    const isExcluded = excludedAllergens.includes(alg.name);
                    return (
                      <button
                        key={alg.name}
                        type="button"
                        onClick={() => toggleExcludedAllergen(alg.name)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                          isExcluded
                            ? "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300 shadow-xs ring-1 ring-red-500/30"
                            : "border-border/70 bg-card text-muted-foreground hover:bg-accent",
                        )}
                      >
                        <span>{alg.icon}</span>
                        <span>{alg.displayName}siz</span>
                        {isExcluded ? <CheckIcon className="size-3 stroke-[3]" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* SECTION 3: KALORİ SINIRI */}
            <div className="flex flex-col gap-2.5 border-t pt-4">
              <span className="text-xs font-bold text-foreground">
                🔥 Kalori Tercihi (Maksimum)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Tümü", value: null },
                  { label: "≤ 400 kcal", value: 400 },
                  { label: "≤ 700 kcal", value: 700 },
                ].map((c) => (
                  <button
                    key={String(c.value)}
                    type="button"
                    onClick={() => setMaxCalories(c.value)}
                    className={cn(
                      "rounded-xl border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer",
                      maxCalories === c.value
                        ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 4: FİYAT SIRALAMASI */}
            <div className="flex flex-col gap-2.5 border-t pt-4">
              <span className="text-xs font-bold text-foreground">
                💳 Fiyata Göre Sırala
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Varsayılan", value: "DEFAULT" },
                  { label: "En Ucuz", value: "ASC" },
                  { label: "En Pahalı", value: "DESC" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setPriceSort(s.value as any)}
                    className={cn(
                      "rounded-xl border p-2.5 text-center text-xs font-semibold transition-all cursor-pointer",
                      priceSort === s.value
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="flex-1 rounded-xl font-bold cursor-pointer"
              >
                <RotateCcwIcon className="size-3.5 mr-1.5" />
                Sıfırla
              </Button>

              <Button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-2 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-primary text-white shadow-md shadow-primary/20 cursor-pointer"
              >
                {items.length} Ürünü Göster
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
