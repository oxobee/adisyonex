"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  BotIcon,
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  UtensilsIcon,
  XIcon,
  MinusIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  askGuestAiAction,
  type GuestAiMessage,
  type RecommendedProductDTO,
} from "@/actions/guest-ai.actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuDTO, MenuItemDTO } from "@/types/menu";

export interface CustomModifierItem {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CustomLineInput {
  item: MenuItemDTO;
  quantity: number;
  variantId?: string | null;
  modifierItems?: CustomModifierItem[];
  notes?: string;
}

/**
 * Ultra-modern, radiant AI Sparkle icon with organic 4-point star & satellite accent sparkles
 */
export function AiSparkleIcon({
  className = "size-6",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Central 4-pointed radiant star with organic curved rays */}
      <path d="M12 1.5C12 7.29899 7.29899 12 1.5 12C7.29899 12 12 16.701 12 22.5C12 16.701 16.701 12 22.5 12C16.701 12 12 7.29899 12 1.5Z" />
      {/* Accent sparkle top right */}
      <path
        d="M19.5 1.5C19.5 3.70914 17.7091 5.5 15.5 5.5C17.7091 5.5 19.5 7.29086 19.5 9.5C19.5 7.29086 21.2909 5.5 23.5 5.5C21.2909 5.5 19.5 3.70914 19.5 1.5Z"
        opacity="0.9"
      />
      {/* Satellite micro sparkle bottom left */}
      <path
        d="M5 16C5 17.3807 3.88071 18.5 2.5 18.5C3.88071 18.5 5 19.6193 5 21C5 19.6193 6.11929 18.5 7.5 18.5C6.11929 18.5 5 17.3807 5 16Z"
        opacity="0.8"
      />
    </svg>
  );
}

export interface GuestAiAssistantProps {
  readonly username: string;
  readonly tableId?: string;
  readonly restaurantName: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly menu: MenuDTO;
  readonly onQuickAdd: (item: MenuItemDTO) => void;
  readonly onAddCustomLine?: (line: CustomLineInput) => void;
  readonly enabled?: boolean;
  readonly isOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly hideFloatingTrigger?: boolean;
}

interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly recommendedProducts?: readonly RecommendedProductDTO[];
  readonly suggestedPrompts?: readonly string[];
  readonly timestamp: string;
}

