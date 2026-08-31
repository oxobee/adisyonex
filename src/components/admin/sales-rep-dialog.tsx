"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeadphonesIcon, SaveIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createSalesRepAction,
  updateSalesRepAction,
} from "@/actions/sales-rep.actions";
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
  const isEditing = Boolean(salesRep);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("Kıdemli Satış & Müşteri Temsilcisi");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

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

  const isPending = createAction.isPending || updateAction.isPending;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 shadow-2xl">
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
              <FieldLabel>Profil Fotoğrafı URL</FieldLabel>
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
              className="rounded-xl font-black"
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
