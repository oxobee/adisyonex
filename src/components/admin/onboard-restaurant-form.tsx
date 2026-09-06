"use client";

import { useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  CrownIcon,
  InfinityIcon,
  LayersIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";

import { onboardRestaurantAction } from "@/actions/restaurant.actions";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import type { LicensePlan } from "@/generated/prisma/client";

const PRESET_PACKAGES = [
  {
    id: "MONTHLY" as LicensePlan,
    title: "💎 Aylık Lisans",
    badge: "Standart",
    days: 30,
    daysLabel: "30 Gün Kullanım",
    aiCredits: 100,
    icon: CalendarDaysIcon,
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
  },
  {
    id: "YEARLY" as LicensePlan,
    title: "👑 Yıllık Pro Lisans",
    badge: "En Popüler",
    days: 365,
    daysLabel: "365 Gün (1 Yıl)",
    aiCredits: 1500,
    icon: CrownIcon,
    color: "from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400",
  },
  {
    id: "TRIAL" as LicensePlan,
    title: "⚡ Deneme Sürümü",
    badge: "Trial",
    days: 14,
    daysLabel: "14 Gün Ücretsiz Test",
    aiCredits: 50,
    icon: ZapIcon,
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  },
  {
    id: "LIFETIME" as LicensePlan,
    title: "♾️ Süresiz / Ömür Boyu",
    badge: "VIP Sınırsız",
    days: 0,
    daysLabel: "Süre Sınırı Yok",
    aiCredits: 5000,
    icon: InfinityIcon,
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  },
] as const;

export function OnboardRestaurantForm() {
  const [name, setName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Lisans & Yapay Zeka Kredisi State
  const [licenseType, setLicenseType] = useState<"PACKAGE" | "CUSTOM">("PACKAGE");
  const [selectedPlan, setSelectedPlan] = useState<LicensePlan>("MONTHLY");
  const [customDays, setCustomDays] = useState<string>("45");
  const [customAiCredits, setCustomAiCredits] = useState<string>("250");
  const [licenseNote, setLicenseNote] = useState<string>("");

  const { execute, isPending } = useServerAction(onboardRestaurantAction, {
    redirectTo: "/admin/restaurants",
    refresh: true,
    onError: (message) => setError(message),
  });

  const calculatedExpiryDate = useMemo(() => {
    if (licenseType === "PACKAGE") {
      const pkg = PRESET_PACKAGES.find((p) => p.id === selectedPlan);
      if (!pkg || pkg.id === "LIFETIME") return "Süresiz (Son Kullanma Yok)";
      const target = new Date(Date.now() + pkg.days * 24 * 60 * 60 * 1000);
      return target.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const daysNum = Math.max(1, Number(customDays) || 1);
    const target = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);
    return target.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [licenseType, selectedPlan, customDays]);

  const activeAiCredits = useMemo(() => {
    if (licenseType === "CUSTOM") {
      return Number(customAiCredits) || 0;
    }
    const pkg = PRESET_PACKAGES.find((p) => p.id === selectedPlan);
    return pkg ? pkg.aiCredits : 100;
  }, [licenseType, selectedPlan, customAiCredits]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    execute({
      name,
      ownerPhone,
      ownerName: ownerName || undefined,
      city: city || undefined,
      country: "IN",
      licenseType,
      licensePlan: licenseType === "PACKAGE" ? selectedPlan : undefined,
      customDays: licenseType === "CUSTOM" ? Math.max(1, Number(customDays) || 30) : undefined,
      aiCredits: activeAiCredits,
      licenseNote: licenseNote.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 1. RESTORAN & İŞLETMECİ BİLGİLERİ */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
          <span>🏪</span>
          <span>Restoran & İşletmeci Bilgileri</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="name">Restoran Adı</FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Örn: Lezzet Durağı"
              className="rounded-xl font-bold"
              required
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="ownerPhone">İşletmeci Telefonu</FieldLabel>
            <PhoneInput
              id="ownerPhone"
              onChange={setOwnerPhone}
              invalid={Boolean(error)}
            />
            <FieldDescription>
              Restoran yöneticisi bu telefon ile panele giriş yapacaktır.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="ownerName">İşletmeci Adı (isteğe bağlı)</FieldLabel>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              placeholder="Ad Soyad"
              className="rounded-xl font-medium"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="city">Şehir (isteğe bağlı)</FieldLabel>
            <Input
              id="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="İstanbul"
              className="rounded-xl font-medium"
            />
          </Field>
        </div>
      </div>

      {/* 2. LİSANS SÜRESİ & YAPAY ZEKA KREDİSİ TANIMLAMASI */}
      <div className="rounded-3xl border border-primary/20 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                Lisans Süresi & Yapay Zeka Kredisi
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Yeni restoran için lisans kullanım süresi ve başlangıç AI bakiyesini belirleyin.
              </p>
            </div>
          </div>
        </div>

        {/* Lisans Tipi Seçici (Mevcut Paketler vs Gün Bazlı Özel Süre) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-muted/50 border border-border/60">
          <button
            type="button"
            onClick={() => setLicenseType("PACKAGE")}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer",
              licenseType === "PACKAGE"
                ? "bg-background text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayersIcon className="size-4 text-primary" />
            <span>Mevcut Paketler</span>
          </button>
          <button
            type="button"
            onClick={() => setLicenseType("CUSTOM")}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer",
              licenseType === "CUSTOM"
                ? "bg-background text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDaysIcon className="size-4 text-primary" />
            <span>Gün Bazlı Özel Tanımla</span>
          </button>
        </div>

        {/* DURUM A: MEVCUT PAKETLER SEÇİMİ */}
        {licenseType === "PACKAGE" ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_PACKAGES.map((pkg) => {
                const isSelected = selectedPlan === pkg.id;
                const Icon = pkg.icon;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPlan(pkg.id)}
                    className={cn(
                      "flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20"
                        : "border-border/70 bg-background/50 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-xl bg-gradient-to-br border",
                            pkg.color
                          )}
                        >
                          <Icon className="size-4.5" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-foreground block">
                            {pkg.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {pkg.daysLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">
                          {pkg.badge}
                        </span>
                        <div
                          className={cn(
                            "flex size-4.5 items-center justify-center rounded-full border transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-muted-foreground/30 bg-background"
                          )}
                        >
                          {isSelected && <CheckCircle2Icon className="size-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">Başlangıç AI Kredisi:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <SparklesIcon className="size-3" />
                        +{pkg.aiCredits} Kredi
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* DURUM B: GÜN BAZLI ÖZEL SÜRE & MANUEL AI KREDİSİ GİRİŞİ */
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 flex flex-col gap-4">
            {/* Lisans Gün Sayısı */}
            <Field>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel htmlFor="customDays" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CalendarDaysIcon className="size-4 text-primary" />
                  <span>Lisans Süresi (Kaç Gün Kullanacak?)</span>
                </FieldLabel>
                <span className="text-[11px] font-bold text-primary">
                  Bitiş: {calculatedExpiryDate}
                </span>
              </div>
              <Input
                id="customDays"
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Örn: 45"
                className="rounded-xl font-black text-base bg-background"
                required
              />
              <FieldDescription>
                Restoranın aktif kalacağı gün sayısını belirleyin. (Örn: 45, 60, 90, 180 gün)
              </FieldDescription>

              {/* Hızlı Gün Butonları */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[15, 30, 45, 60, 90, 180, 365].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCustomDays(String(d))}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                      customDays === String(d)
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {d} Gün
                  </button>
                ))}
              </div>
            </Field>

            {/* Manuel Yapay Zeka Kredisi Girişi */}
            <Field className="border-t border-border/60 pt-3">
              <div className="flex items-center justify-between mb-1">
                <FieldLabel htmlFor="customAiCredits" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <SparklesIcon className="size-4 text-amber-500" />
                  <span>Yapay Zeka (AI) Kredisi (Manuel Giriş)</span>
                </FieldLabel>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {customAiCredits || 0} Kredi Tanımlanacak
                </span>
              </div>
              <Input
                id="customAiCredits"
                type="number"
                min="0"
                max="100000"
                value={customAiCredits}
                onChange={(e) => setCustomAiCredits(e.target.value)}
                placeholder="Örn: 250"
                className="rounded-xl font-black text-base bg-background"
                required
              />
              <FieldDescription>
                Özel gün tanımlaması yapılan restoran için başlangıç yapay zeka stüdyosu kredisi bakiyesini manuel belirleyin.
              </FieldDescription>

              {/* Hızlı Kredi Butonları */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[50, 100, 250, 500, 1000, 2500].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCustomAiCredits(String(c))}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                      customAiCredits === String(c)
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    +{c} Kredi
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* İsteğe Bağlı Lisans Notu */}
        <Field>
          <FieldLabel htmlFor="licenseNote">Lisans & Anlaşma Notu (isteğe bağlı)</FieldLabel>
          <Input
            id="licenseNote"
            value={licenseNote}
            onChange={(e) => setLicenseNote(e.target.value)}
            placeholder="Örn: Kampanya kapsamında özel 45 günlük deneme ve tanıtım paketi"
            className="rounded-xl text-xs"
          />
        </Field>

        {/* ÖZET BİLGİLENDİRME ÇUBUĞU */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-foreground">
              {licenseType === "PACKAGE"
                ? `Paket: ${PRESET_PACKAGES.find((p) => p.id === selectedPlan)?.title}`
                : `Özel Süre: ${customDays} Gün`}
            </span>
            <span className="text-muted-foreground">({calculatedExpiryDate})</span>
          </div>

          <div className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400">
            <SparklesIcon className="size-3.5" />
            <span>{activeAiCredits} AI Kredisi Tanımlanacak</span>
          </div>
        </div>
      </div>

      {error ? (
        <FieldDescription className="text-destructive font-semibold">{error}</FieldDescription>
      ) : null}

      <div>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto h-11 px-6 rounded-2xl font-black text-sm cursor-pointer shadow-md">
          {isPending ? "Kaydediliyor ve Lisans Tanımlanıyor…" : "Restoranı Kaydet ve Lisansı Başlat"}
        </Button>
      </div>
    </form>
  );
}
