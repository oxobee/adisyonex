"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  Loader2Icon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
  UploadIcon,
  Wand2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteItemImageAction,
  uploadItemImageAction,
} from "@/actions/menu.actions";
import { Button } from "@/components/ui/button";
import type { MenuItemImageDTO } from "@/types/menu";

export interface StagedImage {
  id?: string;
  url: string;
  file?: File;
  isUploading?: boolean;
}

export function ImageManager({
  itemId,
  itemName = "Ürün",
  itemDescription = "",
  images = [],
  onImageUpdated,
  onPendingFilesChange,
}: {
  itemId?: string;
  itemName?: string;
  itemDescription?: string;
  images?: readonly MenuItemImageDTO[];
  onImageUpdated?: () => void;
  onPendingFilesChange?: (files: File[]) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state to keep UI in instant sync
  const [imageList, setImageList] = useState<StagedImage[]>(
    images.map((img) => ({ id: img.id, url: img.url }))
  );
  const [isDragging, setIsDragging] = useState(false);

  // Sync if prop images change
  useEffect(() => {
    setImageList(images.map((img) => ({ id: img.id, url: img.url })));
  }, [images]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const availableSlots = 3 - imageList.length;
    if (availableSlots <= 0) {
      toast.error("En fazla 3 adet fotoğraf yükleyebilirsiniz.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);

    for (const file of filesToProcess) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} boyutu 5 MB'tan büyük olduğu için yüklenemedi.`);
        continue;
      }

      const localBlobUrl = URL.createObjectURL(file);

      if (itemId) {
        // Edit mode: Optimistic UI addition immediately
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        setImageList((prev) => [
          ...prev,
          { id: tempId, url: localBlobUrl, isUploading: true },
        ]);

        // Upload in background
        const form = new FormData();
        form.set("itemId", itemId);
        form.set("file", file);

        try {
          const res = await uploadItemImageAction(form);
          if (res.success && res.data) {
            setImageList((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? { id: res.data!.id, url: res.data!.url, isUploading: false }
                  : item
              )
            );
            toast.success("Fotoğraf eklendi!");
            onImageUpdated?.();
            router.refresh();
          } else {
            setImageList((prev) => prev.filter((item) => item.id !== tempId));
            toast.error(res.error || "Görsel yüklenemedi.");
          }
        } catch {
          setImageList((prev) => prev.filter((item) => item.id !== tempId));
          toast.error("Görsel yüklenirken bir hata oluştu.");
        }
      } else {
        // Create mode (New item): Stage file locally
        setImageList((prev) => {
          const updated = [...prev, { url: localBlobUrl, file }];
          const pending = updated.filter((x) => x.file).map((x) => x.file!);
          onPendingFilesChange?.(pending);
          return updated;
        });
        toast.success("Fotoğraf eklendi (Ürün kaydedildiğinde yüklenecek)");
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async (indexToRemove: number) => {
    const target = imageList[indexToRemove];
    if (!target) return;

    // Remove from UI INSTANTLY with zero lag
    setImageList((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      const pending = updated.filter((x) => x.file).map((x) => x.file!);
      onPendingFilesChange?.(pending);
      return updated;
    });

    // If already saved on server, delete via action
    if (target.id && !target.id.startsWith("temp-")) {
      try {
        const res = await deleteItemImageAction({ imageId: target.id });
        if (res.success) {
          toast.success("Fotoğraf silindi!");
          onImageUpdated?.();
          router.refresh();
        } else {
          toast.error(res.error || "Fotoğraf silinemedi.");
        }
      } catch {
        toast.error("Fotoğraf silinirken bir hata oluştu.");
      }
    } else {
      toast.success("Fotoğraf kaldırıldı!");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <CameraIcon className="size-4 text-primary" />
          Ürün Fotoğrafları
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
          {imageList.length} / 3 Fotoğraf
        </span>
      </div>

      {/* DRAG & DROP ZONE AND THUMBNAILS */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col gap-3 rounded-2xl border-2 border-dashed p-3.5 transition-all ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border/80 bg-card hover:border-primary/40"
        }`}
      >
        {/* Thumbnails list */}
        {imageList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            {imageList.map((img, idx) => (
              <div key={img.id || idx} className="relative size-20 shrink-0 group">
                <div className="bg-muted relative size-20 overflow-hidden rounded-2xl border border-border/80 shadow-xs transition-transform duration-200 group-hover:scale-105">
                  <Image
                    src={img.url}
                    alt={itemName}
                    fill
                    className="object-cover object-center"
                    sizes="80px"
                  />
                  {img.isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white gap-1">
                      <Loader2Icon className="size-4 animate-spin text-white" />
                      <span className="text-[9px] font-bold">Yükleniyor</span>
                    </div>
                  )}
                </div>
                {!img.isUploading && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="absolute -top-1.5 -right-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:bg-destructive/90 transition-transform active:scale-90 cursor-pointer"
                    aria-label="Fotoğrafı sil"
                    title="Fotoğrafı Kaldır"
                  >
                    <Trash2Icon className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Trigger Area */}
        {imageList.length < 3 && (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 text-center rounded-xl hover:bg-muted/40 cursor-pointer transition-colors"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UploadCloudIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Fotoğraf Yükleyin veya Sürükleyip Bırakın
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                PNG, JPG, WEBP (Maks. 5 MB) · Kalan slot: {3 - imageList.length}
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* AI STUDIO DIRECT BUTTONS */}
      <div className="mt-1 flex items-center gap-2">
        {imageList.length === 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 rounded-xl font-bold text-xs gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            render={
              <Link
                href={`/dashboard/ai-studio/image-studio?${
                  itemId ? `itemId=${encodeURIComponent(itemId)}&` : ""
                }name=${encodeURIComponent(itemName)}&desc=${encodeURIComponent(
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
                href={`/dashboard/ai-studio/photo-enhance?${
                  itemId ? `itemId=${encodeURIComponent(itemId)}&` : ""
                }name=${encodeURIComponent(itemName)}`}
              />
            }
          >
            <Wand2Icon className="size-3.5 text-emerald-500" />
            Yapay Zeka ile Güzelleştir (Stüdyoyu Aç)
          </Button>
        )}
      </div>
    </div>
  );
}
