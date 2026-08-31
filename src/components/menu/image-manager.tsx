"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Trash2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { deleteItemImageAction, uploadItemImageAction } from "@/actions/menu.actions"
import { useServerAction } from "@/hooks/use-server-action"
import type { MenuItemImageDTO } from "@/types/menu"

export function ImageManager({
  itemId,
  images,
}: {
  itemId: string
  images: readonly MenuItemImageDTO[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const remove = useServerAction(deleteItemImageAction, {
    onSuccess: () => {
      toast.success("Fotoğraf silindi")
      router.refresh()
    },
    onError: (message) => toast.error(message),
  })

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.set("itemId", itemId)
    form.set("file", file)
    const result = await uploadItemImageAction(form)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
    if (result.success) {
      toast.success("Fotoğraf eklendi")
      router.refresh()
    } else {
      toast.error(result.error ?? "Yükleme başarısız oldu")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Ürün Fotoğrafları</span>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative">
            <Image
              src={img.url}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => remove.execute({ imageId: img.id })}
              className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-1 text-white"
              aria-label="Fotoğrafı sil"
            >
              <Trash2Icon className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= 3}
          className="flex size-16 items-center justify-center rounded-md border border-dashed text-muted-foreground disabled:opacity-50"
          aria-label="Fotoğraf ekle"
        >
          <UploadIcon className="size-5" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
      <p className="text-muted-foreground text-xs">
        En fazla 3 fotoğraf yükleyebilirsiniz (maks. 5 MB).
      </p>
    </div>
  )
}
