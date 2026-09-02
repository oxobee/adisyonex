"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  FlameIcon,
  ImageIcon,
  LayoutGridIcon,
  PaletteIcon,
  PlusIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
  SparklesIcon,
  Trash2Icon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updateQrThemeCustomizationAction } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { QrSliderItem, QrThemeCustomizationDTO } from "@/services/restaurant-settings.service";
import type { MenuDTO } from "@/types/menu";

const PRESET_COLORS = [
  { name: "AdisyonEx Turuncu", primary: "#FF5500", secondary: "#FFF7ED" },
  { name: "McDonald's Fast-Food", primary: "#DC2626", secondary: "#FEF2F2" },
  { name: "Gurme Amber", primary: "#D97706", secondary: "#FFFBEB" },
  { name: "Zümrüt Yeşili", primary: "#059669", secondary: "#ECFDF5" },
  { name: "Gece Kömürü", primary: "#18181B", secondary: "#F4F4F5" },
  { name: "Lüks Rose", primary: "#E11D48", secondary: "#FFF1F2" },
  { name: "Okyanus Mavisi", primary: "#2563EB", secondary: "#EFF6FF" },
  { name: "Mor Karamel", primary: "#7C3AED", secondary: "#F5F3FF" },
];

export interface ThemeCustomizerModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly themeId: string;
  readonly themeName: string;
  readonly restaurantName: string;
  readonly logoUrl?: string | null;
  readonly initialCustomization: QrThemeCustomizationDTO;
  readonly menu?: MenuDTO | null;
  readonly previewTableLabel?: string;
  readonly onSaved?: () => void;
}

