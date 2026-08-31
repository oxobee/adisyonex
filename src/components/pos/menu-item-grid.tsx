"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PlusIcon, SearchIcon, UtensilsCrossedIcon } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";

function ItemTile({
  item,
  onTap,
}: {
  readonly item: MenuItemDTO;
  readonly onTap: (item: MenuItemDTO) => void;
}) {
  const photo = item.images.find((i) => i.isPrimary) ?? item.images[0] ?? null;
  const hasOptions =
    (item.variants && item.variants.length > 0) ||
    (item.modifierGroups && item.modifierGroups.length > 0);

  return (
    <div
      onClick={() => item.available && onTap(item)}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-3 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 select-none",
        item.available ? "cursor-pointer active:scale-[0.98]" : "cursor-not-allowed opacity-50",
      )}
    >
      {/* Top Product Image */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-center border border-zinc-100 dark:border-zinc-800/60">
        {photo ? (
          <Image
            src={photo.url}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600">
            <UtensilsCrossedIcon className="size-8" />
          </div>
        )}

        {/* Options Badge on Image */}
        {hasOptions && (
          <span className="absolute bottom-1.5 right-1.5 bg-zinc-900/90 dark:bg-zinc-950/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            Seçenekli
          </span>
        )}

        {!item.available && (
          <span className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white text-xs font-bold">
            Tükendi
          </span>
        )}
      </div>

      {/* Product Title */}
      <div className="mt-2.5">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-primary transition-colors">
          {item.name}
        </h4>
      </div>

      {/* Bottom Price & Add Button */}
      <div className="flex items-center justify-between mt-2 pt-1">
        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatCurrency(item.price)}
        </span>
        <button
          type="button"
          disabled={!item.available}
          onClick={(e) => {
            e.stopPropagation();
            if (item.available) onTap(item);
          }}
          className="flex size-7 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors shadow-xs cursor-pointer active:scale-90"
        >
          <PlusIcon className="size-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

export function MenuItemGrid({
  menu,
  onTapItem,
}: {
  readonly menu: MenuDTO;
  readonly onTapItem: (item: MenuItemDTO) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = useMemo(
    () => menu.categories.filter((c) => c.isActive),
    [menu.categories],
  );

  const totalCount = useMemo(
    () => menu.items.filter((i) => i.isActive).length,
    [menu.items],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.items.filter((item) => {
      if (!item.isActive) return false;
      if (selectedCategory !== "ALL" && item.categoryId !== selectedCategory) return false;
      if (q && !item.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [menu.items, selectedCategory, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* 1. Large Search Input */}
      <div className="relative w-full">
        <SearchIcon className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Menüde ürün ara (örn. Burger, Kola, Çorba)..."
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-white dark:bg-zinc-900/90 px-4 pl-11 text-sm font-medium shadow-xs outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-zinc-400 transition-all"
        />
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
            selectedCategory === "ALL"
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
              : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
          )}
        >
          Tümü ({totalCount})
        </button>

        {categories.map((cat) => {
          const count = menu.items.filter(
            (i) => i.isActive && i.categoryId === cat.id,
          ).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                selectedCategory === cat.id
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
              )}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* 3. Product Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <UtensilsCrossedIcon className="size-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold">Aradığınız kriterde ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-4">
            {filteredItems.map((item) => (
              <ItemTile key={item.id} item={item} onTap={onTapItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
