"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeftIcon, ArrowUpRightIcon, PlusIcon } from "lucide-react";

import { createCashMovementAction } from "@/actions/z-report.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CATEGORY_PRESETS = [
  "Açılış Kasası",
  "Market / Manav",
  "Kurye Masrafı",
  "Personel Avans",
  "Kasa Nakit Girişi",
  "Diğer Gider",
];

export function AddCashMovementDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<"IN" | "OUT">("OUT");
  const [category, setCategory] = useState<string>("Market / Manav");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(",", "."));
    if (!numAmount || numAmount <= 0) {
      toast.error("Lütfen geçerli bir tutar girin.");
      return;
    }

    const selectedCategory = category === "OTHER" ? customCategory.trim() : category;
    if (!selectedCategory) {
      toast.error("Lütfen kategori seçin veya yazın.");
      return;
    }

    setIsPending(true);
    try {
      const res = await createCashMovementAction({
        type,
        category: selectedCategory,
        amount: numAmount,
        description: description.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message);
        onOpenChange(false);
        setAmount("");
        setDescription("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <PlusIcon className="size-5 text-primary" />
            <span>Kasa Hareketi Ekle</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Gün içindeki nakit giriş ve çıkışlarını kaydedin. Bu tutarlar kasa mutabakatına anlık yansır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Hareket Türü (Giriş vs Çıkış) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setType("IN")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer",
                type === "IN"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <ArrowDownLeftIcon className="size-4" />
              <span>Nakit Girişi (+)</span>
            </button>

            <button
              type="button"
              onClick={() => setType("OUT")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer",
                type === "OUT"
                  ? "bg-white text-rose-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <ArrowUpRightIcon className="size-4" />
              <span>Kasa Çıkışı / Gider (−)</span>
            </button>
          </div>

          {/* Kategori Seçimi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Kategori</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                    category === cat
                      ? "bg-primary/10 text-primary border-primary font-bold shadow-2xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tutar */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="amount" className="text-xs font-semibold text-gray-700">
              Tutar (₺)
            </label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-11 rounded-xl border border-gray-300 bg-white px-3.5 text-base font-bold text-gray-900 shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          {/* Açıklama */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="desc" className="text-xs font-semibold text-gray-700">
              Açıklama / Fiş No (Opsiyonel)
            </label>
            <input
              id="desc"
              type="text"
              placeholder="Örn: Market alışverişi fiş no 412"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-xs text-gray-900 shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Hareketi Kaydet"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
