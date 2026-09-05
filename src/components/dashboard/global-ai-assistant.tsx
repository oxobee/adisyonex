"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  SparklesIcon,
  XIcon,
  SendIcon,
  MicIcon,
  BotIcon,
  UserIcon,
  ArrowRightIcon,
  ArmchairIcon,
  ChefHatIcon,
  CreditCardIcon,
  BookOpenIcon,
  FileTextIcon,
  BoxesIcon,
  UsersIcon,
  SettingsIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  HelpCircleIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  FlameIcon,
  MinusIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  CheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  askAiAssistantAction,
  executeAiAssistantAction,
  type AiMessage,
  type AiActionPreview,
  type AiRecommendedPage,
} from "@/actions/ai-assistant.actions";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendedPage?: AiRecommendedPage | null;
  actionPreview?: AiActionPreview | null;
  actionExecuted?: boolean;
  actionCancelled?: boolean;
  clarificationOptions?: readonly string[];
  timestamp: string;
}

export interface StaffInfo {
  id: string;
  name: string;
  role: string;
  jobTitle?: string | null;
  allowedRoutes?: readonly string[] | null;
}

export function getRoleSuggestionsAndGreeting(staff: StaffInfo | null) {
  const role = (staff?.role || "").toUpperCase();
  const jobTitle = (staff?.jobTitle || "").toLowerCase();
  const name = staff?.name?.trim() || "";
  const routes = staff?.allowedRoutes ?? null;

  const isKitchen =
    role === "KITCHEN" ||
    role === "CHEF" ||
    jobTitle.includes("aşçı") ||
    jobTitle.includes("mutfak") ||
    jobTitle.includes("chef") ||
    (routes !== null &&
      routes.includes("/dashboard/kitchen") &&
      !routes.includes("/dashboard/orders") &&
      !routes.includes("/dashboard/z-report"));

  const isWaiter =
    !isKitchen &&
    (role === "WAITER" ||
      jobTitle.includes("garson") ||
      jobTitle.includes("servis") ||
      (routes !== null &&
        routes.includes("/dashboard/orders") &&
        !routes.includes("/dashboard/kitchen") &&
        !routes.includes("/dashboard/z-report")));

  const isCashier =
    !isKitchen &&
    !isWaiter &&
    (role === "CASHIER" ||
      jobTitle.includes("kasa") ||
      jobTitle.includes("kasiyer") ||
      (routes !== null &&
        routes.includes("/dashboard/pos") &&
        !routes.includes("/dashboard/z-report")));

  if (isKitchen) {
    return {
      isKitchen: true,
      greeting: name
        ? `Merhaba ${name}! Ben AdisyonEx Mutfak Asistanınız. Mutfak siparişleri, hazırlık durumu ve operasyon bildirimleri hakkında bana danışabilirsiniz.`
        : "Merhaba! Ben AdisyonEx Mutfak Asistanınız. Mutfak siparişleri, hazırlık durumu ve operasyon bildirimleri hakkında bana danışabilirsiniz.",
      options: [
        "Bekleyen siparişleri göster",
        "Tavuk burger hazırlanıyor mu?",
        "Mutfak ekranına git",
        "Hazırlanan yemekler listesi",
      ],
      placeholder: "Örn: Bekleyen siparişleri göster veya Mutfak ekranı...",
    };
  }

  if (isWaiter) {
    return {
      isWaiter: true,
      greeting: name
        ? `Merhaba ${name}! Ben AdisyonEx Garson Asistanınız. Masalar, sipariş ekleme ve servis bildirimleri hakkında bana danışabilirsiniz.`
        : "Merhaba! Ben AdisyonEx Garson Asistanınız. Masalar, sipariş ekleme ve servis bildirimleri hakkında bana danışabilirsiniz.",
      options: [
        "Masa 5'e 1 Hamburger ekle",
        "Boş masaları göster",
        "Masa durumunu göster",
        "Masa yönetimine git",
      ],
      placeholder: "Örn: Masa 5'e 1 Hamburger ekle veya Boş masalar...",
    };
  }

  if (isCashier) {
    return {
      isCashier: true,
      greeting: name
        ? `Merhaba ${name}! Ben AdisyonEx Kasa Asistanınız. Açık hesaplar, ödemeler ve POS işlemleri hakkında bana danışabilirsiniz.`
        : "Merhaba! Ben AdisyonEx Kasa Asistanınız. Açık hesaplar, ödemeler ve POS işlemleri hakkında bana danışabilirsiniz.",
      options: [
        "Açık masa hesaplarını göster",
        "POS ödeme ekranına git",
        "Masa durumunu göster",
        "Kasa durumunu göster",
      ],
      placeholder: "Örn: Açık masaları listele veya POS ödeme ekranı...",
    };
  }

  // Management / Super Admin / Owner / General Staff
  return {
    greeting: name
      ? `Merhaba ${name}! Ben AdisyonEx Akıllı Restoran Asistanınız. Sipariş ekleme, masa/menü/kasa durumu veya sistem kullanımı hakkında bana her şeyi sorabilirsiniz.`
      : "Merhaba! Ben AdisyonEx Akıllı Restoran Asistanınız. Sipariş ekleme, masa/menü/kasa durumu veya sistem kullanımı hakkında bana her şeyi sorabilirsiniz.",
    options: [
      "Bugünkü toplam ciro ne kadar?",
      "Masa 5'e 1 Hamburger ekle",
      "Mutfak durumunu göster",
      "Z Raporu nedir?",
    ],
    placeholder: "Örn: Masa 3'e 2 Çay ekle veya Ciro ne kadar?",
  };
}

