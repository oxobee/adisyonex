"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BotMessageSquareIcon,
  CheckCircle2Icon,
  CrownIcon,
  FileTextIcon,
  FileUpIcon,
  GiftIcon,
  ImagePlusIcon,
  PencilIcon,
  PowerIcon,
  SparklesIcon,
  StoreIcon,
  UserCheckIcon,
  WandSparklesIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  toggleAdminModuleGlobalAction,
  updateAdminModuleAction,
} from "@/actions/admin-modules.actions";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SystemModuleDTO } from "@/services/module.service";

// Icon mapping
function getModuleIcon(key: string) {
  switch (key) {
    case "qr_ai":
      return BotMessageSquareIcon;
    case "admin_ai":
      return SparklesIcon;
    case "ai_menu_import":
      return FileUpIcon;
    case "ai_image_generation":
      return ImagePlusIcon;
    case "ai_photo_enhance":
      return WandSparklesIcon;
    case "ai_copywriter_nutrition":
      return FileTextIcon;
    case "birthday_automation":
      return GiftIcon;
    case "qr_customer_auth":
      return UserCheckIcon;
    default:
      return SparklesIcon;
  }
}

export function ModulesGrid({
  modules,
}: {
  readonly modules: readonly SystemModuleDTO[];
}) {
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<SystemModuleDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleOpenEdit = (mod: SystemModuleDTO) => {
    setSelectedModule(mod);
    setEditName(mod.name);
    setEditDescription(mod.description ?? "");
    setEditPrice(mod.price);
    setEditIsActive(mod.isActive);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    startTransition(async () => {
      const res = await updateAdminModuleAction({
        id: selectedModule.id,
        name: editName,
        description: editDescription || null,
        price: Number(editPrice),
        isActive: editIsActive,
      });

      if (res.success) {
        toast.success("Modül başarıyla güncellendi");
        setSelectedModule(null);
        router.refresh();
      } else {
        toast.error(res.error || "Güncelleme sırasında bir hata oluştu");
      }
    });
  };

  const handleQuickToggle = (mod: SystemModuleDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleAdminModuleGlobalAction({
        id: mod.id,
        isActive: !mod.isActive,
      });

      if (res.success) {
        toast.success(
          `Modül ${!mod.isActive ? "aktif" : "pasif"} duruma getirildi`
        );
        router.refresh();
      } else {
        toast.error(res.error || "İşlem başarısız oldu");
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5 sm:gap-6">
        {modules.map((mod) => {
          const Icon = getModuleIcon(mod.key);

          return (
            <div
              key={mod.id}
              onClick={() => handleOpenEdit(mod)}
              className={cn(
                "group relative flex flex-col justify-between rounded-3xl border bg-card p-5 sm:p-6 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.99]",
                mod.isActive
                  ? "border-border/80 hover:border-primary/50"
                  : "border-border/40 opacity-75 bg-muted/20"
              )}
            >
              {/* Top Row: Icon & Status Badge */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-110 duration-200",
                      mod.isActive
                        ? "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary border border-primary/25"
                        : "bg-muted text-muted-foreground border border-border/60"
                    )}
                  >
                    <Icon className="size-6 stroke-[2]" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border tracking-tight",
                        mod.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                      )}
                    >
                      {mod.isActive ? (
                        <>
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <span className="size-1.5 rounded-full bg-zinc-400" />
                          Pasif
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-black text-base sm:text-lg text-foreground tracking-tight group-hover:text-primary transition-colors leading-snug">
                  {mod.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {mod.description || "Açıklama belirtilmemiş."}
                </p>
              </div>

              {/* Bottom Row: Price, Subscriber Stats & Action */}
              <div className="mt-6 pt-4 border-t border-border/60 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Aylık Fiyat
                    </span>
                    <span className="text-lg sm:text-xl font-black text-foreground tabular-nums">
                      {mod.price.toLocaleString("tr-TR", { minimumFractionDigits: 0 })} {mod.currency}
                      <span className="text-xs font-semibold text-muted-foreground ml-1">/ ay</span>
                    </span>
                  </div>

                  {/* Usage Badge */}
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Kullanıcı
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 font-black text-xs tabular-nums shadow-2xs">
                      <StoreIcon className="size-3" />
                      <span>{mod.activeRestaurantCount} Restoran</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-primary group-hover:underline flex items-center gap-1">
                    <PencilIcon className="size-3" />
                    <span>Detay & Düzenle</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleQuickToggle(mod, e)}
                    disabled={isPending}
                    title={mod.isActive ? "Pasif Yap" : "Aktif Yap"}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border",
                      mod.isActive
                        ? "bg-muted/80 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        : "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30"
                    )}
                  >
                    <PowerIcon className="size-3" />
                    <span>{mod.isActive ? "Kapat" : "Aç"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {selectedModule && (
        <Dialog open onOpenChange={(open) => !open && setSelectedModule(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CrownIcon className="size-5 text-purple-600" />
                <span>Modülü Düzenle</span>
              </DialogTitle>
              <DialogDescription>
                <strong>{selectedModule.name}</strong> için genel sistem yapılandırmasını güncelleyin.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
              <Field>
                <FieldLabel htmlFor="mod-name">Modül Adı</FieldLabel>
                <Input
                  id="mod-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Modül başlığı"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="mod-desc">Açıklama</FieldLabel>
                <textarea
                  id="mod-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Modül hakkında bilgilendirici açıklama"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="mod-price">Aylık Fiyat (₺)</FieldLabel>
                  <Input
                    id="mod-price"
                    type="number"
                    min={0}
                    step={1}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel>Genel Sistem Durumu</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setEditIsActive((p) => !p)}
                    className={cn(
                      "flex h-9 w-full items-center justify-center gap-2 rounded-md border px-3 text-xs font-black transition-all cursor-pointer",
                      editIsActive
                        ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25"
                    )}
                  >
                    {editIsActive ? (
                      <>
                        <CheckCircle2Icon className="size-4" />
                        <span>Genel Aktif</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="size-4" />
                        <span>Genel Pasif</span>
                      </>
                    )}
                  </button>
                </Field>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-3 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Aktif Kullanan Restoran Sayısı:</span>
                <span className="font-black text-foreground">
                  {selectedModule.activeRestaurantCount} Restoran
                </span>
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedModule(null)}
                >
                  Vazgeç
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
