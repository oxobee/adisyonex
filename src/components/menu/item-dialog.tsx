"use client";

import { useState } from "react";
import {
  CheckIcon,
  ClockIcon,
  FlameIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  Wand2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  estimateItemCaloriesAction,
  generateQuickLongDescAction,
  generateQuickShortDescAction,
} from "@/actions/ai.actions";
import {
  createItemAction,
  updateItemAction,
  uploadItemImageAction,
} from "@/actions/menu.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import type {
  AllergenDTO,
  MenuCategoryDTO,
  MenuItemDTO,
  MenuModifierGroupDTO,
} from "@/types/menu";

import { ImageManager } from "./image-manager";

type VariantRow = { name: string; price: string };

const DIETARY = [
  { value: "NONE", label: "Belirtilmemiş" },
  { value: "VEG", label: "Vejetaryen" },
  { value: "NON_VEG", label: "Et / Tavuk / Balık" },
  { value: "EGG", label: "Yumurtalı" },
];

const COMMON_ALLERGENS: AllergenDTO[] = [
  { name: "Gluten", icon: "🌾" },
  { name: "Susam", icon: "🌰" },
  { name: "Süt / Laktoz", icon: "🥛" },
  { name: "Yumurta", icon: "🥚" },
  { name: "Fıstık / Kuruyemiş", icon: "🥜" },
  { name: "Balık / Deniz Ürünü", icon: "🐟" },
  { name: "Soya", icon: "🌱" },
  { name: "Kabuklular", icon: "🦐" },
  { name: "Hardal", icon: "🟡" },
  { name: "Kereviz", icon: "🥬" },
  { name: "Acı Biber", icon: "🌶️" },
];

const EMOJI_PALETTE = [
  "🌾", "🌰", "🥛", "🥚", "🥜", "🐟", "🌱", "🦐", "🥬", "🟡",
  "🌶️", "🥩", "🍗", "🧀", "🍯", "🍞", "🍄", "🍫", "🧄", "🧅",
  "🍎", "🍋", "🍓", "🍇", "🥑", "🥕",
];

const suggestEmojiForName = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("gluten") || n.includes("buğday") || n.includes("un")) return "🌾";
  if (n.includes("susam") || n.includes("tahin")) return "🌰";
  if (n.includes("süt") || n.includes("laktoz") || n.includes("krema") || n.includes("yoğurt")) return "🥛";
  if (n.includes("yumurta")) return "🥚";
  if (n.includes("fıstık") || n.includes("ceviz") || n.includes("fındık") || n.includes("badem") || n.includes("kaju")) return "🥜";
  if (n.includes("balık") || n.includes("somon") || n.includes("ton")) return "🐟";
  if (n.includes("soya") || n.includes("edamame")) return "🌱";
  if (n.includes("karides") || n.includes("yengeç") || n.includes("ıstakoz") || n.includes("kabuklu")) return "🦐";
  if (n.includes("hardal")) return "🟡";
  if (n.includes("kereviz") || n.includes("yeşillik")) return "🥬";
  if (n.includes("acı") || n.includes("biber") || n.includes("chili") || n.includes("jalapeno")) return "🌶️";
  if (n.includes("et") || n.includes("dana") || n.includes("kuzu")) return "🥩";
  if (n.includes("tavuk") || n.includes("piliç")) return "🍗";
  if (n.includes("peynir") || n.includes("kaşar") || n.includes("cheddar")) return "🧀";
  if (n.includes("bal")) return "🍯";
  if (n.includes("mantar")) return "🍄";
  if (n.includes("çikolata") || n.includes("kakao")) return "🍫";
  if (n.includes("sarımsak")) return "🧄";
  if (n.includes("soğan")) return "🧅";
  return "🌾";
};