export function GuestAiAssistant({
  username,
  tableId,
  restaurantName,
  primaryColor = "#FF5500",
  secondaryColor = "#FFF7ED",
  menu,
  onQuickAdd,
  onAddCustomLine,
  enabled = true,
  isOpen: externalIsOpen,
  onOpenChange,
  hideFloatingTrigger = false,
}: GuestAiAssistantProps) {
  if (!enabled) return null;

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    }
    setInternalOpen(open);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-greeting",
      role: "assistant",
      content: `Merhaba! Ben **${restaurantName}** Yapay Zeka Menü Danışmanınızım. Menümüzdeki lezzetler, şefin imza yemekleri, glutensiz/özel beslenme seçenekleri veya içecek eşleştirmeleri hakkında bana danışabilirsiniz.`,
      suggestedPrompts: [
        "👨‍🍳 Şefin özel tavsiyesi nedir?",
        "🌾 Glutensiz ne önerirsin?",
        "⭐ En popüler lezzetler hangileri?",
        "🍰 Hafif bir tatlı önerir misin?",
      ],
      timestamp: "Şimdi",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Elastic Customization Bottom Sheet State
  const [customizingItem, setCustomizingItem] = useState<MenuItemDTO | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [customItemNote, setCustomItemNote] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend ?? inputQuery).trim();
    if (!q || isPending) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");

    startTransition(async () => {
      const historyPayload: GuestAiMessage[] = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askGuestAiAction({
        username,
        tableId,
        query: q,
        chatHistory: historyPayload,
      });

      if (res.success && res.data) {
        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: res.data.reply,
          recommendedProducts: res.data.recommendedProducts,
          suggestedPrompts: res.data.suggestedPrompts,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: res.error || "Şu an yanıt oluşturulamadı. Lütfen tekrar deneyiniz.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    });
  };

  const handleProductSelect = (prod: RecommendedProductDTO) => {
    const fullItem = menu.items.find((it) => it.id === prod.id);
    if (!fullItem) {
      toast.error("Ürün detayına ulaşılamadı.");
      return;
    }

    const hasOptions =
      (fullItem.variants && fullItem.variants.length > 0) ||
      (fullItem.modifierGroups && fullItem.modifierGroups.length > 0);

    if (hasOptions) {
      setCustomizingItem(fullItem);
      setSelectedVariantId(fullItem.variants[0]?.id || null);
      setSelectedModifiers([]);
      setCustomQuantity(1);
      setCustomItemNote("");
    } else {
      onQuickAdd(fullItem);
      setAddedItemIds((prev) => ({ ...prev, [prod.id]: true }));
      toast.success(`${prod.name} sepete eklendi!`, {
        description: `${formatCurrency(prod.price)} tutarındaki ürün sipariş listenize ilave edildi.`,
      });
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [prod.id]: false }));
      }, 2500);
    }
  };

  const handleConfirmCustomItem = () => {
    if (!customizingItem) return;

    for (const group of customizingItem.modifierGroups) {
      const isRequired = group.isRequired || group.minSelect > 0;
      if (isRequired) {
        const selectedCount = group.modifiers.filter((m) => selectedModifiers.includes(m.id)).length;
        if (selectedCount === 0) {
          toast.error(`Lütfen "${group.name}" seçimini yapınız.`);
          return;
        }
      }
    }

    const modifierItemsList: CustomModifierItem[] = [];
    for (const group of customizingItem.modifierGroups) {
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

    if (onAddCustomLine) {
      onAddCustomLine({
        item: customizingItem,
        quantity: customQuantity,
        variantId: selectedVariantId,
        modifierItems: modifierItemsList,
        notes: customItemNote.trim() || undefined,
      });
    } else {
      onQuickAdd(customizingItem);
    }

    const itemId = customizingItem.id;
    setAddedItemIds((prev) => ({ ...prev, [itemId]: true }));
    toast.success(`${customizingItem.name} sepete eklendi!`, {
      description: `${customQuantity} adet ürün özelleştirmeleriyle birlikte eklendi.`,
    });
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [itemId]: false }));
    }, 2500);

    setCustomizingItem(null);
  };

  return (
    <>
      {/* FIXED FLOATING TRIGGER (Görsel ve Pozisyon Olarak Sabitlenmiş, Sürüklenmeyen Şık Buton) */}
      {!hideFloatingTrigger && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Yapay Zeka Menü Danışmanı"
          className={cn(
            "fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 group",
            "flex items-center gap-2.5 p-1.5 pr-4 rounded-full",
            "bg-zinc-950/95 hover:bg-zinc-900 text-white backdrop-blur-xl",
            "border border-white/15 shadow-2xl shadow-black/40",
            "hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none",
          )}
        >
          {/* Animated Glow Aura & Orb */}
          <div className="relative size-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-md ring-2 ring-white/20">
            <div
              className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, #ec4899 50%, #8b5cf6 100%)`,
              }}
            />
            {/* Ambient shimmer */}
            <span className="absolute inset-0 bg-gradient-to-t from-transparent via-white/25 to-transparent animate-pulse" />
            <AiSparkleIcon className="size-5.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] relative z-10" />
            {/* Live Indicator */}
            <span className="absolute top-1 right-1 flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500 border border-white/60" />
            </span>
          </div>

          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-black tracking-tight text-white flex items-center gap-1">
              <span>AI Asistan</span>
              <span className="text-[10px] text-amber-300">✨</span>
            </span>
            <span className="text-[10px] font-medium text-zinc-400 leading-none">
              Menü Rehberi
            </span>
          </div>
        </button>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-[88dvh] max-h-[88dvh] sm:max-w-md sm:mx-auto rounded-t-3xl p-0 flex flex-col bg-background overflow-hidden border-t gap-0 z-50 shadow-2xl"
        >
          <div
            className="w-full flex justify-center pt-2.5 pb-1 shrink-0 bg-card cursor-pointer active:opacity-60 select-none"
            onClick={() => setIsOpen(false)}
            title="Kapatmak için dokunun veya çekin"
          >
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
          </div>

          <div className="sticky top-0 z-30 px-4 py-2.5 border-b bg-card/95 backdrop-blur-md flex flex-row items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="size-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #ec4899 50%, #8b5cf6 100%)`,
                }}
              >
                <AiSparkleIcon className="size-5.5 text-white drop-shadow-xs relative z-10" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-sm font-black text-foreground flex items-center gap-1.5">
                  <span className="truncate">Menü Danışmanı AI</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider shrink-0">
                    Canlı
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {restaurantName} • Akıllı Sipariş & Alerjen Rehberi
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="size-9 rounded-full bg-muted/90 hover:bg-muted active:scale-90 text-foreground flex items-center justify-center transition-all cursor-pointer shadow-xs border border-border shrink-0 ml-2"
              aria-label="Pencereyi Kapat"
            >
              <XIcon className="size-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-2 max-w-[88%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                      : "bg-card border border-border/80 text-foreground rounded-bl-xs",
                  )}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="w-full space-y-2.5 mt-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <UtensilsIcon className="size-3 text-primary" />
                      Önerilen Ürünler
                    </span>

                    <div className="grid grid-cols-1 gap-2 w-full">
                      {msg.recommendedProducts.map((prod) => {
                        const isAdded = addedItemIds[prod.id];
                        const fullItem = menu.items.find((it) => it.id === prod.id);
                        const hasOptions =
                          (fullItem?.variants && fullItem.variants.length > 0) ||
                          (fullItem?.modifierGroups && fullItem.modifierGroups.length > 0);

                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleProductSelect(prod)}
                            className="bg-card border border-border rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-all cursor-pointer active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {prod.imageUrl ? (
                                <div className="relative size-14 rounded-xl overflow-hidden bg-muted shrink-0 border">
                                  <Image
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="size-14 rounded-xl bg-muted/60 border flex items-center justify-center text-xl shrink-0">
                                  🍽️
                                </div>
                              )}

                              <div className="min-w-0 text-left">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-black text-xs text-foreground truncate">
                                    {prod.name}
                                  </h4>
                                  {prod.isChefSpecial && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                                      Şefin Seçimi
                                    </span>
                                  )}
                                  {prod.isAiFeatured && !prod.isChefSpecial && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase">
                                      Öne Çıkan
                                    </span>
                                  )}
                                </div>

                                {prod.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {prod.description}
                                  </p>
                                )}

                                <span className="font-black text-xs text-primary block mt-1">
                                  {formatCurrency(prod.price)}
                                </span>
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductSelect(prod);
                              }}
                              className={cn(
                                "h-9 px-3 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer shadow-xs gap-1",
                                isAdded
                                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                                  : "bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95",
                              )}
                            >
                              {isAdded ? (
                                <>
                                  <CheckIcon className="size-3.5 stroke-[3]" />
                                  <span>Eklendi</span>
                                </>
                              ) : hasOptions ? (
                                <>
                                  <SlidersHorizontalIcon className="size-3.5 stroke-[2.5]" />
                                  <span>Seçenekler</span>
                                </>
                              ) : (
                                <>
                                  <PlusIcon className="size-3.5 stroke-[3]" />
                                  <span>Sepete Ekle</span>
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {msg.suggestedPrompts.map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => handleSend(promptText)}
                        className="px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 border border-border/70 text-[11px] font-semibold text-foreground transition-all cursor-pointer active:scale-95 text-left"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-muted-foreground/60 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-2xl w-fit border border-border/60 animate-pulse">
                <Loader2Icon className="size-4 animate-spin text-primary" />
                <span>Menü inceleniyor ve yanıt hazırlanıyor…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t bg-card shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Örn: Glutensiz ne önerirsin?, Şefin tavsiyesi..."
                disabled={isPending}
                className="flex-1 h-11 px-4 rounded-2xl bg-muted/60 border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <Button
                type="submit"
                disabled={!inputQuery.trim() || isPending}
                className="size-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SendIcon className="size-4" />
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {customizingItem && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <div
            onClick={() => setCustomizingItem(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          <div
            className={cn(
              "relative z-10 w-full sm:max-w-md sm:mx-auto bg-card rounded-t-[32px] shadow-2xl border-t border-border flex flex-col max-h-[85dvh] overflow-hidden",
              "animate-in slide-in-from-bottom duration-400",
            )}
            style={{
              animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div
              className="w-full flex justify-center pt-2.5 pb-1 shrink-0 cursor-pointer"
              onClick={() => setCustomizingItem(null)}
            >
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
            </div>

            {/* Customization Header */}
            {(() => {
              const customImage =
                customizingItem.images?.find((img) => img.isPrimary)?.url ||
                customizingItem.images?.[0]?.url;
              const customDesc =
                customizingItem.shortDescription || customizingItem.longDescription;

              return (
                <div className="px-5 py-3 border-b flex items-start justify-between gap-3 shrink-0 bg-card">
                  <div className="flex items-start gap-3 min-w-0">
                    {customImage ? (
                      <div className="relative size-14 rounded-2xl overflow-hidden bg-muted shrink-0 border">
                        <Image
                          src={customImage}
                          alt={customizingItem.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="size-14 rounded-2xl bg-muted/60 border flex items-center justify-center text-2xl shrink-0">
                        🍽️
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-base text-foreground truncate">
                          {customizingItem.name}
                        </h3>
                        {customizingItem.isChefSpecial && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                            Şefin Seçimi
                          </span>
                        )}
                        {customizingItem.isAiFeatured && !customizingItem.isChefSpecial && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                            Öne Çıkan
                          </span>
                        )}
                      </div>
                      {customDesc && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {customDesc}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCustomizingItem(null)}
                    className="size-8 rounded-full bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              );
            })()}

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
              {customizingItem.variants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Porsiyon / Boyut Seçimi
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      1 Zorunlu Seçim
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {customizingItem.variants.map((v) => {
                      const isSelected = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                            isSelected
                              ? "border-2 bg-primary/5 text-foreground shadow-xs"
                              : "border-border bg-card hover:bg-muted/40 text-muted-foreground",
                          )}
                          style={{
                            borderColor: isSelected ? primaryColor : undefined,
                          }}
                        >
                          <span className="font-black text-xs text-foreground">{v.name}</span>
                          <span className="font-mono font-bold text-xs" style={{ color: primaryColor }}>
                            {formatCurrency(v.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {customizingItem.modifierGroups.map((group) => {
                const isSingle = group.maxSelect === 1;
                const isRequired = group.isRequired || group.minSelect > 0;
                const groupSelected = group.modifiers.filter((m) => selectedModifiers.includes(m.id));

                return (
                  <div key={group.id} className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-xs text-foreground">{group.name}</h4>
                        <span className="text-[10px] text-muted-foreground block">
                          {isSingle
                            ? "1 seçim yapınız"
                            : group.maxSelect > 1
                            ? `En fazla ${group.maxSelect} adet seçilebilir`
                            : "İsteğe bağlı"}
                        </span>
                      </div>
                      {isRequired ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-black text-[9px]">
                          Zorunlu
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold text-[9px]">
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
                              if (isSingle) {
                                const groupIds = group.modifiers.map((m) => m.id);
                                setSelectedModifiers((prev) => [
                                  ...prev.filter((id) => !groupIds.includes(id)),
                                  ...(isChecked ? [] : [opt.id]),
                                ]);
                              } else {
                                if (isChecked) {
                                  setSelectedModifiers((prev) => prev.filter((id) => id !== opt.id));
                                } else {
                                  if (group.maxSelect > 0 && groupSelected.length >= group.maxSelect) {
                                    toast.info(`Bu gruptan en fazla ${group.maxSelect} adet seçebilirsiniz.`);
                                    return;
                                  }
                                  setSelectedModifiers((prev) => [...prev, opt.id]);
                                }
                              }
                            }}
                            className={cn(
                              "w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer",
                              isChecked
                                ? "border-2 bg-card text-foreground shadow-xs"
                                : "border-border/60 bg-card/60 text-muted-foreground hover:bg-card",
                            )}
                            style={{
                              borderColor: isChecked ? primaryColor : undefined,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "size-4 rounded-md flex items-center justify-center border transition-all",
                                  isSingle ? "rounded-full" : "rounded-md",
                                  isChecked ? "text-white" : "border-muted-foreground/40 bg-muted/40",
                                )}
                                style={{
                                  backgroundColor: isChecked ? primaryColor : undefined,
                                  borderColor: isChecked ? primaryColor : undefined,
                                }}
                              >
                                {isChecked && <CheckIcon className="size-3 stroke-[3]" />}
                              </div>
                              <span className={isChecked ? "text-foreground font-black" : "text-foreground"}>
                                {opt.name}
                              </span>
                            </div>

                            <span
                              className="font-mono font-black text-[11px]"
                              style={{ color: isChecked ? primaryColor : undefined }}
                            >
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

              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground">Sipariş Miktarı</span>
                  <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setCustomQuantity((q) => Math.max(1, q - 1))}
                      className="size-8 rounded-lg bg-muted/60 hover:bg-muted font-black text-sm flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                    >
                      <MinusIcon className="size-3.5 stroke-[3]" />
                    </button>
                    <span className="font-mono font-black text-sm min-w-5 text-center">
                      {customQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomQuantity((q) => q + 1)}
                      className="size-8 rounded-lg bg-muted/60 hover:bg-muted font-black text-sm flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                    >
                      <PlusIcon className="size-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    Özel Not (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={customItemNote}
                    onChange={(e) => setCustomItemNote(e.target.value)}
                    placeholder="Örn: Az tuzlu olsun, sosu ayrı servis edilsin..."
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-card sticky bottom-0 flex items-center justify-between gap-4 shrink-0 shadow-lg">
              {(() => {
                const selVariant = customizingItem.variants.find((v) => v.id === selectedVariantId);
                const base = selVariant ? selVariant.price : customizingItem.price;
                const modsDelta = customizingItem.modifierGroups.reduce((acc, g) => {
                  return (
                    acc +
                    g.modifiers
                      .filter((m) => selectedModifiers.includes(m.id))
                      .reduce((sum, m) => sum + Number(m.priceDelta || 0), 0)
                  );
                }, 0);
                const totalUnit = base + modsDelta;
                const grandTotal = totalUnit * customQuantity;

                return (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block">Toplam:</span>
                      <span className="font-black text-lg text-foreground font-mono tabular-nums">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={handleConfirmCustomItem}
                      className="flex-1 h-12 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-transform cursor-pointer gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <PlusIcon className="size-4 stroke-[3]" />
                      <span>Sepete Ekle 🛍️</span>
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
