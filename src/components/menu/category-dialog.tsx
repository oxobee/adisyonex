"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createCategoryAction, updateCategoryAction } from "@/actions/menu.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import type { MenuCategoryDTO } from "@/types/menu";
import type { RestaurantZoneDTO } from "@/types/staff";

export function CategoryDialog({
  open,
  category,
  zones = [],
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  category: MenuCategoryDTO | null;
  zones?: RestaurantZoneDTO[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [productionZoneId, setProductionZoneId] = useState(category?.productionZoneId ?? "");

  const save = useServerAction(
    category ? updateCategoryAction : createCategoryAction,
    {
      onSuccess: () => {
        toast.success(category ? "Kategori güncellendi" : "Kategori oluşturuldu");
        onOpenChange(false);
        onSaved();
      },
      onError: (message) => toast.error(message),
    },
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name,
      description: description || undefined,
      isActive,
      productionZoneId: productionZoneId.trim() ? productionZoneId.trim() : null,
    };
    save.execute(category ? { ...payload, id: category.id } : payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{category ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="cat-name">Kategori Adı</FieldLabel>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Başlangıçlar, Burgerler, İçecekler"
              autoFocus
              className="rounded-xl font-bold"
            />
          </Field>

          {/* Hazırlama / Yazdırma İstasyonu */}
          <Field>
            <FieldLabel htmlFor="cat-zone">Hazırlama / Yazdırma İstasyonu (KOT Routing)</FieldLabel>
            <select
              id="cat-zone"
              value={productionZoneId}
              onChange={(e) => setProductionZoneId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Varsayılan (Mutfak / Genel)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} {z.code ? `[${z.code}]` : ""} {z.printerEnabled ? "🖨️" : ""}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground mt-1">
              Bu kategorideki ürünlerin sipariş fişleri (KOT) seçilen çalışma bölgesinin yazıcısına otomatik yönlendirilir (Örn: Burgerler → Mutfak, Kahveler → Bar).
            </span>
          </Field>

          <Field>
            <FieldLabel htmlFor="cat-desc">Açıklama (Opsiyonel)</FieldLabel>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl text-xs"
            />
          </Field>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/60">
            <Switch
              id="cat-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <label htmlFor="cat-active" className="text-xs font-medium cursor-pointer">
              Menüde görünür (Aktif Kategori)
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={save.isPending || !name.trim()} className="rounded-xl">
              {save.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