export function ItemDialog({
  open,
  item,
  categories,
  groups,
  gstRegistered,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  item: MenuItemDTO | null;
  categories: readonly MenuCategoryDTO[];
  groups: readonly MenuModifierGroupDTO[];
  gstRegistered: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? categories[0]?.id ?? "",
  );
  const [shortDescription, setShort] = useState(item?.shortDescription ?? "");
  const [longDescription, setLong] = useState(item?.longDescription ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    item?.prepTimeMinutes != null ? String(item.prepTimeMinutes) : "15",
  );
  const [calories, setCalories] = useState(
    item?.calories != null ? String(item.calories) : "",
  );
  const [allergens, setAllergens] = useState<AllergenDTO[]>(
    item?.allergens ? [...item.allergens] : [],
  );

  // New allergen input state
  const [newAllergenName, setNewAllergenName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🌾");
  const [showIconPalette, setShowIconPalette] = useState(false);

  const [itemType, setItemType] = useState(item?.itemType ?? "SERVED");
  const [dietaryType, setDietary] = useState(item?.dietaryType ?? "NONE");
  const [goodsGstRate, setGoodsGst] = useState(
    item && item.tax.kind === "GOODS" ? String(item.tax.rate) : "",
  );
  const [hsnSacCode, setHsn] = useState(item?.tax.code ?? "");
  const [priceTaxInclusive, setInclusive] = useState(
    item?.tax.inclusive ?? true,
  );
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [variants, setVariants] = useState<VariantRow[]>(
    item
      ? item.variants.map((v) => ({ name: v.name, price: String(v.price) }))
      : [],
  );
  const [groupIds, setGroupIds] = useState<string[]>(
    item ? item.modifierGroups.map((g) => g.id) : [],
  );

  // AI Dialog Confirmation State
  const [aiConfirm, setAiConfirm] = useState<{
    type: "SHORT_DESC" | "LONG_DESC" | "CALORIES";
    cost: number;
    title: string;
    description: string;
  } | null>(null);

  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const save = useServerAction(item ? updateItemAction : createItemAction, {
    onSuccess: async (createdOrUpdated) => {
      if (!item && pendingImages.length > 0 && createdOrUpdated && typeof createdOrUpdated === "object" && "id" in createdOrUpdated) {
        const newItemId = (createdOrUpdated as any).id;
        for (const file of pendingImages) {
          const form = new FormData();
          form.set("itemId", newItemId);
          form.set("file", file);
          await uploadItemImageAction(form);
        }
      }
      toast.success(item ? "Ürün güncellendi" : "Ürün eklendi");
      onOpenChange(false);
      onSaved();
    },
    onError: (message) => toast.error(message),
  });

  const addAllergen = (nameToAdd: string, iconToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (allergens.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.info("Bu alerjen zaten eklenmiş");
      return;
    }
    setAllergens((prev) => [...prev, { name: trimmed, icon: iconToAdd }]);
    setNewAllergenName("");
  };

  const removeAllergen = (nameToRemove: string) => {
    setAllergens((prev) => prev.filter((a) => a.name !== nameToRemove));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      categoryId,
      name,
      shortDescription: shortDescription || undefined,
      longDescription: longDescription || undefined,
      itemType,
      dietaryType: dietaryType === "NONE" ? undefined : dietaryType,
      price: Number(price),
      prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : 15,
      calories: calories ? Number(calories) : null,
      allergens,
      priceTaxInclusive: gstRegistered ? priceTaxInclusive : undefined,
      goodsGstRate:
        itemType === "PACKAGED_GOODS" && goodsGstRate
          ? Number(goodsGstRate)
          : undefined,
      hsnSacCode: hsnSacCode || undefined,
      isActive,
      variants: variants
        .filter((v) => v.name.trim())
        .map((v) => ({ name: v.name, price: Number(v.price || 0) })),
      modifierGroupIds: groupIds,
    };
    save.execute(item ? { ...payload, id: item.id } : payload);
  };

  const setVariant = (index: number, key: keyof VariantRow, value: string) =>
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    );

  const canSave = Boolean(name.trim() && categoryId && price !== "");

  const handleAiConfirmExecution = async () => {
    if (!aiConfirm) return;
    setAiLoading(true);

    const catName = categories.find((c) => c.id === categoryId)?.name;

    try {
      if (aiConfirm.type === "SHORT_DESC") {
        const res = await generateQuickShortDescAction({
          name: name.trim(),
          categoryName: catName,
        });
        if (res.success && res.data) {
          setShort(res.data.text);
          toast.success("Kısa açıklama yapay zeka ile oluşturuldu!");
          setAiConfirm(null);
        } else {
          toast.error(res.error || "Kısa açıklama üretilemedi.");
        }
      } else if (aiConfirm.type === "LONG_DESC") {
        const res = await generateQuickLongDescAction({
          name: name.trim(),
          categoryName: catName,
          shortDescription: shortDescription || undefined,
        });
        if (res.success && res.data) {
          setLong(res.data.text);
          toast.success("Detaylı açıklama yapay zeka ile oluşturuldu!");
          setAiConfirm(null);
        } else {
          toast.error(res.error || "Detaylı açıklama üretilemedi.");
        }
      } else if (aiConfirm.type === "CALORIES") {
        const firstImg = item?.images?.[0]?.url;
        const res = await estimateItemCaloriesAction({
          name: name.trim(),
          categoryName: catName,
          shortDescription: shortDescription || undefined,
          longDescription: longDescription || undefined,
          imageUrl: firstImg || undefined,
        });
        if (res.success && res.data) {
          setCalories(String(res.data.calories));
          toast.success(`Tahmini kalori değeri (${res.data.calories} kcal) eklendi!`);
          setAiConfirm(null);
        } else {
          toast.error(res.error || "Kalori tahmini yapılamadı.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız oldu.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>{item ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="item-name">Ürün Adı</FieldLabel>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Mercimek Çorbası, Burger Yiyelim Menü"
                autoFocus
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="item-category">Kategori</FieldLabel>
                <Select
                  value={categoryId}
                  onValueChange={(v) => v && setCategoryId(v)}
                >
                  <SelectTrigger id="item-category">
                    <span>
                      {categories.find((c) => c.id === categoryId)?.name ??
                        "Kategori Seçin"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="item-price">Fiyat (₺)</FieldLabel>
                <Input
                  id="item-price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150"
                  required
                />
              </Field>
            </div>

            {/* Calories & Dietary Type */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="item-calories" className="mb-0">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-500">🔥</span>
                      Kalori (kcal)
                    </span>
                  </FieldLabel>
                  <button
                    type="button"
                    onClick={() => {
                      if (!name.trim()) {
                        toast.error("Lütfen önce ürün adını girin.");
                        return;
                      }
                      setAiConfirm({
                        type: "CALORIES",
                        cost: 2,
                        title: "✨ AI ile Kalori Hesapla",
                        description: `"${name}" için ürün adı ve açıklaması analiz edilerek tahmini kalori değeri hesaplansın mı?`,
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer active:scale-95 transition-all"
                  >
                    <SparklesIcon className="size-3 text-amber-500" />
                    AI ile Hesapla
                  </button>
                </div>
                <Input
                  id="item-calories"
                  type="number"
                  min={0}
                  max={10000}
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="Örn: 450"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="item-diet">Beslenme Türü</FieldLabel>
                <Select value={dietaryType} onValueChange={(v) => v && setDietary(v)}>
                  <SelectTrigger id="item-diet">
                    <span>
                      {DIETARY.find((d) => d.value === dietaryType)?.label}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {DIETARY.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* ALLERGENS SECTION */}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Alerjen Bilgisi (İçerebilir)
                </span>
                <span className="text-xs text-muted-foreground">
                  {allergens.length} adet eklendi
                </span>
              </div>

              {/* Quick Add Presets */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ALLERGENS.map((preset) => {
                  const alreadyAdded = allergens.some(
                    (a) => a.name.toLowerCase() === preset.name.toLowerCase(),
                  );
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        alreadyAdded
                          ? removeAllergen(preset.name)
                          : addAllergen(preset.name, preset.icon)
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all select-none active:scale-95 cursor-pointer",
                        alreadyAdded
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                      {alreadyAdded ? <XIcon className="size-3 ml-0.5" /> : null}
                    </button>
                  );
                })}
              </div>

              {/* Custom Allergen Input with Icon Picker */}
              <div className="mt-1 flex items-center gap-2">
                {/* Icon button that toggles palette */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPalette(!showIconPalette)}
                    title="İkon Değiştir"
                    className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-lg shadow-xs hover:bg-muted active:scale-95 cursor-pointer"
                  >
                    {selectedIcon}
                  </button>

                  {showIconPalette ? (
                    <div className="absolute top-12 left-0 z-50 flex w-56 flex-wrap gap-1.5 rounded-2xl border border-border bg-popover p-2 shadow-xl backdrop-blur-md">
                      {EMOJI_PALETTE.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(emoji);
                            setShowIconPalette(false);
                          }}
                          className="flex size-8 items-center justify-center rounded-lg text-base hover:bg-muted active:scale-90 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <Input
                  value={newAllergenName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewAllergenName(val);
                    setSelectedIcon(suggestEmojiForName(val));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAllergen(newAllergenName, selectedIcon);
                    }
                  }}
                  placeholder="Örn: Ceviz, Hardal veya özel alerjen..."
                  className="h-10 text-sm"
                />

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10 shrink-0 px-3 cursor-pointer"
                  onClick={() => addAllergen(newAllergenName, selectedIcon)}
                >
                  <PlusIcon className="size-4 mr-1" />
                  Ekle
                </Button>
              </div>
            </div>

            {/* SHORT DESCRIPTION WITH AI BUTTON */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="item-short" className="mb-0">Kısa Açıklama</FieldLabel>
                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim()) {
                      toast.error("Lütfen önce ürün adını girin.");
                      return;
                    }
                    setAiConfirm({
                      type: "SHORT_DESC",
                      cost: 2,
                      title: "✨ AI ile Kısa Açıklama Üret",
                      description: `"${name}" için menü kartlarına uygun 1 cümlelik iştah açıcı kısa açıklama üretilsin mi?`,
                    });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer active:scale-95 transition-all"
                >
                  <Wand2Icon className="size-3 text-primary" />
                  Yapay Zeka ile Üret (2 Kredi)
                </button>
              </div>
              <Input
                id="item-short"
                value={shortDescription}
                onChange={(e) => setShort(e.target.value)}
                placeholder="Örn: 130gr dana köfte + patates kızartması + içecek"
              />
            </Field>

            {/* LONG DESCRIPTION WITH AI BUTTON */}
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="item-long" className="mb-0">Detaylı Açıklama / İçindekiler</FieldLabel>
                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim()) {
                      toast.error("Lütfen önce ürün adını girin.");
                      return;
                    }
                    setAiConfirm({
                      type: "LONG_DESC",
                      cost: 2,
                      title: "✨ AI ile Detaylı Açıklama Üret",
                      description: `"${name}" için lezzet hikayesi ve pişirme detaylarını içeren zengin açıklama üretilsin mi?`,
                    });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer active:scale-95 transition-all"
                >
                  <Wand2Icon className="size-3 text-primary" />
                  Yapay Zeka ile Üret (2 Kredi)
                </button>
              </div>
              <Textarea
                id="item-long"
                value={longDescription}
                onChange={(e) => setLong(e.target.value)}
                rows={2}
                placeholder="Örn: Özel baharatlarla harmanlanmış 130gr ızgara köfte, karamelize soğan, cheddar ve çıtır patates."
              />
            </Field>

            {gstRegistered ? (
              <div className="flex flex-col gap-3 rounded-md border p-3">
                <span className="text-sm font-medium">KDV Oranı & Kod</span>
                <div className="grid grid-cols-2 gap-3">
                  {itemType === "PACKAGED_GOODS" ? (
                    <Field>
                      <FieldLabel htmlFor="item-gst">Özel KDV %</FieldLabel>
                      <Input
                        id="item-gst"
                        inputMode="decimal"
                        value={goodsGstRate}
                        onChange={(e) => setGoodsGst(e.target.value)}
                        placeholder="10"
                      />
                    </Field>
                  ) : (
                    <p className="text-muted-foreground col-span-2 text-xs">
                      Bu restoranın standart KDV oranı uygulanacaktır.
                    </p>
                  )}
                  <Field>
                    <FieldLabel htmlFor="item-hsn">HSN / SAC Kodu</FieldLabel>
                    <Input
                      id="item-hsn"
                      value={hsnSacCode}
                      onChange={(e) => setHsn(e.target.value)}
                      placeholder="996331"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            {/* Preparation time & Item Type */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="item-prep">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    Hazırlanma (dk)
                  </span>
                </FieldLabel>
                <Input
                  id="item-prep"
                  type="number"
                  min={1}
                  max={240}
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(e.target.value)}
                  placeholder="15"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="item-type">Ürün Türü</FieldLabel>
                <Select value={itemType} onValueChange={(v) => v && setItemType(v as any)}>
                  <SelectTrigger id="item-type">
                    <span>
                      {itemType === "SERVED"
                        ? "Hazırlanan Yemek"
                        : itemType === "PACKAGED_GOODS"
                          ? "Paketli Ürün"
                          : "Diğer"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVED">Hazırlanan Yemek</SelectItem>
                    <SelectItem value="PACKAGED_GOODS">Paketli Ürün</SelectItem>
                    <SelectItem value="OTHER">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Variants */}
            <div className="flex flex-col gap-2 rounded-2xl border p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Porsiyon / Varyantlar</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setVariants((prev) => [...prev, { name: "", price: "" }])
                  }
                  className="rounded-xl font-bold text-xs"
                >
                  <PlusIcon className="size-3.5 mr-1" /> Porsiyon Ekle
                </Button>
              </div>

              {variants.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Tek porsiyon ise boş bırakabilirsiniz (örn: Küçük, Orta, Büyük, 1.5 Porsiyon).
                </p>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  {variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="Porsiyon Adı (örn: 1.5 Porsiyon)"
                        value={v.name}
                        onChange={(e) => setVariant(i, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Fiyat (₺)"
                        inputMode="decimal"
                        value={v.price}
                        onChange={(e) => setVariant(i, "price", e.target.value)}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          setVariants((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modifier Groups */}
            {groups.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-2xl border p-3.5">
                <span className="text-sm font-bold">Ek Seçenek Grupları</span>
                <p className="text-muted-foreground text-xs">
                  Bu ürüne bağlı sos, ekstra malzeme veya içecek seçim grupları:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {groups.map((g) => {
                    const isChecked = groupIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() =>
                          setGroupIds((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== g.id)
                              : [...prev, g.id],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-all select-none active:scale-95 cursor-pointer",
                          isChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {isChecked ? "✓ " : "+ "}
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Photos with ImageManager (New & Edit Modes) */}
            <ImageManager
              itemId={item?.id}
              itemName={name}
              itemDescription={shortDescription}
              images={item?.images ?? []}
              onImageUpdated={onSaved}
              onPendingFilesChange={(files) => setPendingImages(files)}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium">Satışta / Aktif</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={!canSave || save.isPending}>
                {save.isPending ? "Kaydediliyor…" : item ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI GENERATOR CREDIT CONFIRMATION MODAL */}
      {aiConfirm && (
        <Dialog open onOpenChange={(open) => !open && !aiLoading && setAiConfirm(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6">
            <DialogHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 text-primary mx-auto mb-2 shadow-xs">
                <SparklesIcon className="size-6 text-amber-500" />
              </div>
              <DialogTitle className="text-center font-black text-base">
                {aiConfirm.title}
              </DialogTitle>
              <DialogDescription className="text-center text-xs mt-1 leading-relaxed">
                {aiConfirm.description}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border bg-muted/40 p-3.5 my-2 text-xs flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">İşlem Maliyeti:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {aiConfirm.cost} AI Kredisi
              </span>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-center mt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold text-xs"
                disabled={aiLoading}
                onClick={() => setAiConfirm(null)}
              >
                Vazgeç
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-1.5 cursor-pointer"
                disabled={aiLoading}
                onClick={handleAiConfirmExecution}
              >
                {aiLoading ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    Üretiliyor…
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-3.5" />
                    Onayla & Üret
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
