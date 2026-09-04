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

interface GuestAiAssistantProps {
  readonly username: string;
  readonly tableId?: string;
  readonly restaurantName: string;
  readonly primaryColor?: string;
  readonly secondaryColor?: string;
  readonly menu: MenuDTO;
  readonly onQuickAdd: (item: MenuItemDTO) => void;
  readonly enabled?: boolean;
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
  enabled = true,
}: GuestAiAssistantProps) {
  if (!enabled) return null;

  const [isOpen, setIsOpen] = useState(false);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Draggable FAB state with touch & pointer capture
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("adisyon_guest_ai_fab_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const maxX = window.innerWidth - 64;
          const maxY = window.innerHeight - 64;
          setPosition({
            x: Math.min(Math.max(12, parsed.x), maxX),
            y: Math.min(Math.max(12, parsed.y), maxY),
          });
          return;
        }
      }
    } catch {}

    // Default position: bottom-right above mobile navigation bar
    const defaultX = Math.max(12, window.innerWidth - 72);
    const defaultY = Math.max(12, window.innerHeight - 150);
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = false;
    const currentX = position ? position.x : window.innerWidth - 72;
    const currentY = position ? position.y : window.innerHeight - 150;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartRef.current.startX === 0 && dragStartRef.current.startY === 0) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    if (Math.hypot(deltaX, deltaY) > 5) {
      isDraggingRef.current = true;
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;
      const newX = Math.min(Math.max(12, dragStartRef.current.posX + deltaX), maxX);
      const newY = Math.min(Math.max(12, dragStartRef.current.posY + deltaY), maxY);
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (isDraggingRef.current) {
      if (position) {
        sessionStorage.setItem("adisyon_guest_ai_fab_pos", JSON.stringify(position));
      }
      isDraggingRef.current = false;
    } else {
      // Clean tap -> open chat drawer WITHOUT auto-focusing input to avoid keyboard jump
      setIsOpen(true);
    }
    dragStartRef.current = { startX: 0, startY: 0, posX: 0, posY: 0 };
  };

  // Scroll to bottom when messages update
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

  const handleAddProductToCart = (prod: RecommendedProductDTO) => {
    const fullItem = menu.items.find((it) => it.id === prod.id);
    if (fullItem) {
      onQuickAdd(fullItem);
      setAddedItemIds((prev) => ({ ...prev, [prod.id]: true }));
      toast.success(`${prod.name} sepete eklendi!`, {
        description: `${formatCurrency(prod.price)} tutarındaki ürün sipariş listenize ilave edildi.`,
      });
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [prod.id]: false }));
      }, 2500);
    } else {
      toast.error("Ürün detayına ulaşılamadı.");
    }
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. FLOATING DRAGGABLE FAB (Icon Only - Press & Hold Draggable) */}
      {/* ============================================================ */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Yapay Zeka Menü Danışmanı"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: "fixed",
          left: position ? `${position.x}px` : "auto",
          top: position ? `${position.y}px` : "auto",
          right: position ? "auto" : "18px",
          bottom: position ? "auto" : "110px",
          touchAction: "none",
          zIndex: 49,
        }}
        className={cn(
          "size-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing",
          "shadow-xl hover:shadow-2xl active:scale-95 transition-shadow select-none",
          "ring-4 ring-white/60 dark:ring-black/40",
        )}
      >
        <div
          className="size-full rounded-full flex items-center justify-center text-white relative overflow-hidden shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, #ea580c 50%, #c2410c 100%)`,
          }}
        >
          {/* Subtle Ambient Pulse Ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" />
          <SparklesIcon className="size-6 text-white stroke-[2.2] drop-shadow-xs relative z-10 animate-pulse" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CHAT DRAWER / SHEET (No Auto-Focus Virtual Keyboard)       */}
      {/* ============================================================ */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-[88vh] sm:max-w-md sm:mx-auto rounded-t-3xl p-0 flex flex-col bg-background overflow-hidden border-t"
        >
          {/* Drawer Header */}
          <SheetHeader className="p-4 border-b bg-card/80 backdrop-blur-md flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #ea580c 100%)`,
                }}
              >
                <SparklesIcon className="size-5" />
              </div>
              <div className="text-left">
                <SheetTitle className="text-sm font-black text-foreground flex items-center gap-1.5">
                  <span>Menü Danışmanı AI</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                    Canlı
                  </span>
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground line-clamp-1">
                  {restaurantName} • Akıllı Sipariş & Alerjen Rehberi
                </SheetDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <XIcon className="size-4" />
            </button>
          </SheetHeader>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-2 max-w-[88%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
                )}
              >
                {/* Bubble */}
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

                {/* Recommended Product Cards in Chat */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="w-full space-y-2.5 mt-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <UtensilsIcon className="size-3 text-primary" />
                      Önerilen Ürünler
                    </span>

                    <div className="grid grid-cols-1 gap-2 w-full">
                      {msg.recommendedProducts.map((prod) => {
                        const isAdded = addedItemIds[prod.id];
                        return (
                          <div
                            key={prod.id}
                            className="bg-card border border-border rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                          >
                            {/* Product Info & Photo */}
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

                            {/* Sepete Ekle Button */}
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddProductToCart(prod)}
                              className={cn(
                                "h-9 px-3 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer shadow-xs",
                                isAdded
                                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                                  : "bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95",
                              )}
                            >
                              {isAdded ? (
                                <>
                                  <CheckIcon className="size-3.5 stroke-[3] mr-1" />
                                  Eklendi
                                </>
                              ) : (
                                <>
                                  <PlusIcon className="size-3.5 stroke-[3] mr-1" />
                                  Sepete Ekle
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggested Prompts Buttons */}
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

          {/* Chat Input Bar (No auto-focus, keyboard only opens on explicit user click) */}
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
    </>
  );
}
