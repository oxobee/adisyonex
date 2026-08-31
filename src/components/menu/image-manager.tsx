"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  CheckIcon,
  Loader2Icon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
  Wand2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteItemImageAction,
  uploadItemImageAction,
} from "@/actions/menu.actions";
import {
  enhanceAndAttachItemImageAction,
  generateAndAttachItemImageAction,
} from "@/actions/ai.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerAction } from "@/hooks/use-server-action";
import type { MenuItemImageDTO } from "@/types/menu";

export function ImageManager({
  itemId,
  itemName = "Ürün",
  itemDescription = "",
  images,
  onImageUpdated,
}: {
  itemId: string;
  itemName?: string;
  itemDescription?: string;
  images: readonly MenuItemImageDTO[];
  onImageUpdated?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [optimisticPreview, setOptimisticPreview] = useState<string | null>(null);

  // AI Confirmation Modal state
  const [aiConfirmModal, setAiConfirmModal] = useState<{
    type: "GENERATE" | "ENHANCE";
    cost: number;
    title: string;
    description: string;
  } | null>(null);

  const [aiLoading, setAiLoading] = useState(false);

  const remove = useServerAction(deleteItemImageAction, {
    onSuccess: () => {
      toast.success("Fotoğraf silindi");
      onImageUpdated?.();
      router.refresh();
    },
    onError: (message) => toast.error(message),
  });

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5 MB'tan küçük olmalıdır.");
      return;
    }

    // Instant local preview for zero-lag feeling
    const localUrl = URL.createObjectURL(file);
    setOptimisticPreview(localUrl);
    setUploading(true);

    const form = new FormData();
    form.set("itemId", itemId);
    form.set("file", file);

    const result = await uploadItemImageAction(form);
    setUploading(false);
    setOptimisticPreview(null);
    URL.revokeObjectURL(localUrl);

    if (inputRef.current) inputRef.current.value = "";

    if (result.success) {
      toast.success("Fotoğraf başarıyla yüklendi!");
      onImageUpdated?.();
      router.refresh();
    } else {
      toast.error(result.error ?? "Yükleme başarısız oldu");
    }
  };

  const handleAiActionConfirm = async () => {
    if (!aiConfirmModal) return;
    setAiLoading(true);

    try {
      if (aiConfirmModal.type === "GENERATE") {
        const res = await generateAndAttachItemImageAction({
          itemId,
          name: itemName,
          description: itemDescription || undefined,
        });

        if (res.success) {
          toast.success("Yapay zeka ile stüdyo fotoğrafı oluşturuldu ve ürüne eklendi!");
          setAiConfirmModal(null);
          onImageUpdated?.();
          router.refresh();
        } else {
          toast.error(res.error || "İşlem başarısız oldu, lütfen yeniden deneyiniz. Kredileriniz geri yüklendi.");
        }
      } else {
        // ENHANCE
        const firstImg = images[0];
        if (!firstImg) {
          toast.error("Güzelleştirilecek görsel bulunamadı.");
          return;
        }

        const res = await enhanceAndAttachItemImageAction({
          itemId,
          imageUrl: firstImg.url,
          dishName: itemName,
        });

        if (res.success) {
          toast.success("Fotoğrafınız yapay zeka ile profesyonel stüdyo kalitesine yükseltildi!");
          setAiConfirmModal(null);
          onImageUpdated?.();
          router.refresh();
        } else {
          toast.error(res.error || "İşlem başarısız oldu, lütfen yeniden deneyiniz. Kredileriniz geri yüklendi.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız oldu, lütfen yeniden deneyiniz. Kredileriniz geri yüklendi.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <CameraIcon className="size-4 text-primary" />
          Ürün Fotoğrafları
        </span>
        <span className="text-[11px] text-muted-foreground">
          {images.length}/3 Fotoğraf
        </span>
      </div>

      {/* Image Thumbnails Gallery */}
      <div className="flex flex-wrap items-center gap-2.5">
        {images.map((img) => (
          <div key={img.id} className="relative size-20 shrink-0 group">
            <div className="bg-muted relative size-20 overflow-hidden rounded-2xl border border-border/80 shadow-xs transition-transform duration-200 group-hover:scale-105">
              <Image
                src={img.url}
                alt={itemName}
                fill
                className="object-cover object-center"
                sizes="80px"
              />
            </div>
            <button
              type="button"
              onClick={() => remove.execute({ imageId: img.id })}
              className="absolute -top-1.5 -right-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90 transition-transform active:scale-90 cursor-pointer"
              aria-label="Fotoğrafı sil"
              title="Fotoğrafı Sil"
            >
              <Trash2Icon className="size-3" />
            </button>
          </div>
        ))}

        {/* Optimistic Preview with Spinner while Uploading */}
        {optimisticPreview && (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/50 bg-muted shadow-sm animate-pulse flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimisticPreview}
              alt="Yükleniyor"
              className="size-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white gap-1">
              <Loader2Icon className="size-5 animate-spin" />
              <span className="text-[9px] font-bold">Yükleniyor</span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {images.length < 3 && !optimisticPreview && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border/80 bg-card hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95 cursor-pointer"
            aria-label="Fotoğraf ekle"
          >
            {uploading ? (
              <Loader2Icon className="size-5 animate-spin text-primary" />
            ) : (
              <>
                <UploadIcon className="size-5" />
                <span className="text-[10px] font-bold">Görsel Seç</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />

      {/* AI BUTTONS: IF NO IMAGE -> OPEN IMAGE STUDIO WITH PREFILLED DATA */}
      <div className="mt-1 flex items-center gap-2">
        {images.length === 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 rounded-xl font-bold text-xs gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            render={
              <Link
                href={`/dashboard/ai-studio/image-studio?itemId=${encodeURIComponent(
                  itemId,
                )}&name=${encodeURIComponent(itemName)}&desc=${encodeURIComponent(
                  itemDescription || "",
                )}`}
              />
            }
          >
            <SparklesIcon className="size-3.5 text-purple-500" />
            Yapay Zeka ile Görsel Üret (Stüdyoyu Aç)
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 rounded-xl font-bold text-xs gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            render={
              <Link
                href={`/dashboard/ai-studio/photo-enhance?itemId=${encodeURIComponent(
                  itemId,
                )}&name=${encodeURIComponent(itemName)}`}
              />
            }
          >
            <Wand2Icon className="size-3.5 text-emerald-500" />
            Yapay Zeka ile Güzelleştir (Stüdyoyu Aç)
          </Button>
        )}
      </div>

      {/* AI CREDIT CONFIRMATION MODAL */}
      {aiConfirmModal && (
        <Dialog open onOpenChange={(open) => !open && !aiLoading && setAiConfirmModal(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6">
            <DialogHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-purple-600 dark:text-purple-400 mx-auto mb-2 shadow-xs">
                <SparklesIcon className="size-6 text-amber-500" />
              </div>
              <DialogTitle className="text-center font-black text-base">
                {aiConfirmModal.title}
              </DialogTitle>
              <DialogDescription className="text-center text-xs mt-1 leading-relaxed">
                {aiConfirmModal.description}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border bg-muted/40 p-3.5 my-2 text-xs flex items-center justify-between">
              <span className="font-semibold text-muted-foreground">Kullanılacak Kredi:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {aiConfirmModal.cost} AI Kredisi
              </span>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-center mt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold text-xs"
                disabled={aiLoading}
                onClick={() => setAiConfirmModal(null)}
              >
                Vazgeç
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-1.5 cursor-pointer"
                disabled={aiLoading}
                onClick={handleAiActionConfirm}
              >
                {aiLoading ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    İşleniyor…
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-3.5" />
                    Onayla & Üret
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
