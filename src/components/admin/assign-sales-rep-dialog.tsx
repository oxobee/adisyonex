"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeadphonesIcon, UserCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { assignSalesRepAction } from "@/actions/sales-rep.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import type { RestaurantListItemDTO } from "@/types/admin";
import type { SalesRepDTO } from "@/services/sales-rep.service";

export function AssignSalesRepDialog({
  restaurant,
  salesReps,
  onOpenChange,
}: {
  readonly restaurant: RestaurantListItemDTO | null;
  readonly salesReps: readonly SalesRepDTO[];
  readonly onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [selectedRepId, setSelectedRepId] = useState<string>("none");

  useEffect(() => {
    if (restaurant) {
      setSelectedRepId(restaurant.salesRepId || "none");
    }
  }, [restaurant]);

  const assignAction = useServerAction(assignSalesRepAction, {
    onSuccess: () => {
      toast.success("Satış temsilcisi başarıyla atandı.");
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => toast.error(err || "Atama işlemi başarısız."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    await assignAction.execute({
      restaurantId: restaurant.id,
      salesRepId: selectedRepId === "none" ? null : selectedRepId,
    });
  };

  return (
    <Dialog open={!!restaurant} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <HeadphonesIcon className="size-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              Temsilci Atama
            </span>
          </div>
          <DialogTitle className="text-xl font-black">
            {restaurant?.name}
          </DialogTitle>
          <DialogDescription>
            Bu restorana atanacak yetkili satış ve lisans temsilcisini seçin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Field>
            <FieldLabel>Yetkili Satış Temsilcisi</FieldLabel>
            <Select
              value={selectedRepId}
              onValueChange={(val) => val && setSelectedRepId(val)}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <span>
                  {selectedRepId === "none"
                    ? "Temsilci Yok (Varsayılan Destek Ekibi)"
                    : salesReps.find((r) => r.id === selectedRepId)?.name ||
                      "Temsilci Seçin"}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">
                  ❌ Temsilci Yok (Varsayılan Destek Ekibi)
                </SelectItem>
                {salesReps
                  .filter((r) => r.isActive)
                  .map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      👤 {rep.name} · {rep.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={assignAction.isPending}
              className="rounded-xl font-black"
            >
              <UserCheckIcon className="size-4 mr-1.5" />
              {assignAction.isPending ? "Kaydediliyor..." : "Temsilciyi Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
