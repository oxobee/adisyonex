"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  ArrowLeftIcon,
  BellIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FlameIcon,
  HeartIcon,
  HomeIcon,
  LayoutGridIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
  UtensilsCrossedIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  QrHomeSection,
  QrSliderItem,
} from "@/services/restaurant-settings.service";
import type { DietaryType, MenuDTO, MenuItemDTO } from "@/types/menu";
import type { GuestOrderSummaryDTO } from "@/types/order";
import { linePrice, type CartLine } from "@/components/pos/types";
import { CustomerLoyaltyPanel } from "@/components/guest-order/customer-loyalty-panel";
import type { CustomerDTO } from "@/services/customer.service";

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

export interface CustomModifierItem {
  readonly groupId: string;
  readonly groupName: string;
  readonly optionId: string;
  readonly optionName: string;
  readonly price: number;
}

export interface Theme2QsrViewProps {
  readonly username?: string;
  readonly restaurantName: string;
  readonly logoUrl?: string | null;
  readonly tableId?: string;
  readonly tableLabel: string;
  readonly menu: MenuDTO;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly slidersEnabled?: boolean;
  readonly sliders?: readonly QrSliderItem[] | null;
  readonly greetingTitle?: string | null;
  readonly greetingSubtitle?: string | null;
  readonly homeSections?: readonly QrHomeSection[] | null;
  readonly cartItems: readonly CartLine[];
  readonly cartItemCount: number;
  readonly cartGrandTotal: number;
  readonly onQuickAdd: (item: MenuItemDTO) => void;
  readonly onAddCustomLine: (line: {
    item: MenuItemDTO;
    quantity: number;
    variantId?: string | null;
    modifierItems?: readonly CustomModifierItem[];
    notes?: string;
  }) => void;
  readonly onUpdateQuantity: (key: string, qty: number) => void;
  readonly onRemoveLine: (key: string) => void;
  readonly onClearCart: () => void;
  readonly onPlaceOrder: () => Promise<boolean | void>;
  readonly onRequestBill: () => Promise<void>;
  readonly onCallWaiter?: () => Promise<void>;
  readonly myOrders: readonly GuestOrderSummaryDTO[];
  readonly busy?: boolean;
  readonly onCustomerIdentified?: (customer: CustomerDTO) => void;
  readonly wifiSsid?: string | null;
  readonly wifiPassword?: string | null;
}

