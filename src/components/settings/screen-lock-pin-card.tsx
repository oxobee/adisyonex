"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, LockIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { updateScreenLockPinAction } from "@/actions/settings.actions";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ScreenLockPinCard({
  initialPin = "0000",
}: {
  readonly initialPin?: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("PIN kodu tam olarak 4 haneli rakamlardan oluşmalıdır.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Girdiğiniz PIN kodları birbiriyle eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateScreenLockPinAction(newPin);
      if (res.success) {
        toast.success("Ekran kilit PIN kodu başarıyla güncellendi!");
        setDialogOpen(false);
        setNewPin("");
        setConfirmPin("");
        router.refresh();
      } else {
        toast.error(res.error || "PIN güncellenemedi.");
      }
    } catch {
      toast.error("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <LockIcon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-foreground">
              Ana Ekran Kilidi PIN Kodu
            </CardTitle>
            <CardDescription className="text-xs">
              Ana ekrandaki &ldquo;Ekranı Kilitle&rdquo; butonuna basıldığında terminali korumak için kullanılan 4 haneli güvenlik PIN&apos;i.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Kilit Durumu:</span>
            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <ShieldCheckIcon className="size-3.5" />
              Aktif Koruma (4 Hane)
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Varsayılan fabrika şifresi: <code className="font-mono font-bold text-foreground">0000</code>
          </span>
        </div>

        <Button
          type="button"
          onClick={() => {
            setNewPin("");
            setConfirmPin("");
            setDialogOpen(true);
          }}
          className="rounded-xl font-bold cursor-pointer gap-2"
        >
          <KeyRoundIcon className="size-4" />
          <span>Kilit PIN Kodunu Değiştir</span>
        </Button>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black">
                Yeni Ekran Kilit PIN Kodu Belirle
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ekran kilidini açmak için kullanılacak 4 haneli yeni şifrenizi girin.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-lock-pin" className="text-xs font-bold text-foreground">
                  Yeni 4 Haneli PIN
                </label>
                <Input
                  id="new-lock-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="rounded-xl text-center font-mono text-2xl tracking-[0.4em] font-black h-12"
                  autoFocus
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-lock-pin" className="text-xs font-bold text-foreground">
                  Yeni PIN&apos;i Tekrar Girin
                </label>
                <Input
                  id="confirm-lock-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="rounded-xl text-center font-mono text-2xl tracking-[0.4em] font-black h-12"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl font-bold"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
                className="rounded-xl font-black bg-primary text-primary-foreground gap-2"
              >
                {loading ? "Kaydediliyor…" : "PIN Kodunu Güncelle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
