"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Grid2X2Icon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  PaletteIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SmartphoneIcon,
  SparklesIcon,
  Trash2Icon,
  TypeIcon,
  UploadCloudIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateQrThemeCustomizationAction,
  uploadSliderImageAction,
} from "@/actions/settings.actions";
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
import type {
  QrHomeSection,
  QrSectionDisplayStyle,
  QrSectionType,
  QrSliderItem,
  QrThemeCustomizationDTO,
} from "@/services/restaurant-settings.service";
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
  initialCustomization,
  menu,
  previewTableLabel = "Masa 1",
  onSaved,
}: ThemeCustomizerModalProps) {
  const [primaryColor, setPrimaryColor] = useState(
    initialCustomization.qrPrimaryColor || "#FF5500",
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialCustomization.qrSecondaryColor || "#FFF7ED",
  );
  const [slidersEnabled, setSlidersEnabled] = useState(
    initialCustomization.qrSlidersEnabled ?? true,
  );
  const [qrAiEnabled, setQrAiEnabled] = useState(
    initialCustomization.qrAiEnabled ?? true,
  );
  const [sliders, setSliders] = useState<QrSliderItem[]>(
    initialCustomization.qrSliders && initialCustomization.qrSliders.length > 0
      ? [...initialCustomization.qrSliders]
      : [
          {
            id: "slide-1",
            title: "Our Best Seller! 🔥",
            subtitle: "Loved by thousands, now it's your turn!",
            imageUrl:
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
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

  // Home Layout Sections State
  const [homeSections, setHomeSections] = useState<QrHomeSection[]>(() => {
    if (
      initialCustomization.qrHomeSections &&
      initialCustomization.qrHomeSections.length > 0
    ) {
      return [...initialCustomization.qrHomeSections];
    }
    // Default: generate from categories if available
    if (menu?.categories && menu.categories.length > 0) {
      return menu.categories.map((c, idx) => ({
        id: `sec-cat-${c.id}`,
        type: "category" as QrSectionType,
        categoryId: c.id,
        title: c.name,
        displayStyle: "list" as QrSectionDisplayStyle,
        isActive: true,
        sortOrder: idx + 1,
      }));
    }
    return [
      {
        id: "sec-default-popular",
        type: "custom",
        title: "Popüler Lezzetler",
        subtitle: "En çok tercih edilen enfes tatlar",
        displayStyle: "list",
        isActive: true,
        sortOrder: 1,
        itemIds: menu?.items.slice(0, 5).map((it) => it.id) || [],
      },
    ];
  });

  const [activeTab, setActiveTab] = useState<
    "colors" | "sliders" | "texts" | "sections"
  >("colors");
  const [saving, setSaving] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);

  // Section Creation / Editing Modal State
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionType, setSectionType] = useState<QrSectionType>("category");
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionSubtitle, setSectionSubtitle] = useState("");
  const [sectionCategoryId, setSectionCategoryId] = useState("");
  const [sectionDisplayStyle, setSectionDisplayStyle] =
    useState<QrSectionDisplayStyle>("list");
  const [sectionItemIds, setSectionItemIds] = useState<string[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Sliders Drag & Drop File Upload Handler
  const handleFileUpload = async (slideId: string, file: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Yalnızca JPG, PNG veya WebP görselleri yüklenebilir.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Görsel boyutu en fazla 5MB olabilir.");
      return;
    }
    setUploadingSlideId(slideId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadSliderImageAction(formData);
      if (res.success && res.data) {
        handleUpdateSlide(slideId, { imageUrl: res.data });
        toast.success("Görsel başarıyla yüklendi!");
      } else {
        toast.error("Görsel yüklenemedi: " + (res.error || "Hata oluştu"));
      }
    } catch {
      toast.error("Görsel yüklenirken bir hata oluştu.");
    } finally {
      setUploadingSlideId(null);
    }
  };

  // Sliders Management Handlers
  const handleAddSlide = () => {
    const newSlide: QrSliderItem = {
      id: `slide-${Date.now()}`,
      title: "Günün Fırsatı! 🔥",
      subtitle: "Şefin özel tarifiyle hazırlandı",
      imageUrl:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
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

  // Home Sections Management Handlers
  const handleOpenAddSection = () => {
    setEditingSectionId(null);
    setSectionType("category");
    setSectionTitle("");
    setSectionSubtitle("");
    setSectionCategoryId(menu?.categories[0]?.id || "");
    setSectionDisplayStyle("list");
    setSectionItemIds([]);
    setProductSearchQuery("");
    setSectionDialogOpen(true);
  };

  const handleOpenEditSection = (sec: QrHomeSection) => {
    setEditingSectionId(sec.id);
    setSectionType(sec.type);
    setSectionTitle(sec.title);
    setSectionSubtitle(sec.subtitle || "");
    setSectionCategoryId(sec.categoryId || menu?.categories[0]?.id || "");
    setSectionDisplayStyle(sec.displayStyle);
    setSectionItemIds(sec.itemIds ? [...sec.itemIds] : []);
    setProductSearchQuery("");
    setSectionDialogOpen(true);
  };

  const handleSaveSection = () => {
    let finalTitle = sectionTitle.trim();
    if (!finalTitle) {
      if (sectionType === "category") {
        const cat = menu?.categories.find((c) => c.id === sectionCategoryId);
        finalTitle = cat ? cat.name : "Kategori Bölümü";
      } else {
        finalTitle = "Özel Koleksiyon";
      }
    }

    if (editingSectionId) {
      // Update existing
      setHomeSections((prev) =>
        prev.map((s) =>
          s.id === editingSectionId
            ? {
                ...s,
                type: sectionType,
                title: finalTitle,
                subtitle: sectionSubtitle.trim() || undefined,
                categoryId:
                  sectionType === "category" ? sectionCategoryId : undefined,
                itemIds:
                  sectionType === "custom" ? sectionItemIds : undefined,
                displayStyle: sectionDisplayStyle,
              }
            : s,
        ),
      );
      toast.success("Bölüm güncellendi");
    } else {
      // Create new
      const newSec: QrHomeSection = {
        id: `sec-${Date.now()}`,
        type: sectionType,
        title: finalTitle,
        subtitle: sectionSubtitle.trim() || undefined,
        categoryId:
          sectionType === "category" ? sectionCategoryId : undefined,
        itemIds: sectionType === "custom" ? sectionItemIds : undefined,
        displayStyle: sectionDisplayStyle,
        isActive: true,
        sortOrder: homeSections.length + 1,
      };
      setHomeSections((prev) => [...prev, newSec]);
      toast.success("Yeni bölüm eklendi");
    }
    setSectionDialogOpen(false);
  };

  const handleDeleteSection = (id: string) => {
    setHomeSections((prev) => prev.filter((s) => s.id !== id));
    toast.info("Bölüm kaldırıldı");
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= homeSections.length) return;
    const items = [...homeSections];
    const [moved] = items.splice(index, 1);
    items.splice(newIdx, 0, moved);
    setHomeSections(items.map((it, idx) => ({ ...it, sortOrder: idx + 1 })));
  };

  const handleAutoGenerateSections = () => {
    if (!menu?.categories || menu.categories.length === 0) {
      toast.error("Menünüzde kategori bulunamadı.");
      return;
    }
    const generated: QrHomeSection[] = menu.categories.map((c, idx) => ({
      id: `sec-cat-${c.id}`,
      type: "category",
      categoryId: c.id,
      title: c.name,
      displayStyle: "list",
      isActive: true,
      sortOrder: idx + 1,
    }));
    setHomeSections(generated);
    toast.success("Kategoriler ana sayfa bölümlerine dönüştürüldü!");
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
        qrHomeSections: homeSections,
        qrAiEnabled: qrAiEnabled,
      });

      if (res.success) {
        toast.success("Tema özelleştirmeleri başarıyla kaydedildi!", {
          description:
            "Renkler, ana sayfa yerleşim düzeni, stiller ve slider ayarları QR menüye uygulandı.",
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

  // Filtered products for custom collection picker
  const filteredMenuItems = useMemo(() => {
    if (!menu?.items) return [];
    if (!productSearchQuery.trim()) return menu.items;
    const q = productSearchQuery.toLowerCase();
    return menu.items.filter((it) => it.name.toLowerCase().includes(q));
  }, [menu, productSearchQuery]);

  const isTheme1 = themeId === "MODERN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] sm:max-w-6xl h-[92vh] p-0 overflow-hidden flex flex-col rounded-3xl border-2 border-border shadow-2xl">
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
                {isTheme1
                  ? "Tema 01'in marka renklerini ve ana aksanlarını özelleştirin."
                  : "Renkler, slider afişleri, karşılama başlıkları ve ana sayfa kategori listeleme düzenini özelleştirin."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content Grid: Left Editor (Controls), Right Live Mini Mockup Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-background">
          {/* Left Controls Column (7 Cols) */}
          <div className="lg:col-span-7 overflow-y-auto p-5 sm:p-6 border-r border-border/80 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(
                  v as "colors" | "sliders" | "texts" | "sections",
                )
              }
              className="w-full"
            >
              <TabsList
                className={cn(
                  "grid w-full p-1 bg-muted/80 rounded-2xl",
                  isTheme1 ? "grid-cols-1" : "grid-cols-4",
                )}
              >
                <TabsTrigger
                  value="colors"
                  className="rounded-xl font-black text-[11px] sm:text-xs gap-1 py-2"
                >
                  <PaletteIcon className="size-3.5" />
                  <span>Renkler</span>
                </TabsTrigger>

                {!isTheme1 && (
                  <>
                    <TabsTrigger
                      value="sliders"
                      className="rounded-xl font-black text-[11px] sm:text-xs gap-1 py-2"
                    >
                      <ImageIcon className="size-3.5" />
                      <span>
                        Slider (
                        {sliders.filter((s) => s.isActive).length})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="texts"
                      className="rounded-xl font-black text-[11px] sm:text-xs gap-1 py-2"
                    >
                      <TypeIcon className="size-3.5" />
                      <span>Başlıklar</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="sections"
                      className="rounded-xl font-black text-[11px] sm:text-xs gap-1 py-2"
                    >
                      <LayoutGridIcon className="size-3.5" />
                      <span>
                        Sayfa Düzeni ({homeSections.length})
                      </span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* TAB 1: COLORS */}
              <TabsContent value="colors" className="space-y-6 pt-4">
                <div className="space-y-2.5">
                  <Label className="text-xs font-black text-foreground uppercase tracking-wider">
                    Hazır Popüler Renk Paletleri
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PRESET_COLORS.map((preset) => {
                      const isSelected =
                        primaryColor.toLowerCase() ===
                        preset.primary.toLowerCase();
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
                          <div
                            className="flex size-7 shrink-0 items-center justify-center rounded-xl shadow-xs"
                            style={{ backgroundColor: preset.primary }}
                          >
                            {isSelected && (
                              <CheckIcon className="size-3.5 text-white stroke-[3]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[11px] font-black text-foreground truncate">
                              {preset.name}
                            </span>
                            <span className="block text-[9px] font-mono text-muted-foreground">
                              {preset.primary}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/80">
                  <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-foreground">
                        Birincil Renk (Marka)
                      </Label>
                      <span className="text-[11px] font-mono font-black text-muted-foreground">
                        {primaryColor}
                      </span>
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
                      Butonlar, kategori hapları, rozetler ve ana aksanlarda
                      kullanılır.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-foreground">
                        İkincil Renk (Vurgu / Zemin)
                      </Label>
                      <span className="text-[11px] font-mono font-black text-muted-foreground">
                        {secondaryColor}
                      </span>
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
                      Kart zeminleri, açık arka planlar ve yumuşak geçişlerde
                      kullanılır.
                    </p>
                  </div>
                </div>

                {/* QR Menü AI Asistanı Toggle */}
                <div className="p-4 rounded-2xl bg-card border flex items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <SparklesIcon className="size-5" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                        QR Menü Akıllı AI Asistanı
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-primary/20 text-primary uppercase">
                          Yeni
                        </span>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Müşterilerinize menü önerisi, alerjen/diyet danışmanlığı sunan ve sepete tek tıkla ürün ekleten interaktif yapay zeka asistanını aktifleştirin.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={qrAiEnabled}
                    onCheckedChange={setQrAiEnabled}
                    className="data-[state=checked]:bg-primary shrink-0"
                  />
                </div>
              </TabsContent>

              {/* TAB 2: SLIDERS & BANNERS (With Drag & Drop Upload & No Image Option) */}
              <TabsContent value="sliders" className="space-y-4 pt-4">
                <div className="p-4 rounded-2xl bg-card border flex items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-0.5">
                    <Label className="text-xs sm:text-sm font-black text-foreground">
                      Slider Alanını Göster
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      QR menünün üst kısmında öne çıkan kampanyaların döner
                      afişini aktif/pasif yapın.
                    </p>
                  </div>
                  <Switch
                    checked={slidersEnabled}
                    onCheckedChange={setSlidersEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {/* Recommended Dimensions Banner */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                  <span className="text-base shrink-0">📐</span>
                  <div>
                    <span className="font-black block">
                      Önerilen Slider Görsel Boyutu:
                    </span>
                    <span className="text-[11px] opacity-90 leading-relaxed block mt-0.5">
                      <strong>600x400 px (3:2)</strong> veya{" "}
                      <strong>800x600 px (4:3)</strong> — Maksimum 5MB (JPG,
                      PNG, WebP). Görsel yüklemek istemezseniz &quot;Görsel
                      Olmasın&quot; seçeneğini açabilirsiniz.
                    </span>
                  </div>
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
                      className="rounded-xl text-xs font-black gap-1.5 cursor-pointer shadow-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <PlusIcon className="size-3.5" />
                      <span>Yeni Slider Ekle</span>
                    </Button>
                  </div>

                  {sliders.length === 0 ? (
                    <div className="text-center py-8 p-4 rounded-2xl border-2 border-dashed bg-muted/20 space-y-2">
                      <ImageIcon className="size-8 mx-auto text-muted-foreground/50" />
                      <p className="text-xs font-bold text-muted-foreground">
                        Henüz slider eklenmemiş.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddSlide}
                        className="rounded-xl font-bold text-xs"
                      >
                        İlk Slaytı Ekle
                      </Button>
                    </div>
                  ) : (
                    sliders.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={cn(
                          "p-4 rounded-3xl border transition-all space-y-3 bg-card shadow-xs",
                          !slide.isActive && "opacity-60 bg-muted/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex size-6 items-center justify-center rounded-lg bg-muted text-xs font-mono font-black">
                              {index + 1}
                            </span>
                            <span className="text-xs font-black text-foreground truncate">
                              {slide.title || "Başlıksız Slayt"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-xl border">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {slide.isActive ? "Aktif" : "Pasif"}
                              </span>
                              <Switch
                                checked={slide.isActive}
                                onCheckedChange={(val) =>
                                  handleUpdateSlide(slide.id, {
                                    isActive: val,
                                  })
                                }
                                className="scale-75"
                              />
                            </div>

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

                        {/* Slide Fields & Drag Drop Image */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">
                              Slayt Başlığı
                            </Label>
                            <Input
                              type="text"
                              value={slide.title}
                              onChange={(e) =>
                                handleUpdateSlide(slide.id, {
                                  title: e.target.value,
                                })
                              }
                              placeholder="Günün Lezzeti! 🔥"
                              className="h-8 text-xs font-bold rounded-xl mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">
                              Buton Metni
                            </Label>
                            <Input
                              type="text"
                              value={slide.buttonText || ""}
                              onChange={(e) =>
                                handleUpdateSlide(slide.id, {
                                  buttonText: e.target.value,
                                })
                              }
                              placeholder="Sipariş Ver"
                              className="h-8 text-xs font-bold rounded-xl mt-1"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <Label className="text-[10px] font-bold text-muted-foreground">
                              Alt Açıklama / Kampanya Notu
                            </Label>
                            <Input
                              type="text"
                              value={slide.subtitle || ""}
                              onChange={(e) =>
                                handleUpdateSlide(slide.id, {
                                  subtitle: e.target.value,
                                })
                              }
                              placeholder="Şefin özel tarifiyle hazırlandı!"
                              className="h-8 text-xs rounded-xl mt-1"
                            />
                          </div>

                          {/* Image Dropzone & "Görsel Olmasın" Toggle */}
                          <div className="sm:col-span-2 space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] font-bold text-muted-foreground">
                                Slayt Görseli
                              </Label>
                              <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!slide.imageUrl}
                                  onChange={(e) =>
                                    handleUpdateSlide(slide.id, {
                                      imageUrl: e.target.checked
                                        ? ""
                                        : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
                                    })
                                  }
                                  className="rounded text-primary"
                                />
                                <span>Görsel Olmasın (Sadece Metin Kartı)</span>
                              </label>
                            </div>

                            {slide.imageUrl ? (
                              <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20">
                                {/* Thumbnail */}
                                <div className="relative size-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border">
                                  <Image
                                    src={slide.imageUrl}
                                    alt="Slider preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>

                                <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-left">
                                  <Input
                                    type="text"
                                    value={slide.imageUrl}
                                    onChange={(e) =>
                                      handleUpdateSlide(slide.id, {
                                        imageUrl: e.target.value,
                                      })
                                    }
                                    placeholder="https://..."
                                    className="h-7 text-[11px] font-mono rounded-lg"
                                  />

                                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                                    {/* File Input */}
                                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border text-[10px] font-bold text-foreground hover:bg-muted cursor-pointer transition-colors">
                                      <UploadCloudIcon className="size-3" />
                                      <span>
                                        {uploadingSlideId === slide.id
                                          ? "Yükleniyor…"
                                          : "Farklı Görsel Yükle / Sürükle"}
                                      </span>
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        disabled={uploadingSlideId === slide.id}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file)
                                            handleFileUpload(slide.id, file);
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateSlide(slide.id, {
                                          imageUrl: "",
                                        })
                                      }
                                      className="text-[10px] text-red-500 font-bold hover:underline"
                                    >
                                      Görseli Kaldır
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) handleFileUpload(slide.id, file);
                                }}
                                className="p-4 rounded-2xl border-2 border-dashed border-border/90 bg-muted/10 text-center space-y-1.5 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                              >
                                <UploadCloudIcon className="size-6 text-muted-foreground/60" />
                                <span className="text-xs font-bold text-foreground">
                                  Görseli buraya sürükleyin veya seçin
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  PNG, JPG, WebP (Maksimum 5MB)
                                </span>
                                <label className="mt-1 px-3 py-1 rounded-xl bg-card border text-xs font-bold text-foreground hover:bg-muted cursor-pointer">
                                  <span>Dosya Seç</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file)
                                        handleFileUpload(slide.id, file);
                                    }}
                                  />
                                </label>
                              </div>
                            )}
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
                        Ana sayfada slider ve menülerin hemen üzerinde yer alan
                        büyük karşılama başlığıdır.
                      </p>
                    </div>

                    <Input
                      type="text"
                      value={greetingTitle}
                      onChange={(e) => setGreetingTitle(e.target.value)}
                      placeholder="Bugün Ne Yemek İstersiniz?"
                      className="h-10 text-sm font-bold rounded-xl"
                    />

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
                        Başlığın üzerinde küçük puntolarla beliren selamlama
                        metnidir.
                      </p>
                    </div>

                    <Input
                      type="text"
                      value={greetingSubtitle}
                      onChange={(e) => setGreetingSubtitle(e.target.value)}
                      placeholder="Hoş Geldiniz 👋"
                      className="h-10 text-sm font-bold rounded-xl"
                    />

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

              {/* TAB 4: SECTIONS & HOME LAYOUT BUILDER */}
              <TabsContent value="sections" className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-4 rounded-2xl bg-card border shadow-xs">
                  <div className="space-y-0.5">
                    <Label className="text-xs sm:text-sm font-black text-foreground">
                      Ana Sayfa Bölüm ve Stilleri
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Ana sayfada kategori ve özel listelerin sırasını ve
                      listeleme stilini (Liste, 2&apos;li Kart veya Slider)
                      belirleyin.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoGenerateSections}
                      className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                    >
                      <RotateCcwIcon className="size-3.5" />
                      <span>Kategorileri Doldur</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenAddSection}
                      className="rounded-xl text-xs font-black gap-1.5 cursor-pointer shadow-xs text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <PlusIcon className="size-3.5" />
                      <span>Yeni Bölüm Ekle</span>
                    </Button>
                  </div>
                </div>

                {/* Sections List */}
                <div className="space-y-3">
                  {homeSections.length === 0 ? (
                    <div className="text-center py-10 p-6 rounded-3xl border-2 border-dashed bg-muted/20 space-y-3">
                      <LayoutGridIcon className="size-10 mx-auto text-muted-foreground/50" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-foreground">
                          Henüz Ana Sayfa Bölümü Eklenmedi
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Kategori başlıkları veya &quot;En Sevilenler&quot; gibi
                          özel ürün koleksiyonları oluşturarak ana sayfanızı
                          zenginleştirebilirsiniz.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAutoGenerateSections}
                          className="rounded-xl text-xs font-bold"
                        >
                          Tüm Kategorileri Ekle
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleOpenAddSection}
                          className="rounded-xl text-xs font-black text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Özel Bölüm Oluştur
                        </Button>
                      </div>
                    </div>
                  ) : (
                    homeSections.map((sec, idx) => {
                      const categoryName =
                        sec.type === "category"
                          ? menu?.categories.find(
                              (c) => c.id === sec.categoryId,
                            )?.name || "Bilinmeyen Kategori"
                          : null;

                      const customCount = sec.itemIds?.length || 0;

                      return (
                        <div
                          key={sec.id}
                          className={cn(
                            "p-4 rounded-3xl border transition-all bg-card shadow-xs space-y-2.5",
                            !sec.isActive && "opacity-50 bg-muted/30",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Left Info */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="flex size-7 items-center justify-center rounded-xl bg-muted text-xs font-mono font-black shrink-0">
                                {idx + 1}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-black text-foreground truncate">
                                    {sec.title}
                                  </h4>

                                  {/* Type Badge */}
                                  {sec.type === "category" ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                      📂 {categoryName}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                      ⭐ Özel Koleksiyon ({customCount} Ürün)
                                    </span>
                                  )}

                                  {/* Style Badge */}
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0"
                                    style={{
                                      backgroundColor: secondaryColor,
                                      color: primaryColor,
                                    }}
                                  >
                                    {sec.displayStyle === "list" && "📜 Liste"}
                                    {sec.displayStyle === "grid" &&
                                      "🎴 2'li Kart"}
                                    {sec.displayStyle === "slider" &&
                                      "🎠 Slider"}
                                  </span>
                                </div>

                                {sec.subtitle && (
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {sec.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-xl border">
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {sec.isActive ? "Aktif" : "Pasif"}
                                </span>
                                <Switch
                                  checked={sec.isActive}
                                  onCheckedChange={(val) =>
                                    setHomeSections((prev) =>
                                      prev.map((s) =>
                                        s.id === sec.id
                                          ? { ...s, isActive: val }
                                          : s,
                                      ),
                                    )
                                  }
                                  className="scale-75"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSection(idx, "up")}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUpIcon className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === homeSections.length - 1}
                                onClick={() => handleMoveSection(idx, "down")}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDownIcon className="size-3.5" />
                              </button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditSection(sec)}
                                className="h-7 px-2 text-[11px] font-bold rounded-lg cursor-pointer"
                              >
                                Düzenle
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSection(sec.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                                title="Sil"
                              >
                                <Trash2Icon className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
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
                <span className="text-[10px] font-mono text-muted-foreground">
                  Anlık Değişiklik
                </span>
              </div>

              {/* Interactive Theme 02 Mini Preview */}
              <div
                className="w-full h-[470px] rounded-[36px] bg-[#f8f8f9] p-3 border-4 border-zinc-800 shadow-2xl flex flex-col justify-between overflow-hidden select-none"
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
                        <h4 className="text-[10px] font-black text-zinc-900 truncate">
                          {restaurantName}
                        </h4>
                        <span className="text-[8px] font-bold text-zinc-400 block">
                          {previewTableLabel}
                        </span>
                      </div>
                    </div>
                    <div className="w-16 bg-zinc-100 rounded-md py-0.5 px-1.5 text-[8px] text-zinc-400">
                      Ara...
                    </div>
                  </div>

                  {isTheme1 ? (
                    /* TEMA 01 MINI PREVIEW (Orijinal Tasarım - Slider Yok) */
                    <div className="space-y-2.5 pt-1">
                      {/* Category Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                        <span
                          className="px-2.5 py-1 rounded-xl text-white font-black text-[9px] shadow-2xs shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Tümü
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-white text-zinc-600 border border-zinc-200 font-bold text-[9px] shrink-0">
                          Ana Yemekler
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-white text-zinc-600 border border-zinc-200 font-bold text-[9px] shrink-0">
                          İçecekler
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5">
                        {[
                          { name: "Özel Hamburger Menü", price: "240 ₺", icon: "🍔" },
                          { name: "Taş Fırın Pizza", price: "280 ₺", icon: "🍕" },
                          { name: "Çıtır Tavuk Sepeti", price: "190 ₺", icon: "🍗" },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl p-2 shadow-2xs border border-zinc-150 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="size-8 rounded-xl bg-zinc-50 flex items-center justify-center text-sm shrink-0">
                                {item.icon}
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-[9px] font-black text-zinc-900 truncate">
                                  {item.name}
                                </h5>
                                <span
                                  className="text-[8px] font-bold block"
                                  style={{ color: primaryColor }}
                                >
                                  {item.price}
                                </span>
                              </div>
                            </div>
                            <span
                              className="size-5 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                              style={{ backgroundColor: primaryColor }}
                            >
                              +
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* TEMA 02 MINI PREVIEW (Fast-Food, Slider & Bölümler) */
                    <>
                      {/* Greeting */}
                      <div>
                        <span className="text-[8px] font-bold text-zinc-400 block">
                          {greetingSubtitle || "Hoş Geldiniz 👋"}
                        </span>
                        <h3 className="text-[11px] font-black text-zinc-900 leading-tight">
                          {greetingTitle || "Bugün Ne Yemek İstersiniz?"}
                        </h3>
                      </div>

                      {/* Hero Slider Banner */}
                      {slidersEnabled &&
                        sliders.filter((s) => s.isActive).length > 0 && (
                          <div
                            className="relative rounded-2xl p-2.5 text-white overflow-hidden shadow-sm flex items-center justify-between gap-2"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="text-[10px] font-black leading-tight truncate">
                                {sliders.find((s) => s.isActive)?.title ||
                                  "Günün Fırsatı! 🔥"}
                              </h4>
                              <p className="text-[8px] text-white/80 line-clamp-1">
                                {sliders.find((s) => s.isActive)?.subtitle ||
                                  "Şimdi indirimde!"}
                              </p>
                              <span className="inline-block px-2 py-0.5 rounded-full bg-white text-zinc-950 font-black text-[8px] shadow-2xs mt-1">
                                {sliders.find((s) => s.isActive)?.buttonText ||
                                  "Sipariş Ver"}
                              </span>
                            </div>
                            {sliders.find((s) => s.isActive)?.imageUrl ? (
                              <div className="relative size-12 rounded-xl overflow-hidden bg-white/20 shrink-0">
                                <Image
                                  src={
                                    sliders.find((s) => s.isActive)!.imageUrl!
                                  }
                                  alt="Slide"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                                🍔
                              </div>
                            )}
                          </div>
                        )}

                      {/* Render Live Sections in Preview */}
                      <div className="space-y-3 pt-1">
                        {homeSections
                          .filter((s) => s.isActive)
                          .slice(0, 3)
                          .map((sec) => {
                            return (
                              <div key={sec.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-zinc-900">
                                    {sec.title}
                                  </span>
                                  <span className="text-[8px] font-bold text-zinc-400">
                                    {sec.displayStyle === "slider"
                                      ? "Kaydır →"
                                      : "Tümü"}
                                  </span>
                                </div>

                                {sec.displayStyle === "slider" ? (
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                    {[1, 2, 3].map((k) => (
                                      <div
                                        key={k}
                                        className="w-24 shrink-0 bg-white rounded-xl p-1.5 shadow-2xs border border-zinc-150 text-center space-y-0.5"
                                      >
                                        <div className="size-8 mx-auto rounded-lg bg-zinc-50 flex items-center justify-center text-base">
                                          🍔
                                        </div>
                                        <span className="text-[8px] font-black text-zinc-900 block truncate">
                                          Lezzet {k}
                                        </span>
                                        <span
                                          className="text-[7px] font-bold block tabular-nums"
                                          style={{ color: primaryColor }}
                                        >
                                          180 ₺
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : sec.displayStyle === "grid" ? (
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {[1, 2].map((k) => (
                                      <div
                                        key={k}
                                        className="bg-white rounded-xl p-1.5 shadow-2xs border border-zinc-150 flex flex-col items-center text-center gap-0.5"
                                      >
                                        <div className="size-10 rounded-lg bg-zinc-50 flex items-center justify-center text-lg">
                                          🍕
                                        </div>
                                        <span className="text-[8px] font-black text-zinc-900 truncate w-full">
                                          Ürün {k}
                                        </span>
                                        <span
                                          className="text-[7px] font-bold tabular-nums"
                                          style={{ color: primaryColor }}
                                        >
                                          220 ₺
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {[1, 2].map((k) => (
                                      <div
                                        key={k}
                                        className="bg-white rounded-xl p-1.5 shadow-2xs border border-zinc-150 flex items-center gap-2"
                                      >
                                        <div className="size-8 rounded-lg bg-zinc-50 flex items-center justify-center text-base shrink-0">
                                          🍔
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <span className="text-[8px] font-black text-zinc-900 block truncate">
                                            Menü Ürünü {k}
                                          </span>
                                          <span
                                            className="text-[7px] font-bold tabular-nums block"
                                            style={{ color: primaryColor }}
                                          >
                                            190 ₺
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </>
                  )}
                </div>

                {/* Floating Bottom Nav Bar */}
                <div className="bg-white rounded-2xl p-1.5 shadow-md border border-zinc-150 flex items-center justify-around shrink-0 mt-1">
                  <span
                    className="text-[9px] font-black"
                    style={{ color: primaryColor }}
                  >
                    🏠 Ana Sayfa
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400">
                    🔲 Menü
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400">
                    🛍️ Sepet
                  </span>
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

      {/* SECTION CREATION & EDITING MODAL DIALOG */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-5 rounded-3xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground">
              {editingSectionId
                ? "Bölümü Düzenle"
                : "Yeni Ana Sayfa Bölümü Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bölüm başlığını, ürün kaynağını ve listeleme stilini belirleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {/* Section Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Bölüm Tipi
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSectionType("category")}
                  className={cn(
                    "p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer",
                    sectionType === "category"
                      ? "border-2 bg-primary/10 font-black"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                  style={{
                    borderColor:
                      sectionType === "category" ? primaryColor : undefined,
                    color:
                      sectionType === "category" ? primaryColor : undefined,
                  }}
                >
                  <span className="block text-sm mb-0.5">📂</span>
                  <span>Kategoriye Bağlı</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSectionType("custom")}
                  className={cn(
                    "p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer",
                    sectionType === "custom"
                      ? "border-2 bg-primary/10 font-black"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                  style={{
                    borderColor:
                      sectionType === "custom" ? primaryColor : undefined,
                    color:
                      sectionType === "custom" ? primaryColor : undefined,
                  }}
                >
                  <span className="block text-sm mb-0.5">⭐</span>
                  <span>Özel Ürün Seçimi</span>
                </button>
              </div>
            </div>

            {/* Category Select if category type */}
            {sectionType === "category" && (
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">
                  Bağlı Kategori
                </Label>
                <select
                  value={sectionCategoryId}
                  onChange={(e) => {
                    setSectionCategoryId(e.target.value);
                    const cat = menu?.categories.find(
                      (c) => c.id === e.target.value,
                    );
                    if (cat && !sectionTitle) setSectionTitle(cat.name);
                  }}
                  className="w-full h-10 px-3 rounded-xl border bg-background font-bold text-xs"
                >
                  {menu?.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">
                Bölüm Başlığı
              </Label>
              <Input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder={
                  sectionType === "category"
                    ? "Örn: Burgerler veya Günün Menüsü"
                    : "Örn: En Sevilenler, Şefin Seçimi"
                }
                className="h-10 text-xs font-bold rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">
                Alt Başlık / Açıklama (İsteğe Bağlı)
              </Label>
              <Input
                type="text"
                value={sectionSubtitle}
                onChange={(e) => setSectionSubtitle(e.target.value)}
                placeholder="Örn: Taptaze malzemelerle hazırlanan lezzetler"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* Display Style Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Listeleme Stili
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSectionDisplayStyle("list")}
                  className={cn(
                    "p-2.5 rounded-2xl border text-center font-bold text-[11px] transition-all cursor-pointer",
                    sectionDisplayStyle === "list"
                      ? "border-2 bg-primary/10 font-black"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                  style={{
                    borderColor:
                      sectionDisplayStyle === "list"
                        ? primaryColor
                        : undefined,
                    color:
                      sectionDisplayStyle === "list"
                        ? primaryColor
                        : undefined,
                  }}
                >
                  <ListIcon className="size-4 mx-auto mb-1" />
                  <span>📜 Liste Stili</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSectionDisplayStyle("grid")}
                  className={cn(
                    "p-2.5 rounded-2xl border text-center font-bold text-[11px] transition-all cursor-pointer",
                    sectionDisplayStyle === "grid"
                      ? "border-2 bg-primary/10 font-black"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                  style={{
                    borderColor:
                      sectionDisplayStyle === "grid"
                        ? primaryColor
                        : undefined,
                    color:
                      sectionDisplayStyle === "grid"
                        ? primaryColor
                        : undefined,
                  }}
                >
                  <Grid2X2Icon className="size-4 mx-auto mb-1" />
                  <span>🎴 2&apos;li Kart</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSectionDisplayStyle("slider")}
                  className={cn(
                    "p-2.5 rounded-2xl border text-center font-bold text-[11px] transition-all cursor-pointer",
                    sectionDisplayStyle === "slider"
                      ? "border-2 bg-primary/10 font-black"
                      : "border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                  style={{
                    borderColor:
                      sectionDisplayStyle === "slider"
                        ? primaryColor
                        : undefined,
                    color:
                      sectionDisplayStyle === "slider"
                        ? primaryColor
                        : undefined,
                  }}
                >
                  <SlidersHorizontalIcon className="size-4 mx-auto mb-1" />
                  <span>🎠 Slider</span>
                </button>
              </div>
            </div>

            {/* Custom Products Multi-Select if type === custom */}
            {sectionType === "custom" && (
              <div className="space-y-2 pt-1 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Seçilen Ürünler ({sectionItemIds.length})
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Eklemek istediğiniz ürünleri işaretleyin
                  </span>
                </div>

                {/* Product Search */}
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Ürün adı ile ara..."
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl border bg-muted/20">
                  {filteredMenuItems.map((item) => {
                    const isSelected = sectionItemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSectionItemIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id],
                          );
                        }}
                        className={cn(
                          "w-full p-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer text-left",
                          isSelected
                            ? "border-2 bg-card shadow-xs text-foreground"
                            : "border-border/60 bg-card/60 text-muted-foreground hover:bg-card",
                        )}
                        style={{
                          borderColor: isSelected ? primaryColor : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              "size-4 rounded-md flex items-center justify-center border shrink-0",
                              isSelected ? "text-white" : "border-border",
                            )}
                            style={{
                              backgroundColor: isSelected
                                ? primaryColor
                                : undefined,
                              borderColor: isSelected
                                ? primaryColor
                                : undefined,
                            }}
                          >
                            {isSelected && (
                              <CheckIcon className="size-3 stroke-[3]" />
                            )}
                          </div>
                          <span className="truncate">{item.name}</span>
                        </div>
                        <span className="font-mono text-[11px] tabular-nums shrink-0 ml-2">
                          {item.price} ₺
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSectionDialogOpen(false)}
              className="flex-1 rounded-xl font-bold"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              onClick={handleSaveSection}
              className="flex-1 rounded-xl font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {editingSectionId ? "Güncelle" : "Bölümü Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

