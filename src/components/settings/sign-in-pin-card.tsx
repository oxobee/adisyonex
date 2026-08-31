"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { removePinAction } from "@/actions/pin.actions";
import { PinDialog } from "@/components/settings/pin-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import type { PinStatus } from "@/services/pin-auth.service";

export function SignInPinCard({ status }: { readonly status: PinStatus }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const remove = async () => {
    setRemoving(true);
    const result = await removePinAction();
    setRemoving(false);
    if (result.success) {
      toast.success("PIN kodu kaldırıldı");
      setRemoveOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "İşlem başarısız oldu");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yönetici Giriş PIN Kodu</CardTitle>
        <CardDescription>
          SMS onay kodu beklemeden telefon numaranız ve belirlediğiniz PIN kodu ile hızlıca giriş yapın.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        {status.hasPin ? (
          <p className="text-muted-foreground text-sm">
            PIN kodu aktif
            {status.pinUpdatedAt
              ? ` · güncellendi ${formatDateTime(status.pinUpdatedAt)}`
              : ""}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            PIN kodu tanımlanmamış. Girişler SMS doğrulama kodu ile yapılmaktadır.
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            {status.hasPin ? "PIN Değiştir" : "PIN Belirle"}
          </Button>
          {status.hasPin ? (
            <Button variant="outline" onClick={() => setRemoveOpen(true)}>
              Kaldır
            </Button>
          ) : null}
        </div>
      </CardContent>

      {dialogOpen ? (
        <PinDialog
          mode={status.hasPin ? "change" : "set"}
          onOpenChange={setDialogOpen}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {removeOpen ? (
        <Dialog open onOpenChange={(open) => !open && setRemoveOpen(false)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Giriş PIN kodunuzu kaldırmak istiyor musunuz?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Yeni bir PIN belirleyene kadar tek seferlik SMS doğrulama koduyla giriş yaparsınız.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRemoveOpen(false)}>
                Vazgeç
              </Button>
              <Button variant="destructive" disabled={removing} onClick={remove}>
                {removing ? "Kaldırılıyor…" : "PIN'i Kaldır"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}
