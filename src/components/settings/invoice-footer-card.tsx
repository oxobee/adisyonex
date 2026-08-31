"use client";

import { useState } from "react";

import { toast } from "sonner";

import { setInvoiceFooterAction } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";

export function InvoiceFooterCard({ note }: { readonly note: string }) {
  const [value, setValue] = useState(note);

  const save = useServerAction(setInvoiceFooterAction, {
    refresh: true,
    onSuccess: () => toast.success("Fiş alt bilgi metni güncellendi"),
    onError: (message) => toast.error(message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fiş / Fatura Alt Notu</CardTitle>
        <CardDescription>
          Her hesap fişinin ve faturanın en altında basılacak özel teşekkür ve bilgilendirme mesajı.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Örn: Afiyet olsun! Bizi tercih ettiğiniz için teşekkür ederiz."
        />
        <div className="flex items-center justify-between gap-3">
          <FieldDescription>
            En fazla 300 karakter. Kaldırmak için boş bırakın.
          </FieldDescription>
          <Button
            size="sm"
            disabled={save.isPending || value.trim() === note.trim()}
            onClick={() => save.execute({ note: value.trim() })}
          >
            {save.isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
