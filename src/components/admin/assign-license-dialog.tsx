"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  CrownIcon,
  InfinityIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";

import { adminAssignLicenseAction } from "@/actions/license.actions";
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
import type { RestaurantListItemDTO } from "@/types/admin";
import type { LicensePlan } from "@/generated/prisma/client";

export function AssignLicenseDialog({
  restaurant,
  open,
  onOpenChange,
}: {
  restaurant: RestaurantListItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<LicensePlan>(restaurant?.licensePlan || "MONTHLY");
  const [customDays, setCustomDays] = useState<string>("30");
  const [addAiCredits, setAddAiCredits] = useState<string>("100");
  const [note, setNote] = useState<string>("");

  const assignAction = useServerAction(adminAssignLicenseAction, {
    onSuccess: (res) => {
      toast.success(
        `"${restaurant?.name}" için ${res?.planLabel ?? "Lisans"} tanımlandı (${res?.daysRemaining === 9999 ? "Süresiz" : `${res?.daysRemaining ?? 0} gün`})!`,
      );
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => toast.error(err || "Lisans tanımlanamadı."),
  });

  if (!restaurant) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignAction.execute({
      restaurantId: restaurant.id,
      plan,
      customDays: plan === "LIFETIME" ? undefined : Number(customDays) || undefined,
      addAiCredits: Number(addAiCredits) || 0,
      note: note.trim() || undefined,
    });
  };

  const PLANS = [
    {
      id: "MONTHLY",
      title: "💎 Aylık Lisans",
      subtitle: "+30 Gün Kullanım",
      badge: "Standart",
      defaultCredits: "100",
      days: 30,
    },
    {
      id: "YEARLY",
      title: "👑 Yıllık Pro Lisans",
      subtitle: "+365 Gün (1 Yıl) Kullanım",
      badge: "En Popüler",
      defaultCredits: "1500",
      days: 365,
    },
    {
      id: "TRIAL",
      title: "⚡ Deneme Sürümü",
      subtitle: "+14 Gün Ücretsiz Test",
      badge: "Trial",
      defaultCredits: "50",
      days: 14,
    },
    {
      id: "LIFETIME",
      title: "♾️ Süresiz / Ömür Boyu",
      subtitle: "Süre Sınırı Yok",
      badge: "VIP",
      defaultCredits: "5000",
      days: 0,
    },
  ];

  const handleSelectPlan = (p: (typeof PLANS)[number]) => {
    setPlan(p.id as LicensePlan);
    if (p.days > 0) setCustomDays(String(p.days));
    setAddAiCredits(p.defaultCredits);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Lisans & Kredi Yönetimi
              </DialogTitle>
              <DialogDescription className="text-xs">
                <strong>{restaurant.name}</strong> ({restaurant.ownerName || "Yönetici"})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current State Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-muted/20 p-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Mevcut Lisans:</span>
            <span className="font-bold text-foreground">
              {restaurant.licensePlan || "TRIAL"} (
              {restaurant.licenseDaysRemaining === 9999
                ? "Süresiz"
                : `${restaurant.licenseDaysRemaining ?? 0} Gün Kaldı`}
              )
            </span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block text-[11px]">AI Bakiye:</span>
            <span className="font-black text-amber-600 dark:text-amber-400">
              {restaurant.aiBalance ?? 0} Kredi
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Plan Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-foreground">Lisans Planı Seçin *</label>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPlan(p)}
                  className={`flex flex-col text-left rounded-2xl border p-3 transition-all cursor-pointer ${
                    plan === p.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                      : "border-border/70 hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground">{p.title}</span>
                    <span className="text-[9px] font-bold uppercase rounded-full bg-primary/15 text-primary px-1.5 py-0.2">
                      {p.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {p.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Days Input if not Lifetime */}
          {plan !== "LIFETIME" && (
            <Field>
              <FieldLabel htmlFor="license-days">
                <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <CalendarDaysIcon className="size-3.5 text-primary" />
                  Eklenecek Gün Sayısı
                </span>
              </FieldLabel>
              <Input
                id="license-days"
                type="number"
                min={1}
                max={3650}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </Field>
          )}

          {/* AI Credits Top-up */}
          <Field>
            <FieldLabel htmlFor="ai-credits">
              <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                <SparklesIcon className="size-3.5 text-amber-500" />
                Tanımlanacak Yapay Zeka Kredisi (Opsiyonel)
              </span>
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="ai-credits"
                type="number"
                min={0}
                max={100000}
                value={addAiCredits}
                onChange={(e) => setAddAiCredits(e.target.value)}
                className="h-11 rounded-xl"
              />
              <div className="flex gap-1">
                {["100", "500", "1500"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAddAiCredits(preset)}
                    className="rounded-xl border border-border/80 bg-muted/40 px-2.5 py-2 text-xs font-bold hover:bg-muted text-foreground cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Admin Note */}
          <Field>
            <FieldLabel htmlFor="license-note">Lisans / Ödeme Notu</FieldLabel>
            <Textarea
              id="license-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: 1 Yıllık EFT ödemesi alındı, kampanya kapsamında 1500 kredi hediye edildi."
              className="rounded-xl text-xs"
            />
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="rounded-xl font-bold bg-primary text-primary-foreground cursor-pointer"
              disabled={assignAction.isPending}
            >
              {assignAction.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin mr-2" />
                  Tanımlanıyor…
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-4 mr-2" />
                  Lisansı Tanımla ve Güncelle
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
