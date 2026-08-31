"use client";

import { useState } from "react";
import { ClockIcon, PlusIcon, SparklesIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { createItemAction, updateItemAction } from "@/actions/menu.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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

  const save = useServerAction(item ? updateItemAction : createItemAction, {
    onSuccess: () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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

          {/* Prep Time & Dietary Type */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="item-preptime">
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5 text-muted-foreground" />
                  Hazırlanma Süresi (dk)
                </span>
              </FieldLabel>
              <Input
                id="item-preptime"
                type="number"
                min={0}
                max={300}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                placeholder="15"
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
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all select-none active:scale-95",
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
                  className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-lg shadow-xs hover:bg-muted active:scale-95"
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
                        className="flex size-8 items-center justify-center rounded-lg text-base hover:bg-muted active:scale-90"
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
                className="h-10 shrink-0 px-3"
                onClick={() => addAllergen(newAllergenName, selectedIcon)}
              >
                <PlusIcon className="size-4 mr-1" />
                Ekle
              </Button>
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="item-short">Kısa Açıklama</FieldLabel>
            <Input
              id="item-short"
              value={shortDescription}
              onChange={(e) => setShort(e.target.value)}
              placeholder="Örn: 130gr dana köfte + patates kızartması + içecek"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="item-long">Detaylı Açıklama / İçindekiler</FieldLabel>
            <Textarea
              id="item-long"
              value={longDescription}
              onChange={(e) => setLong(e.target.value)}
              rows={2}
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="item-inclusive"
                  checked={priceTaxInclusive}
                  onCheckedChange={(c) => setInclusive(Boolean(c))}
                />
                <label
                  htmlFor="item-inclusive"
                  className="text-muted-foreground text-xs"
                >
                  Fiyata KDV dahildir
                </label>
              </div>
            </div>
          ) : null}

          {/* Variants (Portions / Sizes) */}
          <div className="flex flex-col gap-2 rounded-2xl border p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Porsiyonlar / Boyutlar (İsteğe Bağlı)</span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  setVariants((prev) => [...prev, { name: "", price: "" }])
                }
              >
                <PlusIcon className="size-3 mr-1" />
                Porsiyon Ekle
              </Button>
            </div>
            {variants.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Farklı porsiyon/boyut fiyatlandırması yoksa boş bırakabilirsiniz (Örn: Yarım Porsiyon, Duble vb.).
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="Porsiyon Adı (Örn: Duble)"
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
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-all select-none active:scale-95",
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

          {/* Photos */}
          {item ? (
            <div className="flex flex-col gap-2 rounded-2xl border p-3.5">
              <span className="text-sm font-bold">Ürün Fotoğrafları</span>
              <ImageManager itemId={item.id} images={item.images} />
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Ürün fotoğraflarını ürünü kaydettikten sonra düzenleme ekranından yükleyebilirsiniz.
            </p>
          )}

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
  );
}
