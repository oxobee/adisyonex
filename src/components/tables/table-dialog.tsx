"use client";

import { useState } from "react";

import { toast } from "sonner";

import { createTableAction, updateTableAction } from "@/actions/table.actions";
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
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import type { TableDTO } from "@/types/table";

export function TableDialog({
  table,
  onOpenChange,
  onSaved,
}: {
  readonly table: TableDTO | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaved: () => void;
}) {
  const [label, setLabel] = useState(table?.label ?? "");
  const [seats, setSeats] = useState(table?.seats != null ? String(table.seats) : "");
  const [section, setSection] = useState(table?.section ?? "");
  const [isActive, setIsActive] = useState(table?.isActive ?? true);

  const save = useServerAction(table ? updateTableAction : createTableAction, {
    onSuccess: () => {
      toast.success(table ? "Masa güncellendi" : "Masa eklendi");
      onOpenChange(false);
      onSaved();
    },
    onError: (message) => toast.error(message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      label,
      seats: seats ? Number(seats) : undefined,
      section: section.trim() || undefined,
      isActive,
    };
    save.execute(table ? { ...payload, id: table.id } : payload);
  };

  const QUICK_SEATS = ["2", "4", "6", "8", "10", "12"];
  const QUICK_SECTIONS = ["Salon", "Bahçe", "Teras", "Balkon", "VIP"];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-gray-900">
            {table ? "Masayı Düzenle" : "Yeni Masa Ekle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="t-label" className="text-xs font-bold text-gray-700">
                Masa Adı / No
              </FieldLabel>
              <Input
                id="t-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Örn: Masa 1"
                className="rounded-xl"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="t-seats" className="text-xs font-bold text-gray-700">
                Kapasite (Kişi)
              </FieldLabel>
              <Input
                id="t-seats"
                inputMode="numeric"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                placeholder="4"
                className="rounded-xl"
              />
            </Field>
          </div>

          {/* Hızlı Kapasite Seçici */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 mr-1">Hızlı:</span>
            {QUICK_SEATS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeats(s)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  seats === s
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {s} Kişilik
              </button>
            ))}
          </div>

          <Field>
            <FieldLabel htmlFor="t-section" className="text-xs font-bold text-gray-700">
              Bölüm / Alan
            </FieldLabel>
            <Input
              id="t-section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Salon, Teras, Bahçe…"
              className="rounded-xl"
            />
          </Field>

          {/* Hızlı Bölüm Seçici */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 mr-1">Bölüm:</span>
            {QUICK_SECTIONS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSection(sec)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  section === sec
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
            <Switch id="t-active" checked={isActive} onCheckedChange={setIsActive} />
            <label htmlFor="t-active" className="text-xs font-bold text-gray-700 cursor-pointer">
              Müşteri oturumuna ve siparişe açık (Aktif)
            </label>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              className="rounded-xl font-bold"
              disabled={save.isPending || !label.trim()}
            >
              {save.isPending ? "Kaydediliyor…" : table ? "Güncelle" : "Masa Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
