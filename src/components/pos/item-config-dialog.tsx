"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  ClockIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";

import { ImageCarousel } from "@/components/shared/image-carousel";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MenuItemDTO, MenuModifierGroupDTO } from "@/types/menu";

import { modifiersDelta, newLineKey, type CartLine, type CartModifier } from "./types";

const initialSelection = (
  groups: readonly MenuModifierGroupDTO[],
): Record<string, string[]> => {
  const selection: Record<string, string[]> = {};
  for (const group of groups) {
    selection[group.id] = group.isRequired
      ? group.modifiers.slice(0, Math.max(group.minSelect, 1)).map((m) => m.id)
      : [];
  }
  return selection;
};

export function ItemConfigDialog({
  item,
  onAdd,
  onOpenChange,
}: {
  readonly item: MenuItemDTO;
  readonly onAdd: (line: CartLine) => void;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [variantId, setVariantId] = useState<string | null>(
    item.variants[0]?.id ?? null,
  );
  const [selection, setSelection] = useState<Record<string, string[]>>(() =>
    initialSelection(item.modifierGroups),
  );
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const variant = item.variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = variant ? variant.price : item.price;

  const photos = [...item.images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );

  const selectedModifiers: CartModifier[] = item.modifierGroups.flatMap((group) =>
    (selection[group.id] ?? []).flatMap((id) => {
      const modifier = group.modifiers.find((m) => m.id === id);
      return modifier
        ? [{ id: modifier.id, name: modifier.name, priceDelta: modifier.priceDelta }]
        : [];
    }),
  );

  const toggleModifier = (group: MenuModifierGroupDTO, modifierId: string) => {
    setSelection((prev) => {
      const current = prev[group.id] ?? [];
      if (current.includes(modifierId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== modifierId) };
      }
      if (group.maxSelect === 1) {
        return { ...prev, [group.id]: [modifierId] };
      }
      if (current.length >= group.maxSelect) {
        return prev;
      }
      return { ...prev, [group.id]: [...current, modifierId] };
    });
  };

  const unmetGroup = item.modifierGroups.find(
    (group) => (selection[group.id] ?? []).length < group.minSelect,
  );
  const lineTotal = (unitPrice + modifiersDelta(selectedModifiers)) * quantity;

  const add = () => {
    if (unmetGroup) {
      return;
    }
    onAdd({
      key: newLineKey(),
      menuItemId: item.id,
      name: item.name,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      unitPrice,
      taxRate: item.tax.rate,
      taxInclusive: item.tax.inclusive,
      modifiers: selectedModifiers,
      quantity,
      lineNote: note.trim() || null,
      isComp: false,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border-t border-border/80 bg-background p-0 shadow-2xl duration-300 ease-out animate-in slide-in-from-bottom"
      >
        {/* Top Handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />

        {/* Header with Centered Title and Close Button */}
        <div className="relative flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-2.5">
          <h2 className="mx-auto max-w-[80%] truncate text-center text-base font-bold text-foreground">
            {item.name}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Kapat"
            className="text-foreground bg-muted/70 hover:bg-muted absolute top-1/2 right-4 flex size-8 -translate-y-1/2 items-center justify-center rounded-full transition-transform active:scale-90"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
          {/* Hero Photo / Carousel */}
          {photos.length > 0 ? (
            <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-border/40 bg-muted/10 p-2">
              <ImageCarousel images={photos} alt={item.name} />
            </div>
          ) : null}

          {/* Price & Prep Time Row */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatCurrency(unitPrice)}
            </span>
            <span className="text-muted-foreground bg-muted/60 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <ClockIcon className="size-3.5 text-muted-foreground/80" />
              15 dk
            </span>
          </div>

          {/* Product Description */}
          {item.shortDescription ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.shortDescription}
            </p>
          ) : null}

          {/* Allergen Badges */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Alerjen bilgisi (içerebilir):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                🌾 Gluten
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                🌰 Susam
              </span>
              {item.dietaryType === "VEG" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  🌱 Vejetaryen
                </span>
              ) : null}
            </div>
          </div>

          {/* Portion / Variant Options */}
          {item.variants.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Porsiyon / Boyut Seçeneği
                </span>
                <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Zorunlu
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {item.variants.map((v) => {
                  const isSelected = v.id === variantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-left text-sm transition-all select-none active:scale-[0.98]",
                        isSelected
                          ? "border-primary bg-primary/5 font-bold shadow-xs ring-1 ring-primary/30"
                          : "border-border/80 bg-card hover:border-border",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-background",
                          )}
                        >
                          {isSelected ? (
                            <span className="size-1.5 rounded-full bg-primary-foreground" />
                          ) : null}
                        </span>
                        <span className="text-foreground">{v.name}</span>
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatCurrency(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Modifier Groups (e.g. Soslar, Ekstra Malzemeler) */}
          {item.modifierGroups.map((group) => {
            const selected = selection[group.id] ?? [];
            const atMax = selected.length >= group.maxSelect;
            return (
              <div key={group.id} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {group.name}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      group.isRequired
                        ? "border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {group.isRequired ? "Zorunlu" : "İsteğe Bağlı"}
                    {group.maxSelect > 1 ? ` · Max ${group.maxSelect}` : ""}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {group.modifiers.map((m) => {
                    const checked = selected.includes(m.id);
                    const disabled = !checked && atMax && group.maxSelect > 1;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={disabled}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleModifier(group, m.id);
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-left text-sm transition-all select-none active:scale-[0.99]",
                          checked
                            ? "border-primary bg-primary/5 font-semibold shadow-xs ring-1 ring-primary/30"
                            : "border-border/80 bg-card hover:border-border",
                          disabled && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          {group.maxSelect === 1 ? (
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-background",
                              )}
                            >
                              {checked ? (
                                <span className="size-2 rounded-full bg-primary-foreground" />
                              ) : null}
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-background",
                              )}
                            >
                              {checked ? (
                                <CheckIcon className="size-3.5 stroke-[3]" />
                              ) : null}
                            </span>
                          )}
                          <span className="truncate text-foreground">{m.name}</span>
                        </span>
                        {m.priceDelta !== 0 ? (
                          <span
                            className={cn(
                              "ml-2 shrink-0 text-xs font-semibold tabular-nums",
                              checked ? "text-primary" : "text-muted-foreground",
                            )}
                          >
                            +{formatCurrency(m.priceDelta)}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Order Note */}
          <Field>
            <FieldLabel htmlFor="line-note" className="text-xs font-semibold text-foreground">
              Sipariş Notu (İsteğe Bağlı)
            </FieldLabel>
            <Textarea
              id="line-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Soğansız, az acılı, sosu ayrı olsun…"
              rows={2}
              className="rounded-2xl border-border/80 bg-card"
            />
          </Field>
        </div>

        {/* Fixed Sticky Bottom Bar */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md">
          {/* Top Row: Quantity Counter & Total Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Azalt"
                className="flex size-10 items-center justify-center rounded-full bg-muted/70 text-foreground transition-transform active:scale-90 hover:bg-muted"
              >
                <MinusIcon className="size-4 stroke-[2.5]" />
              </button>
              <span className="w-8 text-center text-lg font-black text-foreground tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Artır"
                className="flex size-10 items-center justify-center rounded-full bg-muted/70 text-foreground transition-transform active:scale-90 hover:bg-muted"
              >
                <PlusIcon className="size-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black tracking-tight text-foreground tabular-nums">
                {formatCurrency(lineTotal)}
              </span>
            </div>
          </div>

          {/* Bottom Row: Large Full Width Add Button */}
          <Button
            type="button"
            onClick={add}
            disabled={Boolean(unmetGroup)}
            className={cn(
              "h-13 w-full rounded-2xl text-base font-bold shadow-md transition-all active:scale-[0.98]",
              unmetGroup
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20",
            )}
          >
            {unmetGroup ? "Seçim Yapınız" : `Sepete Ekle · ${formatCurrency(lineTotal)}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
