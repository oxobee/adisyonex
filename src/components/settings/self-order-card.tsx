"use client";

import { useState } from "react";

import { toast } from "sonner";

import { setSelfOrderEnabledAction } from "@/actions/settings.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useServerAction } from "@/hooks/use-server-action";

export function SelfOrderCard({
  enabled,
  username,
}: {
  readonly enabled: boolean;
  readonly username: string;
}) {
  const [checked, setChecked] = useState(enabled);

  const save = useServerAction(setSelfOrderEnabledAction, {
    refresh: true,
    onSuccess: () => toast.success("Müşteri QR sipariş ayarı güncellendi"),
    onError: (message) => {
      setChecked((prev) => !prev);
      toast.error(message);
    },
  });

  const onToggle = (next: boolean) => {
    setChecked(next);
    save.execute({ enabled: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Müşteri QR Siparişi (Self-Ordering)</CardTitle>
        <CardDescription>
          Masadaki müşterilerin QR kod okutarak kendi telefonlarından sipariş vermesini sağlayın.
          Siparişler doğrudan mutfak ekranına düşer ve masa hesabına bağlanır.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="self-order" className="text-sm font-medium">
            {checked ? "Aktif" : "Devre Dışı"}
          </label>
          <Switch
            id="self-order"
            checked={checked}
            disabled={save.isPending}
            onCheckedChange={onToggle}
          />
        </div>
        <FieldDescription>
          Masa QR kodları{" "}
          <span className="font-mono">/order/{username}?table=…</span> adresine yönlendirir.
          Müşteriler ilk siparişlerinde telefon numaraları ile tek seferlik doğrulama yapabilirler.
        </FieldDescription>
      </CardContent>
    </Card>
  );
}
