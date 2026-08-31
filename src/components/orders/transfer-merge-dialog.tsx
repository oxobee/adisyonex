"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeftIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MergeIcon,
  UtensilsIcon,
} from "lucide-react";
import { toast } from "sonner";

import { mergeTablesAction, transferTableAction } from "@/actions/table.actions";
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
import { useServerAction } from "@/hooks/use-server-action";
import type { TableDTO } from "@/types/table";
import type { OrderDTO } from "@/types/order";

export function TransferMergeDialog({
  sourceTable,
  orders,
  allTables,
  mode,
  open,
  onOpenChange,
}: {
  sourceTable: TableDTO | null;
  orders: readonly OrderDTO[];
  allTables: readonly TableDTO[];
  mode: "TRANSFER" | "MERGE";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [targetTableId, setTargetTableId] = useState<string>("");

  const availableTargetTables = allTables.filter(
    (t) => t.id !== sourceTable?.id && t.isActive,
  );

  const transferAction = useServerAction(transferTableAction, {
    onSuccess: (res) => {
      toast.success(
        `Masa ${sourceTable?.label} siparişleri başarıyla ${res?.targetTableLabel || "hedef masaya"} taşındı.`,
      );
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => toast.error(err || "Masa taşınamadı."),
  });

  const mergeAction = useServerAction(mergeTablesAction, {
    onSuccess: (res) => {
      toast.success(
        `Masa ${sourceTable?.label} ve ${res?.targetTableLabel || "hedef masa"} başarıyla birleştirildi.`,
      );
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => toast.error(err || "Masalar birleştirilemedi."),
  });

  if (!sourceTable) return null;

  const isTransfer = mode === "TRANSFER";
  const targetTable = allTables.find((t) => t.id === targetTableId);
  const totalAmount = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);

  const handleExecute = () => {
    if (!targetTableId) {
      toast.error("Lütfen hedef bir masa seçin.");
      return;
    }

    if (isTransfer) {
      transferAction.execute({
        fromTableId: sourceTable.id,
        toTableId: targetTableId,
      });
    } else {
      mergeAction.execute({
        sourceTableId: sourceTable.id,
        targetTableId: targetTableId,
      });
    }
  };

  const isPending = transferAction.isPending || mergeAction.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {isTransfer ? (
                <ArrowRightLeftIcon className="size-5" />
              ) : (
                <MergeIcon className="size-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                {isTransfer ? "Masayı Taşı (Değişim)" : "Masaları Birleştir"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Kaynak: <strong>{sourceTable.label}</strong> ({orders.length} Adisyon · {totalAmount.toFixed(0)} ₺)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel>
              <span className="text-xs font-bold text-foreground">
                {isTransfer ? "Taşınacak Hedef Masayı Seçin *" : "Hangi Masa ile Birleştirilsin? *"}
              </span>
            </FieldLabel>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {availableTargetTables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTargetTableId(t.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                    targetTableId === t.id
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-102 font-bold"
                      : "border-border/70 hover:bg-muted text-foreground"
                  }`}
                >
                  <UtensilsIcon className="size-4 mb-1 opacity-70" />
                  <span className="text-xs font-black truncate w-full">{t.label}</span>
                  {t.section ? (
                    <span className="text-[10px] opacity-75 truncate w-full mt-0.5">{t.section}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </Field>

          {targetTable && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-foreground">
              {isTransfer ? (
                <span>
                  <strong>{sourceTable.label}</strong> masasındaki tüm açık siparişler ve adisyon detayları <strong>{targetTable.label}</strong> masasına aktarılacak ve eski masa boşaltılacaktır.
                </span>
              ) : (
                <span>
                  <strong>{sourceTable.label}</strong> ve <strong>{targetTable.label}</strong> masalarının siparişleri <strong>{targetTable.label}</strong> üzerinde birleştirilecektir.
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            className="rounded-xl font-bold bg-primary text-primary-foreground cursor-pointer"
            disabled={!targetTableId || isPending}
            onClick={handleExecute}
          >
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin mr-2" />
                İşleniyor…
              </>
            ) : (
              <>
                <CheckCircle2Icon className="size-4 mr-2" />
                {isTransfer ? "Masayı Taşı" : "Masaları Birleştir"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
