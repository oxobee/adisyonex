"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  HeadphonesIcon,
  Loader2Icon,
  SaveIcon,
  Trash2Icon,
  UploadCloudIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSalesRepAction,
  updateSalesRepAction,
  uploadSalesRepPhotoAction,
} from "@/actions/sales-rep.actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import type { SalesRepDTO } from "@/services/sales-rep.service";

export function SalesRepDialog({
  salesRep,
  open,
  onOpenChange,
}: {
  readonly salesRep?: SalesRepDTO | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(salesRep);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("Kıdemli Satış & Müşteri Temsilcisi");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (salesRep) {
      setName(salesRep.name);
      setTitle(salesRep.title || "Kıdemli Satış & Müşteri Temsilcisi");
      setPhone(salesRep.phone || "");
      setWhatsapp(salesRep.whatsapp || "");
      setEmail(salesRep.email || "");
      setPhotoUrl(salesRep.photoUrl || "");
      setNotes(salesRep.notes || "");
      setIsActive(salesRep.isActive);
    } else {
      setName("");
      setTitle("Kıdemli Satış & Müşteri Temsilcisi");
      setPhone("");
      setWhatsapp("");
      setEmail("");
      setPhotoUrl("");
      setNotes("");
      setIsActive(true);
    }
  }, [salesRep, open]);

  const createAction = useServerAction(createSalesRepAction, {
    onSuccess: () => {
      toast.success("Satış temsilcisi başarıyla eklendi.");
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => toast.error(err || "Ekleme başarısız."),
  });

  const updateAction = useServerAction(updateSalesRepAction, {
    onSuccess: () => {
      toast.success("Satış temsilcisi güncellendi.");
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => toast.error(err || "Güncelleme başarısız."),
  });

  const isPending = createAction.isPending || updateAction.isPending || isUploadingPhoto;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir resim dosyası seçin.");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.set("file", file);

      const result = await uploadSalesRepPhotoAction(formData);
      if (result.success && result.data?.url) {
        setPhotoUrl(result.data.url);
        toast.success("Fotoğraf yüklendi.");
      } else {
        toast.error(result.error || "Fotoğraf yüklenemedi.");
      }
    } catch (err) {
      toast.error("Fotoğraf yükleme hatası oluştu.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Lütfen temsilci adını ve soyadını giriniz.");
      return;
    }

    const payload = {
      name: name.trim(),
      title: title.trim(),
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      photoUrl: photoUrl.trim() || null,
      notes: notes.trim() || null,
      isActive,
    };

    if (isEditing && salesRep) {
      await updateAction.execute({ id: salesRep.id, data: payload });
    } else {
      await createAction.execute(payload);
    }
  };

  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <HeadphonesIcon className="size-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              {isEditing ? "Temsilci Düzenle" : "Yeni Temsilci Tanımla"}
            </span>
          </div>
          <DialogTitle className="text-xl font-black">
            {isEditing ? salesRep?.name : "Yeni Satış & Müşteri Temsilcisi"}
          </DialogTitle>
          <DialogDescription>
            Müşterilerin panelinde ve lisans uyarılarında görüntülenecek yetkili temsilci bilgileri.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* PHOTO UPLOAD & PREVIEW SECTION */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/30 bg-card shadow-sm">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Temsilci Fotoğrafı"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Avatar className="size-full rounded-2xl">
                  <AvatarFallback className="rounded-2xl text-lg font-black text-primary bg-primary/10">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}

              {isUploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
                  <Loader2Icon className="size-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <span className="block text-xs font-bold text-foreground">
                Temsilci Profil Fotoğrafı
              </span>
              <p className="text-[11px] text-muted-foreground">
                JPG, PNG veya WebP formatında önerilen boyut 400x400 px.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  <UploadCloudIcon className="size-3.5 mr-1 text-primary" />
                  Cihazdan Fotoğraf Seç
                </Button>

                {photoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isUploadingPhoto}
                    onClick={() => setPhotoUrl("")}
                    className="rounded-xl text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2Icon className="size-3.5 mr-1" />
                    Kaldır
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Ad Soyad *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                required
                className="h-10 rounded-xl"
              />
            </Field>

            <Field>
              <FieldLabel>Unvan / Görev</FieldLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Kıdemli Satış Danışmanı"
                className="h-10 rounded-xl"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel>İletişim Telefonu</FieldLabel>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Örn: +90 555 123 4567"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </Field>

            <Field>
              <FieldLabel>WhatsApp Numarası</FieldLabel>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Örn: 905551234567"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel>E-Posta Adresi</FieldLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Örn: ahmet@elitalerestro.com"
                className="h-10 rounded-xl text-xs"
              />
            </Field>

            <Field>
              <FieldLabel>Fotoğraf URL (İsteğe Bağlı)</FieldLabel>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://.../photo.jpg"
                className="h-10 rounded-xl text-xs"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>Çalışma Saatleri & Notlar</FieldLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Hafta içi 09:00 - 19:00 saatleri arasında kesintisiz ulaşabilirsiniz."
              rows={2}
              className="rounded-xl text-xs"
            />
          </Field>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-bold text-foreground cursor-pointer">
              Temsilci Aktif (Müşterilere atanabilir ve kartta görünür)
            </label>
          </div>

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
              disabled={isPending}
              className="rounded-xl font-black cursor-pointer"
            >
              <SaveIcon className="size-4 mr-1.5" />
              {isPending ? "Kaydediliyor..." : isEditing ? "Değişiklikleri Kaydet" : "Temsilci Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