export function Theme2QsrView({
  username = "",
  restaurantName,
  logoUrl,
  tableId,
  tableLabel,
  menu,
  primaryColor = "#FF5500",
  secondaryColor = "#FFF7ED",
  wifiSsid,
  wifiPassword,
  slidersEnabled = true,
  sliders,
  greetingTitle = "Bugün Ne Yemek İstersiniz?",
  greetingSubtitle = "Hoş Geldiniz 👋",
  homeSections,
  cartItems,
  cartItemCount,
  cartGrandTotal,
  onQuickAdd,
  onAddCustomLine,
  onUpdateQuantity,
  onRemoveLine,
  onClearCart,
  onPlaceOrder,
  onRequestBill,
  onCallWaiter,
  myOrders,
  busy,
  onCustomerIdentified,
}: Theme2QsrViewProps) {
  // Navigation Tabs: 'home' | 'categories' | 'cart' | 'profile'
  const [activeTab, setActiveTab] = useState<"home" | "categories" | "cart" | "profile">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Filter States (Diet, Allergens, Calories, Price Sort)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState<DietaryType | "ALL">("ALL");
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [priceSort, setPriceSort] = useState<"DEFAULT" | "ASC" | "DESC">("DEFAULT");

  // Extract unique allergens from menu items
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

  // Group cart items by category for receipt view
  const categorizedCart = useMemo(() => {
    const catNameMap = new Map<string, string>();
    for (const cat of menu.categories) {
      catNameMap.set(cat.id, cat.name);
    }
    const itemToCategoryMap = new Map<string, string>();
    for (const item of menu.items) {
      itemToCategoryMap.set(item.id, catNameMap.get(item.categoryId) || "Diğer Lezzetler");
    }

    const groups: { categoryName: string; lines: CartLine[] }[] = [];
    const groupMap = new Map<string, CartLine[]>();

    for (const line of cartItems) {
      const catName = itemToCategoryMap.get(line.menuItemId) || "Diğer Lezzetler";
      if (!groupMap.has(catName)) {
        groupMap.set(catName, []);
        groups.push({ categoryName: catName, lines: groupMap.get(catName)! });
      }
      groupMap.get(catName)!.push(line);
    }

    return groups;
  }, [cartItems, menu.categories, menu.items]);

  // Active filter count
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

  // Reusable multi-criteria filter & sorter
  const applyFilters = (rawItems: readonly MenuItemDTO[]): MenuItemDTO[] => {
    let result = rawItems.filter((item) => {
      if (!item.isActive) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.shortDescription?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesDesc) return false;
      }

      // Dietary filter
      if (selectedDiet !== "ALL") {
        if (item.dietaryType !== selectedDiet) return false;
      }

      // Allergen Exclusions
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
  };

  // Modals & Details State
  const [detailItem, setDetailItem] = useState<MenuItemDTO | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState("");
  
  // Persistent Favorites State (LocalStorage + sync)
  const favStorageKey = `adisyoon_fav_items_${username || "guest"}`;
  const [favoriteItemsMap, setFavoriteItemsMap] = useState<Record<string, {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
    savedAt: number;
  }>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(`adisyoon_fav_items_${username || "guest"}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [favoritesDrawerOpen, setFavoritesDrawerOpen] = useState(false);
  const [confirmRemoveFavId, setConfirmRemoveFavId] = useState<string | null>(null);

  const favorites = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const id of Object.keys(favoriteItemsMap)) {
      map[id] = true;
    }
    return map;
  }, [favoriteItemsMap]);

  const evaluatedFavorites = useMemo(() => {
    const list = Object.values(favoriteItemsMap);
    return list.map((fav) => {
      const menuItem = menu.items.find((i) => i.id === fav.id);
      const isAvailable = Boolean(menuItem && menuItem.isActive && menuItem.available !== false);
      return {
        ...fav,
        menuItem: menuItem || null,
        isAvailable,
      };
    });
  }, [favoriteItemsMap, menu.items]);

  const removeFavoriteById = (id: string, name?: string) => {
    setFavoriteItemsMap((prev) => {
      const next = { ...prev };
      delete next[id];
      try {
        localStorage.setItem(favStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
    setConfirmRemoveFavId(null);
    toast.success(`${name || "Ürün"} favorilerden kaldırıldı.`);
  };

  const [orderSummarySheetOpen, setOrderSummarySheetOpen] = useState(false);

  const handleItemAddClick = (item: MenuItemDTO, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setDetailItem(item);
    } else {
      onQuickAdd(item);
      toast.success(`${item.name} siparişe eklendi!`);
    }
  };

  // Checkout & Celebration State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "WAITER">("WAITER");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Hero Slider State
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const activeSliders = useMemo(() => {
    if (!sliders || sliders.length === 0) {
      return [
        {
          id: "def-1",
          title: "Our Best Seller! 🔥",
          subtitle: "Loved by thousands, now it's your turn!",
          imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
          buttonText: "Order now",
          isActive: true,
          sortOrder: 1,
        },
      ];
    }
    return sliders.filter((s) => s.isActive);
  }, [sliders]);

  // Auto-advance slider
  useEffect(() => {
    if (activeSliders.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % activeSliders.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeSliders.length]);

  const categories = useMemo(
    () => menu.categories.filter((c) => c.isActive),
    [menu.categories],
  );

  const items = useMemo(() => {
    return menu.items.filter((it) => {
      if (!it.isActive) return false;
      if (selectedCategory && it.categoryId !== selectedCategory) return false;
      if (searchQuery.trim() && !it.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [menu.items, selectedCategory, searchQuery]);

  const popularMeals = useMemo(() => {
    return menu.items.filter((i) => i.isActive).slice(0, 6);
  }, [menu.items]);

  const resolvedHomeSections = useMemo<readonly QrHomeSection[]>(() => {
    if (homeSections && homeSections.length > 0) {
      return homeSections.filter((s) => s.isActive);
    }
    // Fallback: auto-generate sections from menu categories
    if (categories.length > 0) {
      return categories.map((c, idx) => ({
        id: `sec-cat-${c.id}`,
        type: "category",
        categoryId: c.id,
        title: c.name,
        displayStyle: "list",
        isActive: true,
        sortOrder: idx + 1,
      }));
    }
    return [
      {
        id: "sec-default-pop",
        type: "custom",
        title: "Popüler Lezzetler",
        subtitle: "En çok tercih edilen enfes lezzetler",
        displayStyle: "list",
        isActive: true,
        sortOrder: 1,
        itemIds: menu.items.slice(0, 8).map((it) => it.id),
      },
    ];
  }, [homeSections, categories, menu.items]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = menu.items.find((i) => i.id === id);
    setFavoriteItemsMap((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
        toast.info(`${item?.name || "Ürün"} favorilerden çıkarıldı.`);
      } else if (item) {
        next[id] = {
          id: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.images[0]?.url || null,
          savedAt: Date.now(),
        };
        toast.success(`${item.name} favorilerinize eklendi! ❤️`);
      }
      try {
        localStorage.setItem(favStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const openMealDetails = (item: MenuItemDTO) => {
    setDetailItem(item);
    setDetailQty(1);
    setSelectedVariantId(item.variants[0]?.id || null);
    setSelectedModifiers([]);
    setItemNote("");
  };

  const handleAddToCartFromModal = () => {
    if (!detailItem) return;

    const modifierItemsList: CustomModifierItem[] = [];
    for (const group of detailItem.modifierGroups) {
      for (const opt of group.modifiers) {
        if (selectedModifiers.includes(opt.id)) {
          modifierItemsList.push({
            groupId: group.id,
            groupName: group.name,
            optionId: opt.id,
            optionName: opt.name,
            price: Number(opt.priceDelta || 0),
          });
        }
      }
    }

    onAddCustomLine({
      item: detailItem,
      quantity: detailQty,
      variantId: selectedVariantId,
      modifierItems: modifierItemsList,
      notes: itemNote.trim() || undefined,
    });

    toast.success(`${detailItem.name} siparişe eklendi!`, {
      description: `${detailQty} adet siparişinize ilave edildi.`,
    });
    setDetailItem(null);
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    setPromoApplied(true);
    toast.success("İndirim kuponu uygulandı! 🎉");
  };

  const handleFinalCheckout = async () => {
    try {
      await onPlaceOrder();
      setCheckoutOpen(false);
      setOrderSuccessOpen(true);
    } catch {
      toast.error("Sipariş iletilirken bir hata oluştu.");
    }
  };

  return (
    <div
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-[#f8f8f9] text-zinc-900 pb-28 select-none transition-colors"
      style={{
        ["--qsr-primary" as string]: primaryColor,
        ["--qsr-secondary" as string]: secondaryColor,
      }}
    >
      
      {/* ============================================================ */}
      {/* 1. HOME SCREEN (Ana Sayfa)                                   */}
      {/* ============================================================ */}
      {activeTab === "home" && (
        <div className="p-4 space-y-4 animate-in fade-in-50 duration-200">
          
          {/* Top Header Bar (Avatar + Search + Filter/Bell) */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="relative size-10 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-xs shadow-sm border border-zinc-200 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {logoUrl ? (
                  <Image src={logoUrl} alt={restaurantName} fill className="object-cover" sizes="40px" />
                ) : (
                  <UtensilsCrossedIcon className="size-5" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-400 block tracking-tight">Hoş Geldiniz 👋</span>
                <span className="text-xs font-black text-zinc-900 truncate block -mt-0.5">{restaurantName}</span>
              </div>
            </div>

            {/* Table Badge & Order Bell */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-2xs border"
                style={{ backgroundColor: secondaryColor, color: primaryColor, borderColor: `${primaryColor}40` }}
              >
                🍽️ {tableLabel}
              </span>

              {(() => {
                const validCount = myOrders.filter(
                  (o) =>
                    o.status !== "VOID" &&
                    Array.isArray(o.lines) &&
                    o.lines.some((l) => l.state !== "VOID"),
                ).length;
                if (validCount === 0) return null;
                return (
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="relative p-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer"
                    aria-label="Siparişlerim"
                  >
                    <BellIcon className="size-4" />
                    <span
                      className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-white text-[9px] font-black"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {validCount}
                    </span>
                  </button>
                );
              })()}

              {/* Favorilerim Butonu */}
              <button
                type="button"
                onClick={() => setFavoritesDrawerOpen(true)}
                className="relative p-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer"
                aria-label="Favorilerim"
                title="Favorilerim"
              >
                <HeartIcon className={cn("size-4", evaluatedFavorites.length > 0 ? "fill-red-500 text-red-500" : "text-zinc-600")} />
                {evaluatedFavorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-white text-[9px] font-black bg-red-500">
                    {evaluatedFavorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar with Filter Trigger */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Ürün veya lezzet ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white border border-zinc-200/90 rounded-2xl pl-10 pr-10 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none shadow-xs focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Button with Active Badge */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white shadow-xs transition-all duration-200 active:scale-95 cursor-pointer",
                activeFilterCount > 0
                  ? "border-2 shadow-sm font-black"
                  : "text-zinc-700 hover:bg-zinc-50",
              )}
              style={{
                borderColor: activeFilterCount > 0 ? primaryColor : undefined,
                color: activeFilterCount > 0 ? primaryColor : undefined,
                backgroundColor: activeFilterCount > 0 ? secondaryColor : undefined,
              }}
              title="Filtreleme Seçenekleri"
              aria-label="Filtreleme Seçenekleri"
            >
              <SlidersHorizontalIcon className="size-4.5" />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-black text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Tags Row (Quick Dismiss) */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-0.5 animate-in fade-in-50 duration-200">
              <span className="text-[10px] font-bold text-zinc-400">
                Filtreler:
              </span>

              {selectedDiet !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedDiet("ALL")}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border shadow-2xs transition-transform active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: secondaryColor,
                    borderColor: `${primaryColor}40`,
                    color: primaryColor,
                  }}
                >
                  <span>{DIET_BADGES[selectedDiet]?.icon}</span>
                  <span>{DIET_BADGES[selectedDiet]?.label}</span>
                  <XIcon className="size-3 ml-0.5" />
                </button>
              )}

              {excludedAllergens.map((alg) => (
                <button
                  key={alg}
                  type="button"
                  onClick={() => toggleExcludedAllergen(alg)}
                  className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
                >
                  <span>🚫 {alg} içermeyen</span>
                  <XIcon className="size-3 ml-0.5" />
                </button>
              ))}

              {maxCalories !== null && (
                <button
                  type="button"
                  onClick={() => setMaxCalories(null)}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 cursor-pointer"
                >
                  <span>🔥 ≤ {maxCalories} kcal</span>
                  <XIcon className="size-3 ml-0.5" />
                </button>
              )}

              {priceSort !== "DEFAULT" && (
                <button
                  type="button"
                  onClick={() => setPriceSort("DEFAULT")}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[10px] font-bold text-zinc-700 cursor-pointer"
                >
                  <span>💳 {priceSort === "ASC" ? "En Ucuz" : "En Pahalı"}</span>
                  <XIcon className="size-3 ml-0.5" />
                </button>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 underline underline-offset-2 ml-1 cursor-pointer"
              >
                Temizle
              </button>
            </div>
          )}

          {/* Greeting Typography */}
          <div className="pt-1">
            <span className="text-xs font-bold text-zinc-400 block">{greetingSubtitle || "Hoş Geldiniz 👋"}</span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-tight mt-0.5">
              {greetingTitle || "Bugün Ne Yemek İstersiniz?"}
            </h2>
          </div>

          {/* Hero Slider Card (Görseldeki Banner) */}
          {slidersEnabled && activeSliders.length > 0 && (
            <div className="space-y-2">
              <div
                className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-all duration-300 flex items-center justify-between gap-3 min-h-[140px]"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                }}
              >
                {/* Background Glow */}
                <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-white/15 blur-2xl" />

                {/* Left Text Content */}
                <div className="relative min-w-0 flex-1 space-y-1.5 z-10">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[9px] uppercase tracking-wider backdrop-blur-xs">
                    Fırsat
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    {activeSliders[activeSlideIndex]?.title || "Günün Lezzeti! 🔥"}
                  </h3>
                  <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed font-medium">
                    {activeSliders[activeSlideIndex]?.subtitle || "Şefin özel tarifiyle hazırlandı, hemen deneyin!"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (popularMeals[0]) openMealDetails(popularMeals[0]);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-zinc-950 font-black text-xs shadow-md active:scale-95 transition-transform cursor-pointer"
                  >
                    <span>{activeSliders[activeSlideIndex]?.buttonText || "Sipariş Ver"}</span>
                    <ChevronRightIcon className="size-3" />
                  </button>
                </div>

                {/* Right Food Photo */}
                <div className="relative size-24 sm:size-28 rounded-2xl overflow-hidden bg-white/10 p-1.5 shadow-inner shrink-0 flex items-center justify-center">
                  {activeSliders[activeSlideIndex]?.imageUrl ? (
                    <Image
                      src={activeSliders[activeSlideIndex].imageUrl!}
                      alt="Banner"
                      fill
                      className="object-cover rounded-xl"
                      sizes="120px"
                    />
                  ) : (
                    <span className="text-5xl">🍔</span>
                  )}
                </div>
              </div>

              {/* Slider Dots */}
              {activeSliders.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                  {activeSliders.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                        activeSlideIndex === idx ? "w-6 bg-primary" : "w-1.5 bg-zinc-300",
                      )}
                      style={{ backgroundColor: activeSlideIndex === idx ? primaryColor : undefined }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Horizontal Chips Row (Görseldeki Yuvarlak İkonlu Kategori Şeridi) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900">Kategoriler</h3>
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className="text-xs font-bold transition-colors cursor-pointer"
                style={{ color: primaryColor }}
              >
                Tümünü Gör
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer transition-transform active:scale-95",
                )}
              >
                <div
                  className={cn(
                    "size-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-all border",
                    selectedCategory === null
                      ? "border-2 shadow-md scale-105"
                      : "bg-white border-zinc-200/80 hover:bg-zinc-50",
                  )}
                  style={{
                    backgroundColor: selectedCategory === null ? primaryColor : "#ffffff",
                    borderColor: selectedCategory === null ? primaryColor : undefined,
                    color: selectedCategory === null ? "#ffffff" : undefined,
                  }}
                >
                  ⭐
                </div>
                <span className={cn(
                  "text-[11px] truncate max-w-[64px]",
                  selectedCategory === null ? "font-black text-zinc-950" : "font-bold text-zinc-700",
                )}>
                  Tümü
                </span>
              </button>

              {categories.map((c) => {
                const isSelected = selectedCategory === c.id;
                const emoji = getCategoryEmoji(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? null : c.id)}
                    className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer transition-transform active:scale-95"
                  >
                    <div
                      className={cn(
                        "size-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-all border",
                        isSelected
                          ? "border-2 shadow-md scale-105"
                          : "bg-white border-zinc-200/80 hover:bg-zinc-50",
                      )}
                      style={{
                        backgroundColor: isSelected ? primaryColor : "#ffffff",
                        borderColor: isSelected ? primaryColor : undefined,
                        color: isSelected ? "#ffffff" : undefined,
                      }}
                    >
                      {emoji}
                    </div>
                    <span className={cn(
                      "text-[11px] truncate max-w-[68px]",
                      isSelected ? "font-black text-zinc-950" : "font-bold text-zinc-700",
                    )}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area: Selected Category Products View OR Dynamic Home Sections */}
          {selectedCategory ? (
            /* ACTIVE SELECTED CATEGORY PRODUCTS VIEW */
            (() => {
              const currentCategory = categories.find((c) => c.id === selectedCategory);
              const categoryItems = applyFilters(
                menu.items.filter((it) => it.categoryId === selectedCategory),
              );

              return (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  {/* Category Header Banner */}
                  <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="size-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        {getCategoryEmoji(currentCategory?.name || "")}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-zinc-900 truncate">
                          {currentCategory?.name || "Kategori"}
                        </h3>
                        <span className="text-[11px] font-bold text-zinc-400 block">
                          {categoryItems.length} çeşit lezzet listeleniyor
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="text-[11px] font-black px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      ✕ Tümünü Gör
                    </button>
                  </div>

                  {/* Category Items Grid (2'li Izgara Kartlar) */}
                  {categoryItems.length === 0 ? (
                    <div className="text-center py-12 p-6 rounded-3xl bg-white border border-dashed border-zinc-300 space-y-3">
                      <span className="text-4xl block">🔍</span>
                      <h4 className="text-sm font-black text-zinc-800">
                        Bu kategoride uygun ürün bulunamadı
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                        Arama veya filtreleme kriterlerinizi değiştirerek tekrar deneyebilirsiniz.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          resetFilters();
                        }}
                        className="rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Filtreleri Temizle
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                      {categoryItems.map((item, idx) => {
                        const photo =
                          item.images.find((i) => i.isPrimary) ??
                          item.images[0] ??
                          null;
                        const isFav = favorites[item.id] ?? false;

                        return (
                          <div
                            key={item.id}
                            onClick={() => openMealDetails(item)}
                            className="relative bg-white rounded-3xl p-3 shadow-xs border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group active:scale-[0.98] animate-in fade-in duration-200"
                            style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
                          >
                            <div>
                              {/* Top Food Image */}
                              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                                {photo ? (
                                  <Image
                                    src={photo.url}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, 200px"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-4xl">{getCategoryEmoji(currentCategory?.name || "")}</span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => toggleFavorite(item.id, e)}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs shadow-xs text-zinc-400 hover:text-red-500 transition-colors z-10"
                                >
                                  <HeartIcon
                                    className={cn(
                                      "size-3.5",
                                      isFav && "fill-red-500 text-red-500",
                                    )}
                                  />
                                </button>
                              </div>

                              <h4 className="font-black text-xs sm:text-sm text-zinc-900 truncate group-hover:text-primary transition-colors">
                                {item.name}
                              </h4>

                              {item.shortDescription && (
                                <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                                  {item.shortDescription}
                                </p>
                              )}

                              <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-zinc-400">
                                <span className="flex items-center gap-0.5 text-amber-500">
                                  <StarIcon className="size-3 fill-amber-500" />
                                  <span>4.8</span>
                                </span>
                                <span>•</span>
                                <span>{item.calories || 450} kcal</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-zinc-100">
                              <span
                                className="font-black text-xs sm:text-sm tabular-nums"
                                style={{ color: primaryColor }}
                              >
                                {formatCurrency(item.price)}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => handleItemAddClick(item, e)}
                                className="size-7 rounded-full text-white font-black flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <PlusIcon className="size-3.5 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            /* DYNAMIC HOME SECTIONS VIEW (WHEN "TÜMÜ" IS ACTIVE) */
            <div className="space-y-6 pt-1">
              {resolvedHomeSections.map((sec) => {
                // Find items for this section
                let rawSectionItems: MenuItemDTO[] = [];
                if (sec.type === "category") {
                  rawSectionItems = menu.items.filter(
                    (it) => it.isActive && it.categoryId === sec.categoryId,
                  );
                } else if (sec.type === "custom") {
                  const itemMap = new Map(menu.items.map((i) => [i.id, i]));
                  rawSectionItems = (sec.itemIds || [])
                    .map((id) => itemMap.get(id))
                    .filter((it): it is MenuItemDTO => Boolean(it && it.isActive));
                }

                // Apply multi-criteria filters & sorters
                const sectionItems = applyFilters(rawSectionItems);

                if (sectionItems.length === 0) return null;

                return (
                  <div key={sec.id} className="space-y-3">
                    {/* Section Title & Subtitle Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-zinc-900">
                          {sec.title}
                        </h3>
                        {sec.subtitle && (
                          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            {sec.subtitle}
                          </p>
                        )}
                      </div>

                      {sec.type === "category" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(sec.categoryId || null);
                          }}
                          className="text-xs font-bold transition-colors cursor-pointer shrink-0"
                          style={{ color: primaryColor }}
                        >
                          Tümünü Gör →
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-zinc-400 shrink-0">
                          {sectionItems.length} çeşit
                        </span>
                      )}
                    </div>

                    {/* 1. LIST STYLE (Görseldeki Yatay Satır Kartlar) */}
                    {sec.displayStyle === "list" && (
                      <div className="space-y-3">
                        {sectionItems.map((item, idx) => {
                          const photo =
                            item.images.find((i) => i.isPrimary) ??
                            item.images[0] ??
                            null;
                          const isFav = favorites[item.id] ?? false;

                          return (
                            <div
                              key={item.id}
                              onClick={() => openMealDetails(item)}
                              className="relative bg-white rounded-3xl p-3.5 shadow-xs border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer group active:scale-[0.99] animate-in fade-in slide-in-from-bottom-3 duration-300"
                              style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
                            >
                              {/* Left Food Image */}
                              <div className="relative size-20 sm:size-22 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                                {photo ? (
                                  <Image
                                    src={photo.url}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="90px"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-3xl">🍔</span>
                                )}
                              </div>

                              {/* Middle Info */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="font-black text-xs sm:text-sm text-zinc-900 truncate group-hover:text-primary transition-colors">
                                    {item.name}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={(e) => toggleFavorite(item.id, e)}
                                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                  >
                                    <HeartIcon
                                      className={cn(
                                        "size-4",
                                        isFav && "fill-red-500 text-red-500",
                                      )}
                                    />
                                  </button>
                                </div>

                                {item.shortDescription && (
                                  <p className="text-[10px] text-zinc-500 line-clamp-1">
                                    {item.shortDescription}
                                  </p>
                                )}

                                {/* Stats & Price */}
                                <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-zinc-500">
                                  <span className="flex items-center gap-0.5 text-amber-500">
                                    <StarIcon className="size-3 fill-amber-500" />
                                    <span>4.8</span>
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-orange-500">
                                    <FlameIcon className="size-3 text-orange-500" />
                                    <span>{item.calories || 450} Kalori</span>
                                  </span>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <span
                                    className="font-black text-xs sm:text-sm tabular-nums"
                                    style={{ color: primaryColor }}
                                  >
                                    {formatCurrency(item.price)}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => handleItemAddClick(item, e)}
                                    className="px-3 py-1 rounded-full text-white font-black text-xs flex items-center gap-1 shadow-xs active:scale-90 transition-transform cursor-pointer"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <PlusIcon className="size-3 stroke-[3]" />
                                    <span>Ekle</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. GRID / KART STİLİ (2'li Izgara Dikey Kartlar) */}
                    {sec.displayStyle === "grid" && (
                      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                        {sectionItems.map((item, idx) => {
                          const photo =
                            item.images.find((i) => i.isPrimary) ??
                            item.images[0] ??
                            null;
                          const isFav = favorites[item.id] ?? false;

                          return (
                            <div
                              key={item.id}
                              onClick={() => openMealDetails(item)}
                              className="relative bg-white rounded-3xl p-3 shadow-xs border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group active:scale-[0.98] animate-in fade-in duration-200"
                              style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
                            >
                              <div>
                                {/* Top Food Image */}
                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                                  {photo ? (
                                    <Image
                                      src={photo.url}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      sizes="150px"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="text-4xl">🍔</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => toggleFavorite(item.id, e)}
                                    className="absolute top-2 right-2 size-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-zinc-400 hover:text-red-500 shadow-xs transition-colors"
                                  >
                                    <HeartIcon
                                      className={cn(
                                        "size-3.5",
                                        isFav && "fill-red-500 text-red-500",
                                      )}
                                    />
                                  </button>
                                </div>

                                <h4 className="font-black text-xs text-zinc-900 truncate group-hover:text-primary transition-colors">
                                  {item.name}
                                </h4>
                                {item.shortDescription && (
                                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                                    {item.shortDescription}
                                  </p>
                                )}

                                <div className="flex items-center gap-1.5 pt-1 text-[9px] font-bold text-zinc-400">
                                  <span className="flex items-center gap-0.5 text-amber-500">
                                    <StarIcon className="size-2.5 fill-amber-500" />
                                    <span>4.8</span>
                                  </span>
                                  <span>•</span>
                                  <span>{item.calories || 450} kcal</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2.5 mt-1.5 border-t border-zinc-100">
                                <span
                                  className="font-black text-xs sm:text-sm tabular-nums"
                                  style={{ color: primaryColor }}
                                >
                                  {formatCurrency(item.price)}
                                </span>
                                <button
                                   type="button"
                                   onClick={(e) => handleItemAddClick(item, e)}
                                   className="px-2.5 py-1 rounded-full text-white font-black text-[11px] flex items-center gap-1 shadow-xs active:scale-90 transition-transform cursor-pointer"
                                   style={{ backgroundColor: primaryColor }}
                                 >
                                   <PlusIcon className="size-3 stroke-[3]" />
                                   <span>Ekle</span>
                                 </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. SLIDER STİLİ (Yatay Kaydırmalı Kart Carousel) */}
                    {sec.displayStyle === "slider" && (
                      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-0.5 scrollbar-none -mx-4 px-4">
                        {sectionItems.map((item) => {
                          const photo =
                            item.images.find((i) => i.isPrimary) ??
                            item.images[0] ??
                            null;
                          const isFav = favorites[item.id] ?? false;

                          return (
                            <div
                              key={item.id}
                              onClick={() => openMealDetails(item)}
                              className="w-38 sm:w-44 shrink-0 bg-white rounded-3xl p-3 shadow-xs border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
                            >
                              <div>
                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                                  {photo ? (
                                    <Image
                                      src={photo.url}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      sizes="140px"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="text-4xl">🍔</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => toggleFavorite(item.id, e)}
                                    className="absolute top-2 right-2 size-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-zinc-400 hover:text-red-500 shadow-xs transition-colors"
                                  >
                                    <HeartIcon
                                      className={cn(
                                        "size-3.5",
                                        isFav && "fill-red-500 text-red-500",
                                      )}
                                    />
                                  </button>
                                </div>

                                <h4 className="font-black text-xs text-zinc-900 truncate group-hover:text-primary transition-colors">
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-1.5 pt-1 text-[9px] font-bold text-zinc-400">
                                  <span className="text-amber-500">★ 4.8</span>
                                  <span>•</span>
                                  <span>{item.calories || 400} kcal</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-100">
                                <span
                                  className="font-black text-xs tabular-nums"
                                  style={{ color: primaryColor }}
                                >
                                  {formatCurrency(item.price)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleItemAddClick(item, e)}
                                  className="px-2.5 py-1 rounded-full text-white font-black text-[11px] flex items-center gap-1 shadow-xs active:scale-90 transition-transform cursor-pointer"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  <PlusIcon className="size-3 stroke-[3]" />
                                  <span>Ekle</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CATEGORIES TAB SCREEN (Kategoriler Sayfası)                */}
      {/* ============================================================ */}
      {activeTab === "categories" && (
        <div className="p-4 space-y-4 animate-in fade-in-50 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="p-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer"
            >
              <ArrowLeftIcon className="size-4" />
            </button>
            <h2 className="text-base font-black text-zinc-900">Kategoriler</h2>
            <div className="size-8" />
          </div>

          {/* 2-Column Categories Grid (Görseldeki Categories Ekranı) */}
          <div className="grid grid-cols-2 gap-3">
            {categories.map((c) => {
              const count = menu.items.filter((i) => i.categoryId === c.id && i.isActive).length;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setActiveTab("home");
                  }}
                  className="bg-white rounded-3xl p-4 shadow-xs border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col items-center text-center justify-between gap-2.5 cursor-pointer group active:scale-[0.98]"
                >
                  <div className="size-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                    🍔
                  </div>

                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-zinc-900 group-hover:text-primary transition-colors">
                      {c.name}
                    </h4>
                    <span className="text-[10px] font-bold text-zinc-400 block mt-0.5">
                      {count} çeşit
                    </span>
                  </div>

                  <div
                    className="size-7 rounded-full flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ChevronRightIcon className="size-3.5 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MY CART TAB SCREEN (Sepetim Ekranı)                         */}
      {/* ============================================================ */}
      {activeTab === "cart" && (
        <div className="p-4 space-y-4 animate-in fade-in-50 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="p-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer"
            >
              <ArrowLeftIcon className="size-4" />
            </button>
            <h2 className="text-base font-black text-zinc-900">Sepetim ({cartItemCount})</h2>
            <button
              type="button"
              onClick={onClearCart}
              className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
            >
              Sepeti Boşalt
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="size-16 mx-auto rounded-3xl bg-zinc-100 flex items-center justify-center text-3xl">
                🛍️
              </div>
              <h3 className="font-black text-base text-zinc-900">Sepetiniz Boş</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Lezzetli yemek ve içecekleri inceleyip sepetinize ekleyebilirsiniz.
              </p>
              <Button
                onClick={() => setActiveTab("home")}
                className="rounded-2xl font-black text-xs text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Menüye Göz At
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items List */}
              <div className="space-y-3">
                {cartItems.map((line) => {
                  const menuItem = menu.items.find((it) => it.id === line.menuItemId);
                  const photo = menuItem?.images.find((i) => i.isPrimary) ?? menuItem?.images[0] ?? null;
                  return (
                    <div
                      key={line.key}
                      className="bg-white rounded-3xl p-3.5 shadow-xs border border-zinc-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="relative size-16 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0 flex items-center justify-center">
                        {photo ? (
                          <Image src={photo.url} alt={line.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <span className="text-2xl">🍔</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="font-black text-xs text-zinc-900 truncate">{line.name}</h4>
                        {line.variantName && (
                          <span className="text-[10px] font-bold text-zinc-400 block">{line.variantName}</span>
                        )}
                        <span className="font-black text-xs tabular-nums block" style={{ color: primaryColor }}>
                          {formatCurrency(line.unitPrice * line.quantity)}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            if (line.quantity <= 1) onRemoveLine(line.key);
                            else onUpdateQuantity(line.key, line.quantity - 1);
                          }}
                          className="size-7 rounded-xl bg-white text-zinc-900 flex items-center justify-center font-black shadow-xs active:scale-90 transition-transform cursor-pointer"
                        >
                          <MinusIcon className="size-3" />
                        </button>
                        <span className="w-5 text-center font-black text-xs tabular-nums text-zinc-900">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(line.key, line.quantity + 1)}
                          className="size-7 rounded-xl text-white flex items-center justify-center font-black shadow-xs active:scale-90 transition-transform cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <PlusIcon className="size-3 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Input */}
              <div className="bg-white rounded-3xl p-2.5 border border-zinc-200/80 flex items-center gap-2 shadow-xs">
                <Input
                  type="text"
                  placeholder="Kupon Kodu Gir"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoApplied}
                  className="border-none shadow-none text-xs font-bold h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyPromo}
                  disabled={promoApplied || !promoCode.trim()}
                  className="rounded-2xl font-black text-xs text-white shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {promoApplied ? "Uygulandı ✓" : "Uygula"}
                </Button>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-3xl p-4 border border-zinc-200/80 space-y-2 shadow-xs text-xs">
                <div className="flex justify-between text-zinc-500 font-medium">
                  <span>Ara Toplam</span>
                  <span className="tabular-nums font-bold text-zinc-900">{formatCurrency(cartGrandTotal)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>İndirim (%10)</span>
                    <span className="tabular-nums">-{formatCurrency(cartGrandTotal * 0.1)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-black text-sm text-zinc-900">
                  <span>Genel Toplam</span>
                  <span className="tabular-nums" style={{ color: primaryColor }}>
                    {formatCurrency(promoApplied ? cartGrandTotal * 0.9 : cartGrandTotal)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <Button
                size="lg"
                disabled={busy}
                onClick={() => setCheckoutOpen(true)}
                className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Siparişi Onayla →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. PROFILE / LOYALTY SCREEN                                  */}
      {/* ============================================================ */}
      {activeTab === "profile" && (
        <div className="p-4 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="p-2 rounded-2xl bg-white border border-zinc-200 text-zinc-700 shadow-2xs hover:bg-zinc-50 cursor-pointer"
            >
              <ArrowLeftIcon className="size-4" />
            </button>
            <h2 className="text-base font-black text-zinc-900">Müşteri Profili & Masa</h2>
            <div className="size-8" />
          </div>

          <CustomerLoyaltyPanel
            username={username}
            restaurantName={restaurantName}
            logoUrl={logoUrl}
            tableId={tableId}
            tableLabel={tableLabel}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            wifiSsid={wifiSsid}
            wifiPassword={wifiPassword}
            activeOrders={myOrders}
            onRequestBill={onRequestBill}
            onCallWaiter={onCallWaiter}
            onCustomerIdentified={onCustomerIdentified}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MEAL DETAILS MODAL (Görseldeki Meal Details Ekranı)        */}
      {/* ============================================================ */}
      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md max-h-[92vh] p-0 overflow-y-auto rounded-3xl border-2 border-zinc-200 shadow-2xl flex flex-col justify-between"
        >
          {detailItem && (
            <>
              {/* Hero Image Container */}
              <div className="relative w-full aspect-4/3 bg-zinc-900 shrink-0">
                {detailItem.images[0] ? (
                  <Image
                    src={detailItem.images[0].url}
                    alt={detailItem.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 450px"
                    priority
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-7xl bg-zinc-100">
                    🍔
                  </div>
                )}

                {/* Back, Heart & Close Action Buttons (Temizce Ayrılmış, Çakışmayan Düzen) */}
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="absolute top-4 left-4 size-9 rounded-2xl bg-white/90 backdrop-blur-md text-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer z-10"
                  aria-label="Geri"
                >
                  <ArrowLeftIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(detailItem.id)}
                  className="absolute top-4 right-15 size-9 rounded-2xl bg-white/90 backdrop-blur-md text-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer z-10"
                  aria-label="Favorilere Ekle"
                  title="Favorilere Ekle / Çıkar"
                >
                  <HeartIcon className={cn("size-4", favorites[detailItem.id] && "fill-red-500 text-red-500")} />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="absolute top-4 right-4 size-9 rounded-2xl bg-white/90 backdrop-blur-md text-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer z-10"
                  aria-label="Kapat"
                  title="Kapat"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              {/* Details Body */}
              <div className="p-5 space-y-4">
                {/* Title & Stepper Row */}
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-lg sm:text-xl text-zinc-900 leading-tight">
                    {detailItem.name}
                  </h3>

                  <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      className="size-7 rounded-xl bg-white text-zinc-900 flex items-center justify-center font-black shadow-xs active:scale-90 transition-transform cursor-pointer"
                    >
                      <MinusIcon className="size-3" />
                    </button>
                    <span className="w-6 text-center font-black text-sm tabular-nums text-zinc-900">
                      {detailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailQty((q) => q + 1)}
                      className="size-7 rounded-xl text-white flex items-center justify-center font-black shadow-xs active:scale-90 transition-transform cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <PlusIcon className="size-3 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Stats Row (Calories, Rating, Time) */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 font-bold text-xs flex items-center gap-1">
                    <FlameIcon className="size-3.5" />
                    <span>{detailItem.calories || 580} Kalori</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center gap-1">
                    <StarIcon className="size-3.5 fill-amber-500" />
                    <span>4.8</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 font-bold text-xs flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    <span>15-25 Dk</span>
                  </span>
                </div>

                {/* Description */}
                {(detailItem.longDescription || detailItem.shortDescription) && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-zinc-900">Ürün Açıklaması</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                      {detailItem.longDescription || detailItem.shortDescription}
                    </p>
                  </div>
                )}

                {/* Variants Selection (if any) */}
                {detailItem.variants.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-zinc-900">Porsiyon / Boyut Seçimi</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {detailItem.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={cn(
                            "p-2.5 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer flex justify-between items-center",
                            selectedVariantId === v.id
                              ? "border-2 border-primary bg-primary/10 text-primary"
                              : "border-zinc-200 bg-white text-zinc-700",
                          )}
                          style={{
                            borderColor: selectedVariantId === v.id ? primaryColor : undefined,
                            color: selectedVariantId === v.id ? primaryColor : undefined,
                          }}
                        >
                          <span>{v.name}</span>
                          <span className="font-mono">{formatCurrency(v.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorized Modifiers & Extra Options (Kategorize Edilmiş Seçenekler) */}
                {detailItem.modifierGroups.length > 0 && (
                  <div className="space-y-4 pt-1">
                    <div className="border-t pt-3">
                      <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                        Ekstra Malzeme & Seçenekler
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Ürününüzü dilediğiniz gibi özelleştirin
                      </p>
                    </div>

                    {detailItem.modifierGroups.map((group) => {
                      const isSingleChoice = group.maxSelect === 1;
                      const isRequired = group.isRequired || group.minSelect > 0;
                      const selectedInGroup = group.modifiers.filter((opt) => selectedModifiers.includes(opt.id));

                      return (
                        <div key={group.id} className="p-3.5 rounded-3xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-black text-xs text-zinc-900 block">{group.name}</span>
                              <span className="text-[10px] font-bold text-zinc-400 block">
                                {isSingleChoice ? "1 seçim yapın" : group.maxSelect > 1 ? `En fazla ${group.maxSelect} adet seçin` : "İsteğe bağlı"}
                              </span>
                            </div>
                            {isRequired ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-black text-[9px]">
                                Zorunlu
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-zinc-200/60 text-zinc-600 font-bold text-[9px]">
                                İsteğe Bağlı
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {group.modifiers.map((opt) => {
                              const isChecked = selectedModifiers.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSingleChoice) {
                                      const otherIdsInGroup = group.modifiers.map((m) => m.id);
                                      setSelectedModifiers((prev) => [
                                        ...prev.filter((id) => !otherIdsInGroup.includes(id)),
                                        ...(isChecked ? [] : [opt.id]),
                                      ]);
                                    } else {
                                      if (isChecked) {
                                        setSelectedModifiers((prev) => prev.filter((id) => id !== opt.id));
                                      } else {
                                        if (group.maxSelect > 0 && selectedInGroup.length >= group.maxSelect) {
                                          toast.info(`Bu gruptan en fazla ${group.maxSelect} adet seçebilirsiniz.`);
                                          return;
                                        }
                                        setSelectedModifiers((prev) => [...prev, opt.id]);
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full p-2.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer",
                                    isChecked
                                      ? "border-2 bg-white shadow-xs text-zinc-900"
                                      : "border-zinc-200 bg-white/70 text-zinc-700 hover:bg-white",
                                  )}
                                  style={{
                                    borderColor: isChecked ? primaryColor : undefined,
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn(
                                        "size-4 rounded-md flex items-center justify-center border transition-all",
                                        isSingleChoice ? "rounded-full" : "rounded-md",
                                        isChecked ? "text-white" : "border-zinc-300 bg-zinc-50",
                                      )}
                                      style={{
                                        backgroundColor: isChecked ? primaryColor : undefined,
                                        borderColor: isChecked ? primaryColor : undefined,
                                      }}
                                    >
                                      {isChecked && <CheckIcon className="size-3 stroke-[3]" />}
                                    </div>
                                    <span>{opt.name}</span>
                                  </div>

                                  <span className="tabular-nums font-mono font-black text-[11px]" style={{ color: isChecked ? primaryColor : undefined }}>
                                    {opt.priceDelta && Number(opt.priceDelta) > 0
                                      ? `+${formatCurrency(Number(opt.priceDelta))}`
                                      : "Ücretsiz"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sticky Footer Action */}
              <div className="p-4 border-t bg-white sticky bottom-0 flex items-center justify-between gap-4">
                {(() => {
                  const selVariant = detailItem.variants.find((v) => v.id === selectedVariantId);
                  const base = selVariant ? selVariant.price : detailItem.price;
                  const modsDelta = detailItem.modifierGroups.reduce((acc, g) => {
                    return (
                      acc +
                      g.modifiers
                        .filter((m) => selectedModifiers.includes(m.id))
                        .reduce((sum, m) => sum + Number(m.priceDelta || 0), 0)
                    );
                  }, 0);
                  const unitTotal = base + modsDelta;
                  return (
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 block">Toplam Tutar:</span>
                      <span className="font-black text-lg text-zinc-900 tabular-nums">
                        {formatCurrency(unitTotal * detailQty)}
                      </span>
                    </div>
                  );
                })()}

                <Button
                  size="lg"
                  onClick={handleAddToCartFromModal}
                  className="flex-1 h-12 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingBagIcon className="size-4 stroke-[2.5]" />
                  <span>Siparişe Ekle 🛍️</span>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 6. CHECKOUT CONFIRMATION MODAL                               */}
      {/* ============================================================ */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-zinc-900 flex items-center gap-2">
              <ReceiptIcon className="size-4.5 text-primary" style={{ color: primaryColor }} />
              <span>Sipariş Onayı</span>
            </DialogTitle>
          </DialogHeader>

          {/* Categorized Receipt / Bill Style Card */}
          <div className="rounded-2xl bg-zinc-50 border border-zinc-200/90 p-4 font-mono text-xs shadow-2xs space-y-3">
            {/* Receipt Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-zinc-300 pb-2.5">
              <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-sans">
                {restaurantName}
              </h4>
              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-medium font-sans">
                <span className="font-bold text-zinc-800">🍽️ Masa: {tableLabel}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            {/* Categorized Order Items */}
            <div className="max-h-56 overflow-y-auto divide-y divide-zinc-200/60 pr-1 space-y-2">
              {categorizedCart.map((catGroup, cIdx) => (
                <div key={cIdx} className="pt-2 first:pt-0 space-y-1.5">
                  {/* Category Header */}
                  <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-sans flex items-center gap-1">
                    <span style={{ color: primaryColor }}>▪</span>
                    <span>{catGroup.categoryName}</span>
                  </div>

                  {/* Items in this category */}
                  <div className="space-y-1 pl-1">
                    {catGroup.lines.map((line) => (
                      <div key={line.key} className="space-y-0.5">
                        <div className="flex items-start justify-between gap-2 text-xs">
                          <span className="font-bold text-zinc-900 font-sans flex-1 min-w-0">
                            <span style={{ color: primaryColor }} className="font-black mr-1">
                              {line.quantity}×
                            </span>
                            {line.name}
                          </span>
                          <span className="font-mono font-bold text-zinc-900 tabular-nums shrink-0">
                            {formatCurrency(linePrice(line))}
                          </span>
                        </div>

                        {line.variantName && (
                          <div className="text-[10px] text-zinc-500 font-sans pl-4">
                            ↳ Varyant: {line.variantName}
                          </div>
                        )}

                        {line.modifiers.length > 0 && (
                          <div className="text-[10px] text-zinc-400 font-sans pl-4">
                            + {line.modifiers.map((m) => m.name).join(", ")}
                          </div>
                        )}

                        {line.lineNote && (
                          <div className="text-[10px] text-zinc-500 italic font-sans pl-4">
                            &ldquo;{line.lineNote}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Receipt Summary & Total */}
            <div className="border-t border-dashed border-zinc-300 pt-2.5 space-y-1 font-sans">
              <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                <span>Toplam Kalem</span>
                <span>{cartItemCount} Adet</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                <span>KDV</span>
                <span>Dahil</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200 font-black text-sm">
                <span className="text-zinc-900">Toplam Tutar</span>
                <span className="text-base tabular-nums font-mono font-black" style={{ color: primaryColor }}>
                  {formatCurrency(cartGrandTotal)}
                </span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            disabled={busy}
            onClick={handleFinalCheckout}
            className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            {busy ? "İletiliyor…" : "Sipariş Oluştur"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 7. ORDER CELEBRATION MODAL (Modern & Profesyonel Onay)        */}
      {/* ============================================================ */}
      <Dialog open={orderSuccessOpen} onOpenChange={setOrderSuccessOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 text-center space-y-4">
          <div className="flex flex-col items-center gap-3">
            {/* Professional Checkmark Icon (No bouncing emoji) */}
            <div
              className="size-16 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCircle2Icon className="size-8 stroke-[2.5]" />
            </div>

            <DialogTitle className="text-lg font-black text-zinc-900 leading-tight">
              Siparişiniz Alındı!
            </DialogTitle>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              <span className="font-bold text-zinc-800">{tableLabel}</span> için verdiğiniz sipariş mutfağa iletildi. Şeflerimiz özenle hazırlamaya başladı.
            </p>

            <div className="w-full flex flex-col gap-2 pt-2">
              <Button
                className="w-full h-11 rounded-2xl font-black text-xs text-white shadow-md cursor-pointer"
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  setOrderSuccessOpen(false);
                  setActiveTab("profile");
                }}
              >
                Siparişimi Takip Et ⏱️
              </Button>

              <Button
                variant="outline"
                className="w-full h-11 rounded-2xl font-bold text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                onClick={() => {
                  setOrderSuccessOpen(false);
                  setActiveTab("home");
                }}
              >
                Menüye Dön
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 8. FLOATING CART BAR (ALT MENÜ ÜSTÜNDEKİ SİPARİŞ ÖZETİ ÇUBUĞU) */}
      {/* ============================================================ */}
      {cartItemCount > 0 && activeTab !== "profile" && (
        <div className="fixed inset-x-0 bottom-[98px] z-40 px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0.5rem)] animate-in slide-in-from-bottom-3 duration-300">
          <div className="mx-auto flex w-full max-w-md items-center justify-between rounded-3xl bg-zinc-950 p-2.5 sm:p-3 shadow-2xl border border-zinc-800/90 text-white pointer-events-auto">
            {/* Left: Bag Icon with Count Badge & Amount */}
            <div className="flex items-center gap-3">
              <div className="relative flex size-11 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white shrink-0">
                <ShoppingBagIcon className="size-5" />
                <span
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-white text-[10px] font-black shadow-md ring-2 ring-zinc-950"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartItemCount}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-medium text-zinc-400">
                  Toplam ({cartItemCount} Ürün)
                </span>
                <span className="text-base font-black tracking-tight text-white tabular-nums">
                  {formatCurrency(cartGrandTotal)}
                </span>
              </div>
            </div>

            {/* Right: Sipariş Özeti Button */}
            <button
              type="button"
              onClick={() => setOrderSummarySheetOpen(true)}
              className="px-5 py-2.5 sm:py-3 rounded-2xl font-black text-xs text-white shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Sipariş Özeti →</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. SİPARİŞ ÖZETİ BOTTOM SHEET (GÖRSELDEKİ POPUP ARAYÜZÜ)      */}
      {/* ============================================================ */}
      <Sheet open={orderSummarySheetOpen} onOpenChange={setOrderSummarySheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] rounded-t-[32px] p-0 overflow-hidden flex flex-col bg-white border-t border-zinc-200 shadow-2xl"
        >
          {/* Sheet Header */}
          <SheetHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between space-y-0 text-left">
            <SheetTitle className="text-lg font-black text-zinc-900">
              Sipariş Özeti
            </SheetTitle>
            <button
              type="button"
              onClick={() => setOrderSummarySheetOpen(false)}
              className="size-8 rounded-full bg-zinc-100 text-zinc-500 hover:text-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <XIcon className="size-4" />
            </button>
          </SheetHeader>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-100 space-y-3">
            {cartItems.map((line) => (
              <div key={line.key} className="pt-3 first:pt-0 space-y-2">
                {/* Item Title & Line Total */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-zinc-900 leading-snug">
                      {line.name}
                    </h4>
                    {line.variantName && (
                      <span className="inline-block text-[11px] font-bold text-zinc-500 mt-0.5">
                        {line.variantName}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-zinc-900 tabular-nums shrink-0">
                    {formatCurrency(linePrice(line))}
                  </span>
                </div>

                {/* Modifier Pills */}
                {line.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {line.modifiers.map((m) => (
                      <span
                        key={m.id}
                        className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-semibold"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}

                {line.lineNote && (
                  <p className="text-[11px] text-zinc-400 italic">
                    &ldquo;{line.lineNote}&rdquo;
                  </p>
                )}

                {/* Stepper + Trash Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center rounded-xl border border-zinc-200 bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.key, line.quantity - 1)}
                      className="size-7 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-zinc-100 active:scale-90 transition-all cursor-pointer"
                    >
                      <MinusIcon className="size-3.5 stroke-[2.5]" />
                    </button>
                    <span className="w-8 text-center text-xs font-black tabular-nums text-zinc-900">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(line.key, line.quantity + 1)}
                      className="size-7 rounded-lg flex items-center justify-center text-zinc-600 hover:bg-zinc-100 active:scale-90 transition-all cursor-pointer"
                    >
                      <PlusIcon className="size-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveLine(line.key)}
                    className="size-8 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Ürünü Sil"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sheet Footer: Total + Sipariş Oluştur Button */}
          <div className="p-4 border-t border-dashed border-zinc-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-zinc-800">Toplam Tutar</span>
              <span className="text-lg font-black text-zinc-900 tabular-nums">
                {formatCurrency(cartGrandTotal)}
              </span>
            </div>

            <Button
              size="lg"
              disabled={busy || cartItems.length === 0}
              onClick={async () => {
                try {
                  const res = await onPlaceOrder();
                  if (res !== false) {
                    setOrderSummarySheetOpen(false);
                  }
                } catch {
                  // Keep open on error
                }
              }}
              className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {busy ? "Sipariş Oluşturuluyor…" : "Sipariş Oluştur"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ============================================================ */}
      {/* 10. FLOATING BOTTOM NAVIGATION BAR (Ana Sayfa / Kat / Profil) */}
      {/* ============================================================ */}
      <div className="fixed inset-x-0 bottom-4 z-40 px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0.5rem)]">
        <div className="mx-auto flex w-full max-w-md items-center justify-around rounded-3xl bg-white/95 backdrop-blur-xl p-2.5 shadow-2xl border border-zinc-200/90 pointer-events-auto">
          
          {/* Home Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all cursor-pointer",
              activeTab === "home" ? "font-black scale-105" : "text-zinc-400 font-bold hover:text-zinc-600",
            )}
            style={{ color: activeTab === "home" ? primaryColor : undefined }}
          >
            <HomeIcon className="size-5" />
            <span className="text-[10px]">Ana Sayfa</span>
          </button>

          {/* Categories Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all cursor-pointer",
              activeTab === "categories" ? "font-black scale-105" : "text-zinc-400 font-bold hover:text-zinc-600",
            )}
            style={{ color: activeTab === "categories" ? primaryColor : undefined }}
          >
            <LayoutGridIcon className="size-5" />
            <span className="text-[10px]">Kategoriler</span>
          </button>

          {/* Profile / Masa Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all cursor-pointer",
              activeTab === "profile" ? "font-black scale-105" : "text-zinc-400 font-bold hover:text-zinc-600",
            )}
            style={{ color: activeTab === "profile" ? primaryColor : undefined }}
          >
            <UserIcon className="size-5" />
            <span className="text-[10px]">Profil</span>
          </button>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 8. DETAILED FILTER BOTTOM SHEET DRAWER                       */}
      {/* ============================================================ */}
      <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-3xl p-0 overflow-hidden flex flex-col bg-[#fafafa]"
        >
          {/* Drawer Header */}
          <SheetHeader className="p-4 pb-3 border-b bg-white flex flex-row items-center justify-between space-y-0 text-left">
            <div>
              <SheetTitle className="text-base font-black text-zinc-900 flex items-center gap-2">
                <SlidersHorizontalIcon className="size-4 text-primary" style={{ color: primaryColor }} />
                <span>Filtreleme & Sıralama</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400 font-medium">
                Beslenme tercihi, alerjen veya kaloriye göre filtreleyin
              </SheetDescription>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 h-8 px-2 cursor-pointer gap-1"
              >
                <RotateCcwIcon className="size-3" />
                <span>Sıfırla</span>
              </Button>
            )}
          </SheetHeader>

          {/* Scrollable Filter Options Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* 1. Beslenme Tercihi */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-800 uppercase tracking-wider block">
                Beslenme Tercihi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDiet("ALL")}
                  className={cn(
                    "p-2.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer",
                    selectedDiet === "ALL"
                      ? "border-2 shadow-xs bg-white text-zinc-900"
                      : "border-zinc-200 bg-white/60 text-zinc-600 hover:bg-white",
                  )}
                  style={{
                    borderColor: selectedDiet === "ALL" ? primaryColor : undefined,
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🍽️</span>
                    <span>Tümü</span>
                  </span>
                  {selectedDiet === "ALL" && (
                    <CheckIcon className="size-3.5 stroke-[3]" style={{ color: primaryColor }} />
                  )}
                </button>

                {(["VEG", "NON_VEG", "EGG"] as const).map((diet) => {
                  const isSelected = selectedDiet === diet;
                  const badge = DIET_BADGES[diet];
                  return (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => setSelectedDiet(isSelected ? "ALL" : diet)}
                      className={cn(
                        "p-2.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer",
                        isSelected
                          ? "border-2 shadow-xs bg-white text-zinc-900"
                          : "border-zinc-200 bg-white/60 text-zinc-600 hover:bg-white",
                      )}
                      style={{
                        borderColor: isSelected ? primaryColor : undefined,
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                      {isSelected && (
                        <CheckIcon className="size-3.5 stroke-[3]" style={{ color: primaryColor }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Alerjen Dışlama */}
            {availableAllergens.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-zinc-800 uppercase tracking-wider block">
                    Alerjen İçermeyenler
                  </label>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    (Seçtikleriniz menüden gizlenir)
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
                          "px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95",
                          isExcluded
                            ? "bg-red-50 border-red-500 text-red-600 shadow-2xs font-black"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50",
                        )}
                      >
                        <span>{isExcluded ? "🚫" : alg.icon}</span>
                        <span>{alg.displayName}</span>
                        {isExcluded && <span className="text-[10px] font-bold">gizlendi</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Maksimum Kalori Sınırı */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-800 uppercase tracking-wider block">
                Maksimum Kalori
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Tümü", value: null },
                  { label: "≤ 300 kcal", value: 300 },
                  { label: "≤ 500 kcal", value: 500 },
                  { label: "≤ 750 kcal", value: 750 },
                ].map((opt) => {
                  const isSelected = maxCalories === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setMaxCalories(opt.value)}
                      className={cn(
                        "py-2 px-1.5 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer",
                        isSelected
                          ? "border-2 shadow-xs bg-white text-zinc-900"
                          : "border-zinc-200 bg-white/60 text-zinc-600 hover:bg-white",
                      )}
                      style={{
                        borderColor: isSelected ? primaryColor : undefined,
                        color: isSelected ? primaryColor : undefined,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Fiyat Sıralaması */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-800 uppercase tracking-wider block">
                Fiyat Sıralaması
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "DEFAULT", label: "Varsayılan", icon: "✨" },
                  { id: "ASC", label: "En Ucuz", icon: "📉" },
                  { id: "DESC", label: "En Pahalı", icon: "📈" },
                ].map((sort) => {
                  const isSelected = priceSort === sort.id;
                  return (
                    <button
                      key={sort.id}
                      type="button"
                      onClick={() => setPriceSort(sort.id as "DEFAULT" | "ASC" | "DESC")}
                      className={cn(
                        "py-2.5 px-2 rounded-2xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer",
                        isSelected
                          ? "border-2 shadow-xs bg-white text-zinc-900"
                          : "border-zinc-200 bg-white/60 text-zinc-600 hover:bg-white",
                      )}
                      style={{
                        borderColor: isSelected ? primaryColor : undefined,
                        color: isSelected ? primaryColor : undefined,
                      }}
                    >
                      <span className="text-base">{sort.icon}</span>
                      <span>{sort.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Sheet Footer Action */}
          <div className="p-4 border-t bg-white flex items-center gap-3">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="rounded-2xl font-black text-xs h-12 px-4 cursor-pointer"
            >
              Temizle
            </Button>
            <Button
              onClick={() => setFilterDrawerOpen(false)}
              className="flex-1 h-12 rounded-2xl font-black text-xs text-white shadow-md active:scale-95 transition-transform cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {`Filtrelenmiş Ürünleri Gör (${applyFilters(menu.items).length})`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ============================================================ */}
      {/* FAVORİLERİM ÇEKMECESİ / PANELİ                               */}
      {/* ============================================================ */}
      <Sheet open={favoritesDrawerOpen} onOpenChange={setFavoritesDrawerOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] rounded-t-3xl p-0 overflow-hidden flex flex-col bg-zinc-50"
        >
          <SheetHeader className="p-4 pb-3 border-b text-left bg-white flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <HeartIcon className="size-4.5 fill-red-500" />
              </div>
              <div>
                <SheetTitle className="text-base font-black text-zinc-900">
                  Favorilerim
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400 font-medium">
                  {evaluatedFavorites.length > 0
                    ? `${evaluatedFavorites.length} kayıtlı lezzetiniz var`
                    : "Henüz favori lezzet eklemediniz"}
                </SheetDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFavoritesDrawerOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
            >
              <XIcon className="size-5" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {evaluatedFavorites.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="size-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center text-2xl shadow-inner">
                  ❤️
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-zinc-900">Favori Listeniz Boş</h4>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Menüdeki ürünlerin yanındaki kalp ikonuna tıklayarak en sevdiğiniz lezzetleri buraya kaydedebilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              evaluatedFavorites.map((fav) => {
                return (
                  <div
                    key={fav.id}
                    className={cn(
                      "bg-white rounded-3xl p-3.5 border transition-all flex items-center justify-between gap-3 shadow-2xs",
                      !fav.isAvailable
                        ? "opacity-75 bg-zinc-100/90 border-dashed border-red-200"
                        : "border-zinc-200/80 hover:border-zinc-300"
                    )}
                  >
                    {/* Item Image */}
                    <div className="relative size-16 rounded-2xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100">
                      {fav.imageUrl ? (
                        <Image
                          src={fav.imageUrl}
                          alt={fav.name}
                          fill
                          className={cn("object-cover", !fav.isAvailable && "grayscale")}
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-xs sm:text-sm text-zinc-900 truncate">
                          {fav.name}
                        </h4>
                        {!fav.isAvailable && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-700 border border-red-200">
                            ⚠️ Üzgünüz, artık mevcut değil
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-900 tabular-nums">
                          {formatCurrency(fav.menuItem ? fav.menuItem.price : fav.price)}
                        </span>
                      </div>
                    </div>

                    {/* Action: Add to Cart or Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {fav.isAvailable && fav.menuItem ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleItemAddClick(fav.menuItem!);
                            setFavoritesDrawerOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-xl font-black text-xs text-white shadow-2xs active:scale-95 transition-transform cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Ekle +
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveFavId(fav.id)}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2Icon className="size-3.5" />
                          <span>Kaldır</span>
                        </button>
                      )}

                      {/* Remove from favorites heart button */}
                      <button
                        type="button"
                        onClick={() => removeFavoriteById(fav.id, fav.name)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Favorilerden Çıkar"
                      >
                        <HeartIcon className="size-4 fill-red-500 text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* FAVORİ SİLME ONAY MODALI */}
      <Dialog open={Boolean(confirmRemoveFavId)} onOpenChange={(open) => !open && setConfirmRemoveFavId(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-xs rounded-3xl p-5 text-center space-y-3 border border-zinc-200 shadow-2xl"
        >
          <div className="size-12 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-xl shadow-inner">
            <Trash2Icon className="size-6" />
          </div>
          <DialogTitle className="text-base font-black text-zinc-900">
            Favorilerden Kaldırılsın mı?
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Bu ürün artık mevcut değil veya menüden kaldırılmış. Favori listenizden kaldırmak istiyor musunuz?
          </DialogDescription>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRemoveFavId(null)}
              className="h-10 rounded-2xl font-bold text-xs cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              onClick={() => confirmRemoveFavId && removeFavoriteById(confirmRemoveFavId)}
              className="h-10 rounded-2xl font-black text-xs text-white bg-red-600 hover:bg-red-700 shadow-md cursor-pointer active:scale-95"
            >
              Evet, Kaldır
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
