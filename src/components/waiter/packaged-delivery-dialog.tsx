"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquareIcon,
  SquareIcon,
  PackageCheckIcon,
  Loader2Icon,
  CheckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { deliverOrderLinesAction } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OrderDTO } from "@/types/order";
import { cn } from "@/lib/utils";

interface PackagedDeliveryDialogProps {
  readonly order: OrderDTO | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function PackagedDeliveryDialog({
  order,
  open,
  onOpenChange,
}: PackagedDeliveryDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Find all unserved packaged lines in the order
  const packagedLines = useMemo(() => {
    if (!order) return [];
    return order.lines.filter(
      (l) =>
        l.itemType === "PACKAGED_GOODS" &&
        l.state !== "SERVED" &&
        l.state !== "VOID",
    );
  }, [order]);

  // Selected line IDs state (by default all selected for quick delivery)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // When opened, sync initial selection with all unserved packaged lines
  const allIds = useMemo(() => packagedLines.map((l) => l.id), [packagedLines]);
  const isAllSelected =
    packagedLines.length > 0 && selectedIds.length === packagedLines.length;

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedIds(packagedLines.map((l) => l.id));
    }
    onOpenChange(newOpen);
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleDeliver = () => {
    if (selectedIds.length === 0) {
      toast.warning("Lütfen teslim edilecek en az bir ürün seçiniz.");
      return;
    }

    startTransition(async () => {
      const res = await deliverOrderLinesAction({ lineIds: selectedIds });
      if (res.success) {
        toast.success(
          `${selectedIds.length} adet paketli ürün teslim edildi ✓`,
        );
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error || "Teslim işlemi başarısız.");
      }
    });
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-2 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <PackageCheckIcon className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-black tracking-tight">
                  Paketli Ürün Teslimatı
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-medium">
                  {order.tableLabel ? `${order.tableLabel} Masası` : `Sipariş #${order.orderNumber}`}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {packagedLines.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Teslim bekleyen paketli ürün bulunmuyor.
            </div>
          ) : (
            packagedLines.map((line) => {
              const isSelected = selectedIds.includes(line.id);
              return (
                <div
                  key={line.id}
                  onClick={() => toggleItem(line.id)}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 select-none",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-border/60 hover:border-zinc-300 bg-card",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "size-6 rounded-lg flex items-center justify-center transition-colors shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold"
                          : "border-2 border-muted-foreground/40",
                      )}
                    >
                      {isSelected ? <CheckIcon className="size-3.5 stroke-[3]" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {line.name}
                      </p>
                      {line.variantName ? (
                        <p className="text-xs text-muted-foreground font-medium">
                          {line.variantName}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-muted text-xs font-black tabular-nums shrink-0 ml-2">
                    {line.quantity} Adet
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Fixed Bottom Bar: Select All Icon + Deliver Button */}
        {packagedLines.length > 0 && (
          <div className="p-4 border-t bg-card/95 backdrop-blur-md flex items-center gap-3">
            {/* Tümünü Seç / Kaldır Butonu */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={toggleSelectAll}
              className="h-12 px-4 rounded-2xl font-bold flex items-center gap-2 border-2 shrink-0 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquareIcon className="size-5 text-primary" />
              ) : (
                <SquareIcon className="size-5 text-muted-foreground" />
              )}
              <span className="text-xs">Tümünü Seç</span>
            </Button>

            {/* Teslim Et Butonu */}
            <Button
              type="button"
              size="lg"
              disabled={pending || selectedIds.length === 0}
              onClick={handleDeliver}
              className="flex-1 h-12 rounded-2xl font-black text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-md cursor-pointer gap-2"
            >
              {pending ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <PackageCheckIcon className="size-5" />
              )}
              <span>Teslim Et {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