export function GlobalAiAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  // Product Customization State for Optioned Items
  const [customizingAction, setCustomizingAction] = useState<{
    msgId: string;
    action: AiActionPreview;
  } | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [customLineNote, setCustomLineNote] = useState<string>("");

  // Audio / Speech State
  const [isListening, setIsListening] = useState(false);
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Merhaba! Ben AdisyonEx Akıllı Restoran Asistanınız. Sipariş ekleme, masa/menü/kasa durumu veya sistem kullanımı hakkında bana her şeyi sorabilirsiniz.",
      clarificationOptions: [
        "Masa 5'e 1 Hamburger ekle",
        "Mutfak durumunu göster",
        "Masa yönetimine git",
        "Z Raporu nedir?",
      ],
      timestamp: "Şimdi",
    },
  ]);

  // Active Staff Account State (Rol Bazlı Yetki Kısıtlama için)
  const [activeStaff, setActiveStaff] = useState<StaffInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyStaffToChat = (staffData: StaffInfo | null) => {
      setActiveStaff(staffData);
      const roleConfig = getRoleSuggestionsAndGreeting(staffData);
      setMessages((prev) => {
        if (prev.length <= 1) {
          return [
            {
              id: "welcome",
              role: "assistant",
              content: roleConfig.greeting,
              clarificationOptions: roleConfig.options,
              timestamp: "Şimdi",
            },
          ];
        }
        return prev.map((m) =>
          m.id === "welcome"
            ? {
                ...m,
                content: roleConfig.greeting,
                clarificationOptions: roleConfig.options,
              }
            : m
        );
      });
    };

    const readActiveStaff = () => {
      try {
        const raw = localStorage.getItem("adisyon_active_staff_account");
        if (raw) {
          applyStaffToChat(JSON.parse(raw));
        } else {
          const staffId = localStorage.getItem("adisyon_active_staff_id");
          if (staffId) {
            applyStaffToChat({ id: staffId, name: "Personel", role: "STAFF" });
          } else {
            applyStaffToChat(null);
          }
        }
      } catch {
        applyStaffToChat(null);
      }
    };

    readActiveStaff();

    const handleAccountChange = (e: any) => {
      if (e?.detail) {
        applyStaffToChat(e.detail);
      } else {
        readActiveStaff();
      }
    };

    window.addEventListener("active-account-changed", handleAccountChange);
    return () => window.removeEventListener("active-account-changed", handleAccountChange);
  }, []);

  // Draggable FAB State (Basılı tutup sürükleyebilme)
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
      const saved = localStorage.getItem("adisyon_ai_fab_pos");
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
    const defaultX = Math.max(12, window.innerWidth - 76);
    const defaultY = Math.max(12, window.innerHeight - 84);
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = false;
    const currentX = position ? position.x : window.innerWidth - 76;
    const currentY = position ? position.y : window.innerHeight - 84;
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
        localStorage.setItem("adisyon_ai_fab_pos", JSON.stringify(position));
      }
      isDraggingRef.current = false;
    } else {
      setIsOpen(true);
    }
    dragStartRef.current = { startX: 0, startY: 0, posX: 0, posY: 0 };
  };

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Listen for global custom event: window.dispatchEvent(new CustomEvent("open-ai-assistant", { detail: { prompt: "..." } }))
  useEffect(() => {
    const handleGlobalTrigger = (event: any) => {
      setIsOpen(true);
      const initialPrompt = event?.detail?.prompt;
      if (initialPrompt && typeof initialPrompt === "string") {
        setInputQuery(initialPrompt);
        setTimeout(() => {
          handleSend(initialPrompt);
        }, 150);
      }
    };

    window.addEventListener("open-ai-assistant", handleGlobalTrigger);
    return () => window.removeEventListener("open-ai-assistant", handleGlobalTrigger);
  }, []);

  // Web Speech API Setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "tr-TR";

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputQuery(transcript);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
        setIsHoldingMic(false);
      };

      rec.onend = () => {
        setIsListening(false);
        setIsHoldingMic(false);
      };

      recognitionRef.current = rec;
    } catch {
      // ignore
    }
  }, []);

  const startListening = () => {
    setIsListening(true);
    try {
      recognitionRef.current?.start();
    } catch {
      // ignore
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setIsHoldingMic(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  };

  const handleMicPressStart = () => {
    setIsHoldingMic(true);
    startListening();
  };

  const handleMicPressEnd = () => {
    setIsHoldingMic(false);
  };

  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt ?? inputQuery).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      // Prepare history for server
      const chatHistory: AiMessage[] = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await askAiAssistantAction(query, chatHistory, activeStaff?.id);

      if (!res.success || !res.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ ${res.error || "Yanıt alınamadı."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      const data = res.data;
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        recommendedPage: data.recommendedPage,
        actionPreview: data.actionPreview,
        clarificationOptions: data.clarificationOptions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTableBadge = (label?: string) => {
    if (!label) return "Masa";
    const clean = label.trim();
    if (/^masa/i.test(clean)) return clean;
    return `Masa ${clean}`;
  };

  const handleOpenCustomize = (msgId: string, action: AiActionPreview) => {
    setCustomizingAction({ msgId, action });
    if (action.variants && action.variants.length > 0) {
      setSelectedVariantId(action.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
    setSelectedModifiers({});
    setCustomQuantity(action.quantity || 1);
    setCustomLineNote("");
  };

  const calculateCustomTotal = () => {
    if (!customizingAction) return 0;
    const { action } = customizingAction;

    let basePrice = action.unitPrice;
    if (selectedVariantId && action.variants) {
      const v = action.variants.find((x) => x.id === selectedVariantId);
      if (v) basePrice = v.price;
    }

    let modifiersDelta = 0;
    if (action.modifierGroups) {
      for (const group of action.modifierGroups) {
        const selectedIds = selectedModifiers[group.id] || [];
        for (const modId of selectedIds) {
          const m = group.modifiers.find((mod) => mod.id === modId);
          if (m) modifiersDelta += m.priceDelta;
        }
      }
    }

    return (basePrice + modifiersDelta) * customQuantity;
  };

  const handleConfirmCustomize = async () => {
    if (!customizingAction) return;
    const { msgId, action } = customizingAction;

    // Validate required modifier groups
    if (action.modifierGroups && action.modifierGroups.length > 0) {
      for (const group of action.modifierGroups) {
        const selectedCount = (selectedModifiers[group.id] || []).length;
        if (group.isRequired && selectedCount < Math.max(1, group.minSelect || 1)) {
          toast.error(`Lütfen "${group.name}" grubundan en az ${Math.max(1, group.minSelect || 1)} seçim yapınız.`);
          return;
        }
      }
    }

    const modifierIds = Object.values(selectedModifiers).flat();
    const actionWithCustomization = {
      ...action,
      quantity: customQuantity,
      selectedVariantId,
      selectedModifierIds: modifierIds,
      lineNote: customLineNote,
      totalPrice: calculateCustomTotal(),
    };

    setCustomizingAction(null);
    await handleExecuteAction(msgId, actionWithCustomization);
  };

  const handleExecuteAction = async (msgId: string, action: AiActionPreview) => {
    setExecutingActionId(msgId);
    try {
      const res = await executeAiAssistantAction(action, activeStaff?.id);
      if (res.success && res.data) {
        toast.success(res.data.message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  actionExecuted: true,
                  content: `${m.content}\n\n✅ **İşlem Başarıyla Tamamlandı!** (${res.data?.message})`,
                }
              : m
          )
        );
      } else {
        toast.error(res.error || "İşlem başarısız oldu.");
      }
    } catch (err: any) {
      toast.error(err.message || "İşlem sırasında hata oluştu.");
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              actionCancelled: true,
              content: `${m.content}\n\n❌ *Sipariş işlemi kullanıcı tarafından iptal edildi.*`,
            }
          : m
      )
    );
    toast.info("İşlem iptal edildi.");
  };

  const getPageIcon = (iconType?: string) => {
    switch (iconType) {
      case "table":
        return <ArmchairIcon className="size-4 text-blue-600" />;
      case "kitchen":
        return <ChefHatIcon className="size-4 text-orange-600" />;
      case "pos":
        return <CreditCardIcon className="size-4 text-emerald-600" />;
      case "menu":
        return <BookOpenIcon className="size-4 text-purple-600" />;
      case "report":
        return <FileTextIcon className="size-4 text-indigo-600" />;
      case "stock":
        return <BoxesIcon className="size-4 text-amber-600" />;
      case "staff":
        return <UsersIcon className="size-4 text-rose-600" />;
      default:
        return <SettingsIcon className="size-4 text-slate-600" />;
    }
  };

  return (
    <>
      {/* 1. DRAGGABLE FLOATING ICON LAUNCHER (Kompakt, Sade ve Dikkat Çekmeyen Tasarım) */}
      {!isOpen && position && (
        <div
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="fixed z-40 select-none cursor-grab active:cursor-grabbing transition-transform active:scale-95 animate-in fade-in zoom-in-95 duration-200"
        >
          <div
            className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-card/90 hover:bg-card text-muted-foreground hover:text-foreground border border-border shadow-md backdrop-blur-md cursor-pointer transition-all hover:scale-105 group"
            title="AdisyonEx Asistan"
          >
            <SparklesIcon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="sr-only">Yapay Zeka Asistanı</span>
          </div>
        </div>
      )}

      {/* 2. EXPANDABLE CHAT SHEET / DRAWER */}
      {isOpen && (
        <div className="fixed bottom-2 right-2 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[440px] md:w-[460px] max-h-[88vh] sm:max-h-[660px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-6 duration-250">
          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
                  <SparklesIcon className="size-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    AdisyonEx Asistan
                  </h3>
                  {activeStaff ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 inline-flex items-center gap-1.5 truncate">
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{activeStaff.name} ({activeStaff.role})</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                      AI Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {activeStaff
                    ? `Yetki: ${activeStaff.jobTitle || activeStaff.role} (${activeStaff.name})`
                    : "Akıllı restoran kontrol & operasyon asistanı"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Küçült"
              >
                <ChevronDownIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Kapat"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 min-h-[280px] max-h-[460px] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 animate-in fade-in-50 duration-200",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700 mt-0.5 shadow-2xs">
                    <SparklesIcon className="size-3.5" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {/* MESSAGE BUBBLE */}
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-2xs text-xs sm:text-[13px]",
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-br-xs shadow-md shadow-blue-500/15"
                        : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-xs font-normal"
                    )}
                  >
                    {msg.content}
                  </div>

                  {/* 1. INTERACTIVE NAVIGATION RECOMMENDATION CARD */}
                  {msg.recommendedPage && (
                    <div
                      onClick={() => {
                        setIsOpen(false);
                        router.push(msg.recommendedPage!.url);
                      }}
                      className="w-full bg-slate-50 hover:bg-slate-100/90 dark:bg-slate-850 dark:hover:bg-slate-800 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-xs flex items-center justify-between gap-3 mt-1.5 transition-all cursor-pointer group select-none animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-slate-700 group-hover:scale-105 transition-transform">
                          {getPageIcon(msg.recommendedPage.icon)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {msg.recommendedPage.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {msg.recommendedPage.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          router.push(msg.recommendedPage!.url);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shrink-0 shadow-xs transition-all cursor-pointer"
                      >
                        <span>Sayfaya Git</span>
                        <ArrowRightIcon className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  )}

                  {/* 2. INTERACTIVE ORDER ACTION PREVIEW CARD (HER ZAMAN ONAY İSTER) */}
                  {msg.actionPreview && !msg.actionExecuted && !msg.actionCancelled && (
                    <div className="w-full bg-white dark:bg-slate-800/95 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-lg shadow-indigo-500/5 flex flex-col gap-2.5 mt-1">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-extrabold text-[11px]">
                          <FlameIcon className="size-3.5 text-amber-500" />
                          <span>Sipariş Onayı Bekleniyor</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60">
                          {formatTableBadge(msg.actionPreview.tableLabel)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Ürün Adı:</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate block">
                            {msg.actionPreview.menuItemName || "Ürün"}
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Miktar & Tutar:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                            {msg.actionPreview.quantity || 1} Adet · ₺{msg.actionPreview.totalPrice || msg.actionPreview.unitPrice}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS: EĞER SEÇENEKLİ ÜRÜNSE ÖNCE SEÇENEKLERİ GİRSİN */}
                      <div className="flex items-center gap-2 pt-1">
                        {msg.actionPreview.hasOptions ? (
                          <button
                            type="button"
                            disabled={executingActionId === msg.id}
                            onClick={() => handleOpenCustomize(msg.id, msg.actionPreview!)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <SlidersHorizontalIcon className="size-3.5" />
                            <span>Seçenekleri Belirle</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={executingActionId === msg.id}
                            onClick={() => handleExecuteAction(msg.id, msg.actionPreview!)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {executingActionId === msg.id ? (
                              <>
                                <RefreshCwIcon className="size-3.5 animate-spin" />
                                <span>Ekleniyor...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2Icon className="size-3.5" />
                                <span>Onayla ve Masaya Ekle</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={executingActionId === msg.id}
                          onClick={() => handleCancelAction(msg.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. CLARIFICATION PILLS (Modern, Rafine Butonlar) */}
                  {msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {msg.clarificationOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(opt)}
                          className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="text-indigo-500 font-bold">↳</span>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 font-medium px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 border border-blue-100 dark:border-slate-700 mt-0.5 shadow-2xs">
                    <UserIcon className="size-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-slate-400 text-xs font-medium pl-10">
                <div className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="size-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="size-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Düşünüyor ve sistem kontrolü yapılıyor...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-md">
            <div className="relative flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3 py-2 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              {/* Sound wave oscillation when listening */}
              {(isListening || isHoldingMic) && (
                <div className="flex items-center gap-0.5 h-4 px-1 shrink-0">
                  <span className="w-1 bg-purple-600 rounded-full sound-bar-1 animate-pulse" />
                  <span className="w-1 bg-indigo-600 rounded-full sound-bar-2 animate-pulse" />
                  <span className="w-1 bg-blue-600 rounded-full sound-bar-3 animate-pulse" />
                </div>
              )}

              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  isListening || isHoldingMic
                    ? "Dinleniyor, konuşun..."
                    : getRoleSuggestionsAndGreeting(activeStaff).placeholder
                }
                className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-w-0"
              />

              {/* MIC BUTTON */}
              <button
                type="button"
                onMouseDown={handleMicPressStart}
                onMouseUp={handleMicPressEnd}
                onTouchStart={handleMicPressStart}
                onTouchEnd={handleMicPressEnd}
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl transition-all shrink-0 cursor-pointer select-none",
                  isHoldingMic
                    ? "scale-110 bg-red-600 text-white shadow-md shadow-red-500/30"
                    : isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                )}
                title={isListening ? "Dinlemeyi Durdur" : "Sesli Komut Ver"}
              >
                <MicIcon className="size-4" />
              </button>

              {/* SEND BUTTON */}
              <button
                type="button"
                disabled={!inputQuery.trim() || loading}
                onClick={() => handleSend()}
                className="flex size-8 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shrink-0 cursor-pointer disabled:opacity-40 shadow-xs"
                title="Gönder"
              >
                <SendIcon className="size-3.5" />
              </button>
            </div>
          </div>

          {/* 3. PRODUCT CUSTOMIZATION OVERLAY (SEÇENEKLİ ÜRÜN MODALI) */}
          {customizingAction && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end rounded-3xl overflow-hidden animate-in fade-in duration-200">
              <div className="w-full max-h-[85%] bg-white dark:bg-slate-900 rounded-t-3xl border-t border-purple-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="p-3.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-800/80">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                      <SlidersHorizontalIcon className="size-3.5" />
                      <span>Ürün Seçenekleri</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold ml-1">
                        {formatTableBadge(customizingAction.action.tableLabel)}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                      {customizingAction.action.menuItemName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomizingAction(null)}
                    className="size-7 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {/* Variants */}
                  {customizingAction.action.variants && customizingAction.action.variants.length > 0 && (
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-2">
                        Porsiyon / Boyut Seçimi:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {customizingAction.action.variants.map((v) => {
                          const isSelected = selectedVariantId === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVariantId(v.id)}
                              className={cn(
                                "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between",
                                isSelected
                                  ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold"
                                  : "border-gray-200 dark:border-slate-700 hover:border-gray-300 text-gray-700 dark:text-gray-300"
                              )}
                            >
                              <span>{v.name}</span>
                              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₺{v.price}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Modifier Groups */}
                  {customizingAction.action.modifierGroups &&
                    customizingAction.action.modifierGroups.map((group) => {
                      const currentSelected = selectedModifiers[group.id] || [];
                      return (
                        <div key={group.id} className="border-t border-gray-100 dark:border-slate-800 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                              <span>{group.name}</span>
                              {group.isRequired && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-extrabold">
                                  Zorunlu
                                </span>
                              )}
                            </label>
                            <span className="text-[10px] text-gray-400">
                              {group.maxSelect === 1 ? "Tek seçim" : `Maks ${group.maxSelect}`}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {group.modifiers.map((mod) => {
                              const isChecked = currentSelected.includes(mod.id);
                              return (
                                <button
                                  key={mod.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModifiers((prev) => {
                                      const list = prev[group.id] || [];
                                      if (group.maxSelect === 1) {
                                        return { ...prev, [group.id]: isChecked ? [] : [mod.id] };
                                      }
                                      if (isChecked) {
                                        return { ...prev, [group.id]: list.filter((id) => id !== mod.id) };
                                      }
                                      if (list.length >= group.maxSelect) {
                                        toast.info(`Bu gruptan en fazla ${group.maxSelect} seçim yapabilirsiniz.`);
                                        return prev;
                                      }
                                      return { ...prev, [group.id]: [...list, mod.id] };
                                    });
                                  }}
                                  className={cn(
                                    "w-full p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                                    isChecked
                                      ? "border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-semibold"
                                      : "border-gray-200 dark:border-slate-800 hover:border-gray-300 text-gray-700 dark:text-gray-300"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn(
                                        "size-4 rounded-sm border flex items-center justify-center transition-colors",
                                        isChecked
                                          ? "bg-purple-600 border-purple-600 text-white"
                                          : "border-gray-300 dark:border-slate-600"
                                      )}
                                    >
                                      {isChecked && <CheckIcon className="size-3" />}
                                    </div>
                                    <span>{mod.name}</span>
                                  </div>
                                  {mod.priceDelta > 0 && (
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                      +₺{mod.priceDelta}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                  {/* Quantity & Note */}
                  <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Sipariş Adedi:
                      </span>
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setCustomQuantity((q) => Math.max(1, q - 1))}
                          className="size-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 cursor-pointer shadow-xs"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-6 text-center font-black text-xs">{customQuantity}</span>
                        <button
                          type="button"
                          onClick={() => setCustomQuantity((q) => Math.min(99, q + 1))}
                          className="size-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 cursor-pointer shadow-xs"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Özel Not (İsteğe Bağlı):
                      </label>
                      <input
                        type="text"
                        value={customLineNote}
                        onChange={(e) => setCustomLineNote(e.target.value)}
                        placeholder="Örn: Az pişmiş olsun, sos ayrı gelsin..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCustomizingAction(null)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={executingActionId === customizingAction.msgId}
                    onClick={handleConfirmCustomize}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {executingActionId === customizingAction.msgId ? (
                      <>
                        <RefreshCwIcon className="size-3.5 animate-spin" />
                        <span>Ekleniyor...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2Icon className="size-4" />
                        <span>Masaya Ekle (₺{calculateCustomTotal()})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
