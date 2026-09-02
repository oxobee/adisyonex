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
  SearchIcon,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  QrHomeSection,
  QrSliderItem,
} from "@/services/restaurant-settings.service";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";
import type { GuestOrderSummaryDTO } from "@/types/order";
import type { CartLine } from "@/components/pos/types";

export interface CustomModifierItem {
  readonly groupId: string;
  readonly groupName: string;
  readonly optionId: string;
  readonly optionName: string;
  readonly price: number;
}

export interface Theme2QsrViewProps {
  readonly restaurantName: string;
  readonly logoUrl?: string | null;
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
  readonly onPlaceOrder: () => Promise<void>;
  readonly onRequestBill: () => Promise<void>;
  readonly myOrders: readonly GuestOrderSummaryDTO[];
  readonly busy?: boolean;
}

export function Theme2QsrView({
  restaurantName,
  logoUrl,
  tableLabel,
  menu,
  primaryColor = "#FF5500",
  secondaryColor = "#FFF7ED",
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
  myOrders,
  busy,
}: Theme2QsrViewProps) {
  // Navigation Tabs: 'home' | 'categories' | 'cart' | 'profile'
  const [activeTab, setActiveTab] = useState<"home" | "categories" | "cart" | "profile">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Details State
  const [detailItem, setDetailItem] = useState<MenuItemDTO | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState("");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

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
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
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

    toast.success(`${detailItem.name} sepete eklendi!`, {
      description: `${detailQty} adet sepetinize ilave edildi.`,
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
                  <Image src={logoUrl} alt={restaurantName} fill className="object-cover" sizes="40px" unoptimized />
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

              {myOrders.length > 0 && (
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
                    {myOrders.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

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
                      unoptimized
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
                <span className={cn("text-[11px] font-bold text-zinc-700 truncate max-w-[64px]")}>
                  Tümü
                </span>
              </button>

              {categories.map((c) => {
                const isSelected = selectedCategory === c.id;
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
                      🍔
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 truncate max-w-[64px]">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Customizable Home Sections (Liste, 2'li Kart Grid, Yatay Slider) */}
          <div className="space-y-6 pt-1">
            {resolvedHomeSections.map((sec) => {
              // Find items for this section
              let sectionItems: MenuItemDTO[] = [];
              if (sec.type === "category") {
                sectionItems = menu.items.filter(
                  (it) => it.isActive && it.categoryId === sec.categoryId,
                );
              } else if (sec.type === "custom") {
                const itemMap = new Map(menu.items.map((i) => [i.id, i]));
                sectionItems = (sec.itemIds || [])
                  .map((id) => itemMap.get(id))
                  .filter((it): it is MenuItemDTO => Boolean(it && it.isActive));
              }

              // Apply search query filter if user is searching
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                sectionItems = sectionItems.filter((it) =>
                  it.name.toLowerCase().includes(q),
                );
              }

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
                          setActiveTab("categories");
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
                                  unoptimized
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAdd(item);
                                    toast.success(`${item.name} eklendi!`);
                                  }}
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
                                    unoptimized
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickAdd(item);
                                  toast.success(`${item.name} eklendi!`);
                                }}
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
                              {/* Top Photo */}
                              <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                                {photo ? (
                                  <Image
                                    src={photo.url}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="140px"
                                    unoptimized
                                  />
                                ) : (
                                  <span className="text-3xl">🍕</span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavorite(item.id, e)}
                                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-zinc-400 hover:text-red-500 shadow-xs transition-colors"
                                >
                                  <HeartIcon
                                    className={cn(
                                      "size-3",
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
                            </div>

                            <div className="flex items-center justify-between pt-2 mt-1 border-t border-zinc-100">
                              <span
                                className="font-black text-xs tabular-nums"
                                style={{ color: primaryColor }}
                              >
                                {formatCurrency(item.price)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickAdd(item);
                                  toast.success(`${item.name} eklendi!`);
                                }}
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
                          <Image src={photo.url} alt={line.name} fill className="object-cover" sizes="64px" unoptimized />
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
      {/* 4. PROFILE / ORDERS SCREEN                                   */}
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
            <h2 className="text-base font-black text-zinc-900">Masa Durumu & Hesap</h2>
            <div className="size-8" />
          </div>

          <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-4 text-center">
            <div className="size-16 mx-auto rounded-3xl flex items-center justify-center text-3xl shadow-inner" style={{ backgroundColor: secondaryColor }}>
              🍽️
            </div>
            <div>
              <h3 className="font-black text-lg text-zinc-900">{tableLabel}</h3>
              <p className="text-xs text-zinc-500">{restaurantName}</p>
            </div>

            <div className="pt-2 border-t flex flex-col gap-2.5">
              <Button
                variant="outline"
                onClick={onRequestBill}
                className="rounded-2xl font-black text-xs h-11 border-zinc-300 cursor-pointer"
              >
                Garson Çağır / Hesap İste 🛎️
              </Button>
            </div>
          </div>

          {/* Past / Live Orders List */}
          {myOrders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">Verilen Siparişler ({myOrders.length})</h3>
              {myOrders.map((ord) => (
                <div key={ord.id} className="bg-white rounded-3xl p-4 border border-zinc-200/80 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-zinc-400">#{ord.id.slice(-6)}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-black text-[10px]">
                      {ord.status}
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {ord.lines.map((l, idx) => (
                      <div key={idx} className="py-1 flex justify-between">
                        <span>{l.quantity}x {l.name} {l.variantName ? `(${l.variantName})` : ""}</span>
                        <span className="font-bold text-zinc-400 text-[10px]">{l.state}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-1.5 flex justify-between font-black text-sm text-zinc-900">
                    <span>Toplam</span>
                    <span style={{ color: primaryColor }}>{formatCurrency(ord.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MEAL DETAILS MODAL (Görseldeki Meal Details Ekranı)        */}
      {/* ============================================================ */}
      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-md max-h-[92vh] p-0 overflow-y-auto rounded-3xl border-2 border-zinc-200 shadow-2xl flex flex-col justify-between">
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
                    sizes="400px"
                    unoptimized
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-7xl bg-zinc-100">
                    🍔
                  </div>
                )}

                {/* Back & Heart Overlays */}
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="absolute top-4 left-4 size-9 rounded-2xl bg-white/90 backdrop-blur-md text-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                >
                  <ArrowLeftIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(detailItem.id)}
                  className="absolute top-4 right-4 size-9 rounded-2xl bg-white/90 backdrop-blur-md text-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                >
                  <HeartIcon className={cn("size-4", favorites[detailItem.id] && "fill-red-500 text-red-500")} />
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
                  <span>Sepete Ekle 🛍️</span>
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
            <DialogTitle className="text-base font-black text-zinc-900">Sipariş Onayı</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            {/* Table Address Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="font-bold text-zinc-400 text-[10px] uppercase">Masa Bilgisi</span>
              <h4 className="font-black text-sm text-zinc-900">{tableLabel}</h4>
              <p className="text-zinc-500">{restaurantName}</p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="font-bold text-zinc-400 text-[10px] uppercase">Ödeme Şekli</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("WAITER")}
                  className={cn(
                    "p-2.5 rounded-2xl border text-center font-bold text-[11px] transition-all cursor-pointer",
                    paymentMethod === "WAITER" ? "border-2 bg-primary/10 text-primary font-black" : "border-zinc-200 bg-white text-zinc-700",
                  )}
                  style={{
                    borderColor: paymentMethod === "WAITER" ? primaryColor : undefined,
                    color: paymentMethod === "WAITER" ? primaryColor : undefined,
                  }}
                >
                  🛎️ Garsona Öde
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={cn(
                    "p-2.5 rounded-2xl border text-center font-bold text-[11px] transition-all cursor-pointer",
                    paymentMethod === "CARD" ? "border-2 bg-primary/10 text-primary font-black" : "border-zinc-200 bg-white text-zinc-700",
                  )}
                  style={{
                    borderColor: paymentMethod === "CARD" ? primaryColor : undefined,
                    color: paymentMethod === "CARD" ? primaryColor : undefined,
                  }}
                >
                  💳 Kredi Kartı
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={cn(
                    "p-2.5 rounded-2xl border text-center font-bold text-[11px] transition-all cursor-pointer",
                    paymentMethod === "CASH" ? "border-2 bg-primary/10 text-primary font-black" : "border-zinc-200 bg-white text-zinc-700",
                  )}
                  style={{
                    borderColor: paymentMethod === "CASH" ? primaryColor : undefined,
                    color: paymentMethod === "CASH" ? primaryColor : undefined,
                  }}
                >
                  💵 Nakit
                </button>
              </div>
            </div>

            {/* Total Recap */}
            <div className="p-3 rounded-2xl bg-zinc-100 flex justify-between items-center font-black text-sm">
              <span>Toplam Ödeme:</span>
              <span style={{ color: primaryColor }}>{formatCurrency(cartGrandTotal)}</span>
            </div>

            <Button
              size="lg"
              disabled={busy}
              onClick={handleFinalCheckout}
              className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {busy ? "İletiliyor…" : "Siparişi Mutfağa İlet ✓"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 7. ORDER CELEBRATION MODAL (Görseldeki Order Done Ekranı)    */}
      {/* ============================================================ */}
      <Dialog open={orderSuccessOpen} onOpenChange={setOrderSuccessOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-6 text-center space-y-4">
          <div className="flex flex-col items-center gap-3">
            {/* Animated Heart Eyes Emoji */}
            <div className="size-20 rounded-full flex items-center justify-center text-5xl bg-amber-500/10 shadow-inner animate-bounce duration-700">
              😍
            </div>

            <DialogTitle className="text-lg font-black text-zinc-900 leading-tight">
              Tebrikler! 🎉
            </DialogTitle>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Siparişiniz başarıyla alındı ve mutfağa iletildi.
            </p>

            <Button
              className="w-full h-11 rounded-2xl font-black text-xs text-white shadow-md cursor-pointer mt-2"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                setOrderSuccessOpen(false);
                setActiveTab("profile");
              }}
            >
              Harika, Menüye Dön
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 8. FLOATING BOTTOM NAVIGATION BAR (Görseldeki Alt Çubuk)     */}
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

          {/* Cart Tab with Badge */}
          <button
            type="button"
            onClick={() => setActiveTab("cart")}
            className={cn(
              "relative flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all cursor-pointer",
              activeTab === "cart" ? "font-black scale-105" : "text-zinc-400 font-bold hover:text-zinc-600",
            )}
            style={{ color: activeTab === "cart" ? primaryColor : undefined }}
          >
            <div className="relative">
              <ShoppingBagIcon className="size-5" />
              {cartItemCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full text-white text-[9px] font-black shadow-xs animate-pulse"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Sepetim</span>
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
            <span className="text-[10px]">Masa</span>
          </button>

        </div>
      </div>

    </div>
  );
}
