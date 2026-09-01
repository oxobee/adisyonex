"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeadphonesIcon, UserCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { assignSalesRepToUserAction } from "@/actions/sales-rep.actions";
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
import type { AdminUserListItemDTO } from "@/types/admin";
import type { SalesRepDTO } from "@/services/sales-rep.service";

export function AssignSalesRepToUserDialog({
  user,
  salesReps,
  onOpenChange,
}: {
  readonly user: AdminUserListItemDTO | null;
  readonly salesReps: readonly SalesRepDTO[];
  readonly onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [selectedRepId, setSelectedRepId] = useState<string>("none");

  useEffect(() => {
    if (user) {
      setSelectedRepId(user.salesRepId || "none");
    }
  }, [user]);

  const assignAction = useServerAction(assignSalesRepToUserAction, {
    onSuccess: () => {
      toast.success("Kullanıcıya satış temsilcisi atandı.");
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => toast.error(err || "Atama işlemi başarısız."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await assignAction.execute({
      userId: user.id,
      salesRepId: selectedRepId === "none" ? null : selectedRepId,
    });
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <HeadphonesIcon className="size-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              Kullanıcıya Temsilci Atama
            </span>
          </div>
          <DialogTitle className="text-xl font-black">
            {user?.name || user?.phone}
          </DialogTitle>
          <DialogDescription>
            Bu kullanıcıya ve işlettiği restoranlara atanacak yetkili satış temsilcisini seçin.
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
              className="rounded-xl font-black cursor-pointer"
            >
              <UserCheckIcon className="size-4 mr-1.5" />
              {assignAction.isPending ? "Kaydediliyor..." : "Temsilciyi Ata"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