export function ThemeCustomizerModal({
  open,
  onOpenChange,
  themeId,
  themeName,
  restaurantName,
  logoUrl,
  initialCustomization,
  menu,
  previewTableLabel = "Masa 1",
  onSaved,
}: ThemeCustomizerModalProps) {
  const [primaryColor, setPrimaryColor] = useState(initialCustomization.qrPrimaryColor || "#FF5500");
  const [secondaryColor, setSecondaryColor] = useState(initialCustomization.qrSecondaryColor || "#FFF7ED");
  const [slidersEnabled, setSlidersEnabled] = useState(initialCustomization.qrSlidersEnabled ?? true);
  const [sliders, setSliders] = useState<QrSliderItem[]>(
    initialCustomization.qrSliders && initialCustomization.qrSliders.length > 0
      ? [...initialCustomization.qrSliders]
      : [
          {
            id: "slide-1",
            title: "Our Best Seller! 🔥",
            subtitle: "Loved by thousands, now it's your turn!",
            imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
            buttonText: "Order now",
            isActive: true,
            sortOrder: 1,
          },
        ],
  );

  const [greetingTitle, setGreetingTitle] = useState(
    initialCustomization.qrGreetingTitle || "Bugün Ne Yemek İstersiniz?",
  );
  const [greetingSubtitle, setGreetingSubtitle] = useState(
    initialCustomization.qrGreetingSubtitle || "Hoş Geldiniz 👋",
  );

  const [activeTab, setActiveTab] = useState<"colors" | "sliders" | "texts">("colors");
  const [saving, setSaving] = useState(false);

  // Sliders Management Handlers
  const handleAddSlide = () => {
    const newSlide: QrSliderItem = {
      id: `slide-${Date.now()}`,
      title: "Yeni Kampanya & Fırsat! 🎉",
      subtitle: "Günün özel menüsünü keşfedin",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
      buttonText: "Sipariş Ver",
      isActive: true,
      sortOrder: sliders.length + 1,
    };
    setSliders((prev) => [...prev, newSlide]);
    toast.success("Yeni slider eklendi");
  };

  const handleUpdateSlide = (id: string, updates: Partial<QrSliderItem>) => {
    setSliders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const handleDeleteSlide = (id: string) => {
    setSliders((prev) => prev.filter((s) => s.id !== id));
    toast.info("Slider silindi");
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sliders.length) return;
    const items = [...sliders];
    const [moved] = items.splice(index, 1);
    items.splice(newIdx, 0, moved);
    setSliders(items.map((it, idx) => ({ ...it, sortOrder: idx + 1 })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateQrThemeCustomizationAction({
        qrPrimaryColor: primaryColor,
        qrSecondaryColor: secondaryColor,
        qrSlidersEnabled: slidersEnabled,
        qrSliders: sliders,
        qrGreetingTitle: greetingTitle,
        qrGreetingSubtitle: greetingSubtitle,
      });

      if (res.success) {
        toast.success("Tema özelleştirmeleri başarıyla kaydedildi!", {
          description: "Renkler, başlıklar ve slider ayarları QR menüye uygulandı.",
        });
        if (onSaved) onSaved();
        onOpenChange(false);
      } else {
        toast.error("Kaydedilemedi: " + (res.error || "Hata oluştu"));
      }
    } catch {
      toast.error("İşlem sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl h-[90vh] p-0 overflow-hidden flex flex-col rounded-3xl border-2 border-border shadow-2xl">
        {/* Top Header */}
        <DialogHeader className="p-5 sm:px-6 sm:py-4 border-b bg-card shrink-0 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <PaletteIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>{themeName} Düzenleyici</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                  {themeId}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                QR menünüzün renklerini belirleyin, öne çıkan slider ve kampanya afişlerini yönetin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content Grid: Left Editor (Controls), Right Live Mini Mockup Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-background">
          
          {/* Left Controls Column (7 Cols) */}
          <div className="lg:col-span-7 overflow-y-auto p-5 sm:p-6 border-r border-border/80 space-y-6">
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "colors" | "sliders" | "texts")} className="w-full">
              <TabsList className="grid grid-cols-3 w-full p-1 bg-muted/80 rounded-2xl">
                <TabsTrigger value="colors" className="rounded-xl font-black text-xs gap-1.5 py-2">
                  <PaletteIcon className="size-3.5" />
                  <span>Renkler</span>
                </TabsTrigger>
                <TabsTrigger value="sliders" className="rounded-xl font-black text-xs gap-1.5 py-2">
                  <ImageIcon className="size-3.5" />
                  <span>Slider ({sliders.filter((s) => s.isActive).length})</span>
                </TabsTrigger>
                <TabsTrigger value="texts" className="rounded-xl font-black text-xs gap-1.5 py-2">
                  <TypeIcon className="size-3.5" />
                  <span>Başlık & Metin</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: COLORS */}
              <TabsContent value="colors" className="space-y-6 pt-4">
                {/* Preset Themes */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-foreground uppercase tracking-wider">
                    Hazır Popüler Renk Paletleri
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PRESET_COLORS.map((preset) => {
                      const isSelected = primaryColor.toLowerCase() === preset.primary.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(preset.primary);
                            setSecondaryColor(preset.secondary);
                          }}
                          className={cn(
                            "flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all text-left group cursor-pointer",
                            isSelected
                              ? "border-2 border-foreground ring-2 ring-primary/20 bg-muted/50"
                              : "border-border/80 hover:border-foreground/40 bg-card",
                          )}
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-xl shadow-xs" style={{ backgroundColor: preset.primary }}>
                            {isSelected && <CheckIcon className="size-3.5 text-white stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[11px] font-black text-foreground truncate">{preset.name}</span>
                            <span className="block text-[9px] font-mono text-muted-foreground">{preset.primary}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Colors Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/80">
                  
                  {/* Primary Color Picker */}
                  <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-foreground">Birincil Renk (Marka)</Label>
                      <span className="text-[11px] font-mono font-black text-muted-foreground">{primaryColor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="size-12 rounded-xl border border-border cursor-pointer p-0.5 bg-background shadow-xs"
                      />
                      <Input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono text-xs uppercase font-bold rounded-xl"
                        placeholder="#FF5500"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Butonlar, kategori hapları, rozetler ve ana aksanlarda kullanılır.
                    </p>
                  </div>

                  {/* Secondary Color Picker */}
                  <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-foreground">İkincil Renk (Vurgu / Zemin)</Label>
                      <span className="text-[11px] font-mono font-black text-muted-foreground">{secondaryColor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="size-12 rounded-xl border border-border cursor-pointer p-0.5 bg-background shadow-xs"
                      />
                      <Input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="font-mono text-xs uppercase font-bold rounded-xl"
                        placeholder="#FFF7ED"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Kart zeminleri, açık arka planlar ve yumuşak geçişlerde kullanılır.
                    </p>
                  </div>

                </div>
              </TabsContent>

              {/* TAB 2: SLIDERS & BANNERS */}
              <TabsContent value="sliders" className="space-y-4 pt-4">
                
                {/* Global Slider Switch */}
                <div className="p-4 rounded-2xl bg-card border flex items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-0.5">
                    <Label className="text-xs sm:text-sm font-black text-foreground">
                      Slider Alanını Göster
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      QR menünün üst kısmında öne çıkan kampanyaların döner afişini aktif/pasif yapın.
                    </p>
                  </div>
                  <Switch
                    checked={slidersEnabled}
                    onCheckedChange={setSlidersEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {/* Sliders List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-foreground uppercase tracking-wider">
                      Slayt Kartları ({sliders.length})
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSlide}
                      className="rounded-xl text-xs font-black gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PlusIcon className="size-3.5" />
                      <span>Yeni Slider Ekle</span>
                    </Button>
                  </div>

                  {sliders.length === 0 ? (
                    <div className="text-center py-8 p-4 rounded-2xl border-2 border-dashed bg-muted/20 space-y-2">
                      <ImageIcon className="size-8 mx-auto text-muted-foreground/50" />
                      <p className="text-xs font-bold text-muted-foreground">Henüz slider eklenmemiş.</p>
                      <Button size="sm" variant="outline" onClick={handleAddSlide} className="rounded-xl font-bold text-xs">
                        İlk Slaytı Ekle
                      </Button>
                    </div>
                  ) : (
                    sliders.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={cn(
                          "p-4 rounded-2xl border transition-all space-y-3 bg-card shadow-xs",
                          !slide.isActive && "opacity-60 bg-muted/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex size-6 items-center justify-center rounded-lg bg-muted text-xs font-mono font-black">
                              {index + 1}
                            </span>
                            <span className="text-xs font-black text-foreground truncate">{slide.title || "Başlıksız Slayt"}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Active/Inactive Toggle */}
                            <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-xl border">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {slide.isActive ? "Aktif" : "Pasif"}
                              </span>
                              <Switch
                                checked={slide.isActive}
                                onCheckedChange={(val) => handleUpdateSlide(slide.id, { isActive: val })}
                                className="scale-75"
                              />
                            </div>

                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveSlide(index, "up")}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUpIcon className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === sliders.length - 1}
                              onClick={() => handleMoveSlide(index, "down")}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDownIcon className="size-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                              title="Sil"
                            >
                              <Trash2Icon className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Slide Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">Slayt Başlığı</Label>
                            <Input
                              type="text"
                              value={slide.title}
                              onChange={(e) => handleUpdateSlide(slide.id, { title: e.target.value })}
                              placeholder="Our Best Seller! 🔥"
                              className="h-8 text-xs font-bold rounded-xl mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">Buton Metni</Label>
                            <Input
                              type="text"
                              value={slide.buttonText || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, { buttonText: e.target.value })}
                              placeholder="Sipariş Ver"
                              className="h-8 text-xs font-bold rounded-xl mt-1"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <Label className="text-[10px] font-bold text-muted-foreground">Alt Açıklama / Kampanya Notu</Label>
                            <Input
                              type="text"
                              value={slide.subtitle || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, { subtitle: e.target.value })}
                              placeholder="En çok tercih edilen lezzetlerde %20 indirim!"
                              className="h-8 text-xs rounded-xl mt-1"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <Label className="text-[10px] font-bold text-muted-foreground">Görsel URL Adresi</Label>
                            <Input
                              type="text"
                              value={slide.imageUrl || ""}
                              onChange={(e) => handleUpdateSlide(slide.id, { imageUrl: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                              className="h-8 text-xs font-mono rounded-xl mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </TabsContent>

              {/* TAB 3: TEXTS & GREETINGS */}
              <TabsContent value="texts" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                    <div>
                      <Label className="text-xs font-black text-foreground">
                        Ana Karşılama Başlığı (Slider Üstü)
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Ana sayfada slider ve menülerin hemen üzerinde yer alan büyük karşılama başlığıdır.
                      </p>
                    </div>

                    <Input
                      type="text"
                      value={greetingTitle}
                      onChange={(e) => setGreetingTitle(e.target.value)}
                      placeholder="Bugün Ne Yemek İstersiniz?"
                      className="h-10 text-sm font-bold rounded-xl"
                    />

                    {/* Quick Suggestion Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Hızlı Örnekler (Tıklayıp Seçin):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Bugün Ne Yemek İstersiniz?",
                          "Acıktınız mı? Hemen Keşfedin 🔥",
                          "Günün Enfes Lezzetleri 🍽️",
                          "Canınız Ne Çekti? 🍕🍔",
                          "What meal Do You Want?",
                        ].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setGreetingTitle(sug)}
                            className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-bold text-foreground hover:bg-muted/80 border border-border/60 transition-all cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                    <div>
                      <Label className="text-xs font-black text-foreground">
                        Karşılama Alt Başlığı / Selamlama
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Başlığın üzerinde küçük puntolarla beliren selamlama metnidir.
                      </p>
                    </div>

                    <Input
                      type="text"
                      value={greetingSubtitle}
                      onChange={(e) => setGreetingSubtitle(e.target.value)}
                      placeholder="Hoş Geldiniz 👋"
                      className="h-10 text-sm font-bold rounded-xl"
                    />

                    {/* Quick Suggestion Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Hızlı Örnekler:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Hoş Geldiniz 👋",
                          "Taze & Sıcak Lezzetler 🔥",
                          "Günün Özel Menüsü",
                          "Masaya Özel Servis ✨",
                        ].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setGreetingSubtitle(sug)}
                            className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-bold text-foreground hover:bg-muted/80 border border-border/60 transition-all cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </div>

          {/* Right Live Mini Mockup Preview (5 Cols) */}
          <div className="lg:col-span-5 bg-muted/20 p-5 flex flex-col items-center justify-center border-l border-border/80 overflow-y-auto">
            <div className="w-full max-w-[280px] space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-foreground px-1">
                <span className="flex items-center gap-1.5">
                  <SmartphoneIcon className="size-3.5 text-primary" />
                  <span>Canlı Önizleme</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Anlık Değişiklik</span>
              </div>

              {/* Interactive Theme 02 Mini Preview */}
              <div
                className="w-full h-[460px] rounded-[36px] bg-[#f8f8f9] p-3 border-4 border-zinc-800 shadow-2xl flex flex-col justify-between overflow-hidden select-none"
                style={{
                  ["--theme-primary" as string]: primaryColor,
                  ["--theme-secondary" as string]: secondaryColor,
                }}
              >
                {/* Mockup Notch */}
                <div className="w-20 h-3.5 mx-auto bg-zinc-900 rounded-full mb-1 shrink-0" />

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-none pr-0.5">
                  
                  {/* Top Bar */}
                  <div className="bg-white rounded-xl p-2 shadow-2xs flex items-center justify-between gap-2 border border-zinc-150">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="size-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        🍔
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[10px] font-black text-zinc-900 truncate">{restaurantName}</h4>
                        <span className="text-[8px] font-bold text-zinc-400 block">{previewTableLabel}</span>
                      </div>
                    </div>
                    <div className="w-16 bg-zinc-100 rounded-md py-0.5 px-1.5 text-[8px] text-zinc-400">
                      Ara...
                    </div>
                  </div>

                  {/* Greeting */}
                  <div>
                    <span className="text-[8px] font-bold text-zinc-400 block">{greetingSubtitle || "Hoş Geldiniz 👋"}</span>
                    <h3 className="text-[11px] font-black text-zinc-900 leading-tight">{greetingTitle || "Bugün Ne Yemek İstersiniz?"}</h3>
                  </div>

                  {/* Hero Slider Banner */}
                  {slidersEnabled && sliders.filter((s) => s.isActive).length > 0 && (
                    <div
                      className="relative rounded-2xl p-2.5 text-white overflow-hidden shadow-sm flex items-center justify-between gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-[10px] font-black leading-tight truncate">
                          {sliders.find((s) => s.isActive)?.title || "Our Best Seller! 🔥"}
                        </h4>
                        <p className="text-[8px] text-white/80 line-clamp-1">
                          {sliders.find((s) => s.isActive)?.subtitle || "Şimdi indirimde!"}
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-white text-zinc-950 font-black text-[8px] shadow-2xs mt-1">
                          {sliders.find((s) => s.isActive)?.buttonText || "Sipariş Ver"}
                        </span>
                      </div>
                      <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
                        🍔
                      </div>
                    </div>
                  )}

                  {/* Categories Row */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    <span
                      className="px-2 py-0.5 rounded-full text-white font-black text-[9px] shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Burgerler
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-zinc-600 border border-zinc-200 font-bold text-[9px] shrink-0">
                      Pizzalar
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-zinc-600 border border-zinc-200 font-bold text-[9px] shrink-0">
                      Tatlılar
                    </span>
                  </div>

                  {/* Product Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-2xl p-2 shadow-2xs border border-zinc-150 flex flex-col items-center text-center gap-1">
                      <div className="size-12 rounded-xl bg-zinc-50 flex items-center justify-center text-xl">
                        🍔
                      </div>
                      <span className="text-[9px] font-black text-zinc-900 truncate w-full">Jumbo Burger</span>
                      <span
                        className="px-2 py-0.5 rounded-full font-black text-[8px] tabular-nums"
                        style={{ backgroundColor: secondaryColor, color: primaryColor }}
                      >
                        280,00 ₺
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl p-2 shadow-2xs border border-zinc-150 flex flex-col items-center text-center gap-1">
                      <div className="size-12 rounded-xl bg-zinc-50 flex items-center justify-center text-xl">
                        🍕
                      </div>
                      <span className="text-[9px] font-black text-zinc-900 truncate w-full">Margherita</span>
                      <span
                        className="px-2 py-0.5 rounded-full font-black text-[8px] tabular-nums"
                        style={{ backgroundColor: secondaryColor, color: primaryColor }}
                      >
                        240,00 ₺
                      </span>
                    </div>
                  </div>

                </div>

                {/* Floating Bottom Nav Bar */}
                <div className="bg-white rounded-2xl p-1.5 shadow-md border border-zinc-150 flex items-center justify-around shrink-0 mt-1">
                  <span className="text-[9px] font-black" style={{ color: primaryColor }}>🏠 Ana Sayfa</span>
                  <span className="text-[9px] font-bold text-zinc-400">🔲 Menü</span>
                  <span className="text-[9px] font-bold text-zinc-400">🛍️ Sepet (2)</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 sm:px-6 bg-card border-t shrink-0 flex flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold text-xs cursor-pointer"
          >
            Vazgeç
          </Button>

          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-xl font-black text-xs gap-1.5 cursor-pointer shadow-md text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? "Kaydediliyor…" : "Kaydet ve Temaya Uygula ✓"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
