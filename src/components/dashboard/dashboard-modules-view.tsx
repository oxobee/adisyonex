"use client";

import { useMemo, useState } from "react";
import {
  Robot as BotMessageSquareIcon,
  CheckCircle as CheckCircle2Icon,
  Crown as CrownIcon,
  ArrowUpRight as ExternalLinkIcon,
  FileText as FileTextIcon,
  UploadSimple as FileUpIcon,
  Gift as GiftIcon,
  Question as HelpCircleIcon,
  ImageSquare as ImagePlusIcon,
  Lock as LockIcon,
  ChatCircleText as MessageCircleIcon,
  PhoneCall as PhoneCallIcon,
  PlayCircle as PlayCircleIcon,
  MagnifyingGlass as SearchIcon,
  ShoppingBag as ShoppingBagIcon,
  Sparkle as SparklesIcon,
  UserCheck as UserCheckIcon,
  Video as VideoIcon,
  MagicWand as WandSparklesIcon,
  XCircle as XCircleIcon,
  X as XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RestaurantModuleStatusDTO } from "@/services/module.service";
import type { LicenseSalesRepDTO } from "@/services/license.service";

// Helper to extract clean YouTube Embed URL
function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = trimmed.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    // Check if it's already an embed URL
    if (trimmed.includes("youtube.com/embed/")) {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

// Icon mapping
function getModuleIcon(key: string) {
  switch (key) {
    case "qr_ai":
      return BotMessageSquareIcon;
    case "admin_ai":
      return SparklesIcon;
    case "ai_menu_import":
      return FileUpIcon;
    case "ai_image_generation":
      return ImagePlusIcon;
    case "ai_photo_enhance":
      return WandSparklesIcon;
    case "ai_copywriter_nutrition":
      return FileTextIcon;
    case "birthday_automation":
      return GiftIcon;
    case "qr_customer_auth":
      return UserCheckIcon;
    default:
      return SparklesIcon;
  }
}

export function DashboardModulesView({
  modules,
  salesRep,
}: {
  readonly modules: readonly RestaurantModuleStatusDTO[];
  readonly salesRep?: LicenseSalesRepDTO | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "PASSIVE">("ALL");
  const [videoModalModule, setVideoModalModule] = useState<RestaurantModuleStatusDTO | null>(null);
  const [purchaseModalModule, setPurchaseModalModule] = useState<RestaurantModuleStatusDTO | null>(null);

  // Group modules by category
  const aiModuleKeys = [
    "qr_ai",
    "admin_ai",
    "ai_menu_import",
    "ai_image_generation",
    "ai_photo_enhance",
    "ai_copywriter_nutrition",
  ];

  // Filter modules
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const isActuallyActive = m.isGloballyActive && m.isRestaurantActive;
      if (activeTab === "ACTIVE" && !isActuallyActive) return false;
      if (activeTab === "PASSIVE" && isActuallyActive) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    });
  }, [modules, activeTab, searchTerm]);

  const aiModules = filteredModules.filter((m) => aiModuleKeys.includes(m.key));
  const otherModules = filteredModules.filter((m) => !aiModuleKeys.includes(m.key));

  const totalActiveCount = modules.filter(
    (m) => m.isGloballyActive && m.isRestaurantActive
  ).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider text-indigo-200">
              <SparklesIcon className="size-3.5 text-amber-400" />
              <span>Oxonom POS Ekosistemi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Sistem ve Yapay Zeka Modülleri
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 font-medium leading-relaxed">
              İşletmenizin operasyonel hızını, cirosunu ve müşteri memnuniyetini artıran güçlü eklentileri keşfedin ve yönetin.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-4 rounded-2xl">
            <div className="text-center px-3 border-r border-white/20">
              <span className="text-2xl sm:text-3xl font-black text-white block tabular-nums">
                {totalActiveCount}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Aktif Modül
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-2xl sm:text-3xl font-black text-white/70 block tabular-nums">
                {modules.length}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Toplam Modül
              </span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 size-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted border w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex-1 sm:flex-none text-center",
              activeTab === "ALL"
                ? "bg-white text-gray-900 shadow-xs dark:bg-card dark:text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tüm Modüller ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ACTIVE")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex-1 sm:flex-none text-center",
              activeTab === "ACTIVE"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-card dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Aktif Modüller ({totalActiveCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PASSIVE")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex-1 sm:flex-none text-center",
              activeTab === "PASSIVE"
                ? "bg-white text-amber-700 shadow-xs dark:bg-card dark:text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pasif Modüller ({modules.length - totalActiveCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Modüllerde ara..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* CATEGORY 1: YAPAY ZEKA & AKILLI ASİSTANLAR */}
      {aiModules.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b">
            <div className="flex size-7 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
              <SparklesIcon className="size-4" />
            </div>
            <h2 className="text-lg font-black text-foreground tracking-tight">
              Yapay Zeka & Akıllı Asistanlar
            </h2>
            <span className="text-xs font-bold text-muted-foreground ml-auto">
              {aiModules.length} Modül
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {aiModules.map((mod) => (
              <ModuleCard
                key={mod.moduleId}
                mod={mod}
                onOpenVideo={() => setVideoModalModule(mod)}
                onBuy={() => setPurchaseModalModule(mod)}
              />
            ))}
          </div>
        </section>
      )}

      {/* CATEGORY 2: MÜŞTERİ SADAKATİ & DİĞER MODÜLLER */}
      {otherModules.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b">
            <div className="flex size-7 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600">
              <CrownIcon className="size-4" />
            </div>
            <h2 className="text-lg font-black text-foreground tracking-tight">
              Müşteri Sadakati, Otomasyon & Büyüme
            </h2>
            <span className="text-xs font-bold text-muted-foreground ml-auto">
              {otherModules.length} Modül
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherModules.map((mod) => (
              <ModuleCard
                key={mod.moduleId}
                mod={mod}
                onOpenVideo={() => setVideoModalModule(mod)}
                onBuy={() => setPurchaseModalModule(mod)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredModules.length === 0 && (
        <div className="py-16 text-center text-muted-foreground space-y-2">
          <SearchIcon className="size-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-bold">Aramanızla eşleşen modül bulunamadı.</p>
          <p className="text-xs">Filtreleri veya arama terimini temizlemeyi deneyin.</p>
        </div>
      )}

      {/* ELASTIC YOUTUBE PROMO VIDEO POPUP */}
      <ModuleVideoModal
        module={videoModalModule}
        onClose={() => setVideoModalModule(null)}
      />

      {/* MODULE PURCHASE / ACTIVATION MODAL */}
      <ModulePurchaseModal
        module={purchaseModalModule}
        salesRep={salesRep}
        onClose={() => setPurchaseModalModule(null)}
      />
    </div>
  );
}

// -------------------------------------------------------------
// MODULE CARD COMPONENT
// -------------------------------------------------------------
function ModuleCard({
  mod,
  onOpenVideo,
  onBuy,
}: {
  readonly mod: RestaurantModuleStatusDTO;
  readonly onOpenVideo: () => void;
  readonly onBuy: () => void;
}) {
  const Icon = getModuleIcon(mod.key);
  const isActuallyActive = mod.isGloballyActive && mod.isRestaurantActive;
  const hasVideo = Boolean(mod.videoUrl && mod.videoUrl.trim().length > 0);

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl border bg-card p-5 sm:p-6 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden",
        isActuallyActive
          ? "border-border/80 hover:border-primary/50"
          : "border-border/50 bg-muted/20 opacity-90"
      )}
    >
      <div>
        {/* Top: Icon & Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-110 duration-200",
              isActuallyActive
                ? "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary border border-primary/25"
                : "bg-muted text-muted-foreground border border-border/60"
            )}
          >
            <Icon className="size-6 stroke-[2]" />
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border tracking-tight shrink-0",
              isActuallyActive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25"
            )}
          >
            {isActuallyActive ? (
              <>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
              </>
            ) : (
              <>
                <span className="size-2 rounded-full bg-zinc-400" />
                Pasif
              </>
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-black text-base sm:text-lg text-foreground tracking-tight group-hover:text-primary transition-colors leading-snug">
          {mod.name}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {mod.description || "Bu modül için açıklama hazırlanıyor."}
        </p>
      </div>

      {/* Bottom Row: Price & Actions */}
      <div className="mt-6 pt-4 border-t border-border/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Fiyatlandırma
            </span>
            <span className="text-base sm:text-lg font-black text-foreground tabular-nums">
              {mod.price > 0 ? (
                <>
                  {mod.price.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} {mod.currency}
                  <span className="text-xs font-semibold text-muted-foreground ml-1">/ ay</span>
                </>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-black">Ücretsiz</span>
              )}
            </span>
          </div>

          {/* Tanıtım Videosu Butonu (Eğer SuperAdmin'den video varsa) */}
          {hasVideo && (
            <button
              type="button"
              onClick={onOpenVideo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs transition-all active:scale-95 cursor-pointer group/btn"
              title="Modül Tanıtım Videosunu İzle"
            >
              <PlayCircleIcon className="size-3.5 text-rose-600 transition-transform group-hover/btn:scale-110" />
              <span>Tanıtım Videosu</span>
            </button>
          )}
        </div>

        {/* Primary Action Button */}
        {isActuallyActive ? (
          <div className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black select-none">
            <CheckCircle2Icon className="size-4" />
            <span>Kullanıma Açık & Aktif</span>
          </div>
        ) : (
          <Button
            type="button"
            onClick={onBuy}
            className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            <ShoppingBagIcon className="size-3.5 mr-1.5" />
            <span>Modülü Satın Al</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ELASTIC YOUTUBE VIDEO MODAL (POPUP)
// -------------------------------------------------------------
function ModuleVideoModal({
  module,
  onClose,
}: {
  readonly module: RestaurantModuleStatusDTO | null;
  readonly onClose: () => void;
}) {
  if (!module) return null;

  const embedUrl = getYouTubeEmbedUrl(module.videoUrl);

  return (
    <Dialog open={Boolean(module)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-950 text-white border-slate-800 shadow-2xl rounded-3xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-7 items-center justify-center rounded-lg bg-red-600 text-white">
              <PlayCircleIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white truncate">
                {module.name} — Tanıtım Videosu
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Resmi ürün özellikleri ve kullanım kılavuzu
              </p>
            </div>
          </div>
        </div>

        {/* 16:9 Responsive Aspect Video Player */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${module.name} Tanıtım Videosu`}
              className="absolute inset-0 size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <VideoIcon className="size-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">Geçersiz veya bulunamayan video bağlantısı.</p>
              <p className="text-xs text-slate-500">Video bağlantısı YouTube standartlarında olmalıdır.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------
// MODULE PURCHASE / CONTACT MODAL
// -------------------------------------------------------------
function ModulePurchaseModal({
  module,
  salesRep,
  onClose,
}: {
  readonly module: RestaurantModuleStatusDTO | null;
  readonly salesRep?: LicenseSalesRepDTO | null;
  readonly onClose: () => void;
}) {
  if (!module) return null;

  const phoneToCall = salesRep?.phone || "+905550570368";
  const whatsappNumber =
    salesRep?.whatsapp?.replace(/\D/g, "") ||
    salesRep?.phone?.replace(/\D/g, "") ||
    "905550570368";

  const whatsappMessage = encodeURIComponent(
    `Merhaba, Oxonom POS işletmemiz için "${module.name}" modülünü satın almak ve aktifleştirmek istiyoruz. Bilgi alabilir miyim?`
  );

  return (
    <Dialog open={Boolean(module)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <ShoppingBagIcon className="size-5" />
            <span className="text-xs font-black uppercase tracking-wider">Modül Satın Alma & Aktivasyon</span>
          </div>
          <DialogTitle className="text-lg font-black text-foreground">
            {module.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {module.description || "Bu modülü aktifleştirerek işletmenizin gücüne güç katın."}
          </DialogDescription>
        </DialogHeader>

        {/* Pricing Box */}
        <div className="my-2 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider">
              Aylık Lisans Bedeli
            </span>
            <div className="text-xl font-black text-indigo-950 dark:text-indigo-100 tabular-nums">
              {module.price.toLocaleString("tr-TR")} {module.currency} <span className="text-xs font-semibold text-muted-foreground">/ ay</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/25">
            Hızlı Kurulum
          </span>
        </div>

        {/* Support & Sales Contact Options */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground font-medium">
            Modülü hesabınıza tanımlatmak için yetkili satış temsilcinizle anında iletişime geçebilirsiniz:
          </p>

          <div className="flex flex-col gap-2">
            {/* WhatsApp Contact */}
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <MessageCircleIcon className="size-4" />
              <span>WhatsApp ile Hemen Satın Al</span>
            </a>

            {/* Direct Phone Call */}
            <a
              href={`tel:${phoneToCall}`}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-98 cursor-pointer border"
            >
              <PhoneCallIcon className="size-3.5 text-indigo-600" />
              <span>Satış Temsilcisini Ara ({phoneToCall})</span>
            </a>
          </div>

          {salesRep && (
            <div className="mt-3 pt-3 border-t text-center">
              <span className="text-[11px] text-muted-foreground">
                Temsilciniz: <strong>{salesRep.name}</strong> ({salesRep.title})
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
