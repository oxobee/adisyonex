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
      {/* 1. DRAGGABLE FLOATING ICON LAUNCHER (Metinsiz, Serbest Sürüklenebilir) */}
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
          <div className="relative p-[1.5px] rounded-full overflow-hidden shadow-2xl shadow-purple-950/30 group">
            {/* Pulsing Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-border opacity-90 group-hover:opacity-100 transition-opacity" />

            <div
              className="relative flex size-13 sm:size-14 items-center justify-center bg-slate-900/95 hover:bg-slate-900 text-white rounded-full backdrop-blur-md cursor-pointer"
              title="AdisyonEx Akıllı Asistan (Sürükleyin veya dokunun)"
            >
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-md">
                <SparklesIcon className="size-5 animate-pulse" />
              </div>
              <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
              <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
          </div>
        </div>
      )}

      {/* 2. EXPANDABLE CHAT SHEET / DRAWER */}
      {isOpen && (
        <div className="fixed bottom-2 right-2 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[420px] md:w-[450px] max-h-[88vh] sm:max-h-[640px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-200">
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 sm:p-4.5 border-b border-gray-100 dark:border-slate-800 bg-linear-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-slate-800/80 dark:to-slate-900">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                  <BotIcon className="size-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                    AdisyonEx Asistan
                  </h3>
                  {activeStaff ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {activeStaff.name} ({activeStaff.jobTitle || activeStaff.role})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Akıllı Mod
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {activeStaff
                    ? `Yetki alanı: ${activeStaff.jobTitle || activeStaff.role} (${activeStaff.name})`
                    : "Doğal konuşma & sesli restoran kontrolü"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                title="Küçült"
              >
                <ChevronDownIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors shadow-2xs cursor-pointer"
                title="Kapat"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 min-h-[280px] max-h-[460px] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5 animate-in fade-in-50 duration-200",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 border border-purple-200 dark:border-purple-800 mt-0.5">
                    <SparklesIcon className="size-3.5" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-2 max-w-[84%]",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {/* MESSAGE BUBBLE */}
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-2xs font-medium",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-gray-100/90 dark:bg-slate-800/90 text-gray-800 dark:text-gray-200 border border-gray-200/60 dark:border-slate-700/60 rounded-bl-xs"
                    )}
                  >
                    {msg.content}
                  </div>

                  {/* 1. INTERACTIVE NAVIGATION RECOMMENDATION CARD */}
                  {msg.recommendedPage && (
                    <div className="w-full bg-linear-to-br from-blue-50/90 to-indigo-50/90 dark:from-slate-800 dark:to-slate-850 p-3 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 shadow-xs flex items-center justify-between gap-2.5 mt-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 shadow-2xs border border-blue-100 dark:border-slate-700">
                          {getPageIcon(msg.recommendedPage.icon)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {msg.recommendedPage.title}
                          </h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {msg.recommendedPage.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          router.push(msg.recommendedPage!.url);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Sayfaya Git</span>
                        <ArrowRightIcon className="size-3" />
                      </button>
                    </div>
                  )}

                  {/* 2. INTERACTIVE ORDER ACTION PREVIEW CARD (HER ZAMAN ONAY İSTER) */}
                  {msg.actionPreview && !msg.actionExecuted && !msg.actionCancelled && (
                    <div className="w-full bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/90 dark:from-slate-850 dark:via-slate-800 dark:to-slate-850 p-3.5 rounded-2xl border-2 border-purple-300 dark:border-purple-800 shadow-md flex flex-col gap-2.5 mt-1">
                      <div className="flex items-center justify-between border-b border-purple-100 dark:border-slate-700 pb-2">
                        <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-black text-[11px]">
                          <FlameIcon className="size-3.5 text-amber-500" />
                          <span>SİPARİŞ ONAYI BEKLENİYOR</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Masa {msg.actionPreview.tableLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white/80 dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                          <span className="text-[10px] text-gray-500 block font-medium">Ürün Adı:</span>
                          <span className="font-bold text-gray-900 dark:text-white truncate block">
                            {msg.actionPreview.menuItemName}
                          </span>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800">
                          <span className="text-[10px] text-gray-500 block font-medium">Miktar & Tutar:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            {msg.actionPreview.quantity} Adet · ₺{msg.actionPreview.totalPrice}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS: ONYALA VE EKLE / İPTAL */}
                      <div className="flex items-center gap-2 pt-1">
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

                        <button
                          type="button"
                          disabled={executingActionId === msg.id}
                          onClick={() => handleCancelAction(msg.id)}
                          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-600 dark:text-gray-300 font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. CLARIFICATION PILLS ("Bunu mu demek istediniz?") */}
                  {msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.clarificationOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(opt)}
                          className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-[11px] hover:bg-purple-50 transition-all active:scale-95 shadow-2xs cursor-pointer"
                        >
                          👉 {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-gray-400 font-medium px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800 mt-0.5">
                    <UserIcon className="size-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium pl-9">
                <div className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-purple-500 animate-bounce" />
                  <span className="size-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="size-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Düşünüyor ve sistem kontrolü yapılıyor...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80">
            <div className="relative flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-200/90 dark:border-slate-700 rounded-2xl px-2.5 py-1.5 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
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
                className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 min-w-0"
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
                  "flex size-8 items-center justify-center rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs select-none",
                  isHoldingMic
                    ? "scale-110 bg-red-600 text-white shadow-md shadow-red-500/30"
                    : isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600"
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
                className="flex size-8 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shrink-0 cursor-pointer disabled:opacity-40 shadow-xs"
                title="Gönder"
              >
                <SendIcon className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
