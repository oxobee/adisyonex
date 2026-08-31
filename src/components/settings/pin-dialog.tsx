"use client";

import { useState } from "react";

import { toast } from "sonner";

import { setPinAction } from "@/actions/pin.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";

const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, 6);

export function PinDialog({
  mode,
  onOpenChange,
  onSaved,
}: {
  readonly mode: "set" | "change";
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaved: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = useServerAction(setPinAction, {
    onSuccess: () => {
      toast.success(mode === "set" ? "PIN kodu tanımlandı" : "PIN kodu güncellendi");
      onOpenChange(false);
      onSaved();
    },
    onError: (message) => toast.error(message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pin !== confirm) {
      setError("PIN kodları eşleşmiyor");
      return;
    }
    setError(null);
    save.execute({ pin });
  };

  const valid = /^\d{4,6}$/.test(pin) && pin === confirm;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "set" ? "Giriş PIN Kodu Belirle" : "PIN Kodunu Değiştir"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="pin-new">Yeni PIN Kodu (4–6 Haneli)</FieldLabel>
            <Input
              id="pin-new"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={pin}
              onChange={(e) => {
                setPin(onlyDigits(e.target.value));
                setError(null);
              }}
              placeholder="••••••"
              autoFocus
            />
            <FieldDescription>6 haneli olması önerilir.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="pin-confirm">PIN Kodunu Onayla</FieldLabel>
            <Input
              id="pin-confirm"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(onlyDigits(e.target.value));
                setError(null);
              }}
              placeholder="••••••"
            />
            {error ? (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            ) : null}
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={save.isPending || !valid}>
              {save.isPending ? "Kaydediliyor…" : "PIN'i Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
