"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  removeRecipeComponentAction,
  setRecipeComponentAction,
} from "@/actions/recipe.actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { UNIT_LABELS } from "@/lib/inventory";
import type { RecipeComponentDTO, StockItemDTO } from "@/types/inventory";
import type { MenuItemDTO } from "@/types/menu";

export function RecipeDialog({
  item,
  components,
  stockItems,
  onOpenChange,
}: {
  readonly item: MenuItemDTO;
  readonly components: readonly RecipeComponentDTO[];
  readonly stockItems: readonly StockItemDTO[];
  readonly onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [stockItemId, setStockItemId] = useState("");
  const [quantity, setQuantity] = useState("");

  const used = new Set(components.map((c) => c.stockItemId));
  const available = stockItems.filter((s) => !used.has(s.id));
  const selected = stockItems.find((s) => s.id === stockItemId);

  const add = useServerAction(setRecipeComponentAction, {
    onSuccess: () => {
      toast.success("Malzeme reçeteye eklendi");
      setStockItemId("");
      setQuantity("");
      router.refresh();
    },
    onError: (message) => toast.error(message),
  });
  const remove = useServerAction(removeRecipeComponentAction, {
    onSuccess: () => {
      toast.success("Malzeme reçeteden kaldırıldı");
      router.refresh();
    },
    onError: (message) => toast.error(message),
  });

  const qty = Number(quantity);
  const submit = () => {
    if (!stockItemId || !(qty > 0)) {
      return;
    }
    add.execute({ menuItemId: item.id, stockItemId, quantity: qty });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reçete & Stok Düşümü · {item.name}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-xs">
          Bu ürün her satıldığında aşağıdaki malzemeler envanter stoklarınızdan otomatik olarak düşülür.
        </p>

        {components.length > 0 ? (
          <ul className="divide-y rounded-md border">
            {components.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 p-2">
                <span className="text-sm font-medium">{c.stockItemName}</span>
                <span className="flex items-center gap-2">
                  <span className="text-sm tabular-nums">
                    {c.quantity} {UNIT_LABELS[c.unit]}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Malzemeyi kaldır"
                    onClick={() => remove.execute({ id: c.id })}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Henüz reçete malzemesi eklenmemiş.</p>
        )}

        {stockItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Önce Stok & Envanter bölümünden hammadde/malzeme tanımlayın, ardından reçeteye ekleyin.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <Field className="flex-1">
              <FieldLabel htmlFor="rc-stock">Malzeme</FieldLabel>
              <Select
                value={stockItemId || undefined}
                onValueChange={(v) => v && setStockItemId(v)}
              >
                <SelectTrigger id="rc-stock">
                  <span>{selected?.name ?? "Malzeme Seçin…"}</span>
                </SelectTrigger>
                <SelectContent>
                  {available.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field className="w-28">
              <FieldLabel htmlFor="rc-qty">
                Miktar {selected ? `(${UNIT_LABELS[selected.unit]})` : ""}
              </FieldLabel>
              <Input
                id="rc-qty"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Button
              onClick={submit}
              disabled={!stockItemId || !(qty > 0) || add.isPending}
            >
              Ekle
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tamam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
