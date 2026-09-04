"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { updateRestaurantProfileAction } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useServerAction } from "@/hooks/use-server-action";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/business-hours";
import { CUISINE_OPTIONS, FORMAT_OPTIONS } from "@/lib/restaurant-format";
import { cn } from "@/lib/utils";
import type {
  BusinessHoursDTO,
  RestaurantFormat,
  RestaurantProfileDTO,
  ServiceOptions,
} from "@/types/settings";

import { BusinessHoursField } from "./business-hours-field";
import { ServiceOptionsField } from "./service-options-field";

const trimmed = (value: string) => value.trim() || undefined;

export function RestaurantProfileForm({
  profile,
}: {
  readonly profile: RestaurantProfileDTO;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: profile.name,
    legalName: profile.legalName ?? "",
    tagline: profile.tagline ?? "",
    brandColor: profile.brandColor ?? "",
    branchName: profile.branchName ?? "",
    branchAddress: profile.branchAddress ?? "",
    addressLine1: profile.addressLine1 ?? "",
    addressLine2: profile.addressLine2 ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    postalCode: profile.postalCode ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    website: profile.website ?? "",
    instagramUrl: profile.instagramUrl ?? "",
    facebookUrl: profile.facebookUrl ?? "",
    googleUrl: profile.googleUrl ?? "",
    seatingCapacity:
      profile.seatingCapacity != null ? String(profile.seatingCapacity) : "",
    fssaiLicense: profile.fssaiLicense ?? "",
    fssaiExpiry: profile.fssaiExpiry ? profile.fssaiExpiry.slice(0, 10) : "",
    panNumber: profile.panNumber ?? "",
  });
  const [restaurantFormat, setRestaurantFormat] = useState<RestaurantFormat | "">(
    profile.restaurantFormat ?? "",
  );
  const [cuisines, setCuisines] = useState<string[]>([...profile.cuisines]);
  const [services, setServices] = useState<ServiceOptions>({
    dineIn: profile.serviceDineIn,
    takeaway: profile.serviceTakeaway,
    delivery: profile.serviceDelivery,
    defaultType: profile.defaultOrderType,
  });
  const [hours, setHours] = useState<BusinessHoursDTO[]>(
    profile.businessHours ? [...profile.businessHours] : DEFAULT_BUSINESS_HOURS,
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCuisine = (cuisine: string) =>
    setCuisines((current) =>
      current.includes(cuisine)
        ? current.filter((c) => c !== cuisine)
        : [...current, cuisine],
    );

  const save = useServerAction(updateRestaurantProfileAction, {
    onSuccess: () => {
      toast.success("Profil kaydedildi");
      router.refresh();
    },
    onError: (message) => toast.error(message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    save.execute({
      name: form.name.trim(),
      legalName: trimmed(form.legalName),
      tagline: trimmed(form.tagline),
      brandColor: trimmed(form.brandColor),
      branchName: trimmed(form.branchName),
      branchAddress: trimmed(form.branchAddress),
      addressLine1: trimmed(form.addressLine1),
      addressLine2: trimmed(form.addressLine2),
      city: trimmed(form.city),
      state: trimmed(form.state),
      postalCode: trimmed(form.postalCode),
      phone: trimmed(form.phone),
      email: trimmed(form.email),
      website: trimmed(form.website),
      instagramUrl: trimmed(form.instagramUrl),
      facebookUrl: trimmed(form.facebookUrl),
      googleUrl: trimmed(form.googleUrl),
      restaurantFormat: restaurantFormat || undefined,
      cuisines,
      seatingCapacity: form.seatingCapacity
        ? Number(form.seatingCapacity)
        : undefined,
      fssaiLicense: trimmed(form.fssaiLicense),
      fssaiExpiry: form.fssaiExpiry || undefined,
      panNumber: trimmed(form.panNumber),
      serviceDineIn: services.dineIn,
      serviceTakeaway: services.takeaway,
      serviceDelivery: services.delivery,
      defaultOrderType: services.defaultType,
      businessHours: hours,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>İşletme Kimliği</CardTitle>
          <CardDescription>
            Marka adı POS ekranında ve fiş başlığında görünür; resmi unvan ise faturalarda yer alır.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="p-name">Marka Adı</FieldLabel>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Örn: Lezzet Restoran"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-legal">Resmi Ticari Unvan</FieldLabel>
              <Input
                id="p-legal"
                value={form.legalName}
                onChange={(e) => set("legalName", e.target.value)}
                placeholder="Örn: Lezzet Gıda San. ve Tic. Ltd. Şti."
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="p-tagline">Slogan / Tanıtım Metni</FieldLabel>
            <Input
              id="p-tagline"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="Örn: 1998'den beri değişmeyen lezzet"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="p-color">Marka / Tema Rengi</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brandColor || "#C2410C"}
                onChange={(e) => set("brandColor", e.target.value)}
                className="size-9 shrink-0 rounded-md border"
                aria-label="Marka rengi"
              />
              <Input
                value={form.brandColor}
                onChange={(e) => set("brandColor", e.target.value)}
                placeholder="#C2410C"
                className="w-32"
              />
            </div>
          </Field>
        </CardContent>
      </Card>

      {/* Location & contact */}
      <Card>
        <CardHeader>
          <CardTitle>Konum &amp; İletişim Bilgileri</CardTitle>
          <CardDescription>Müşteri fişlerinde ve resmi evraklarda basılır.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 rounded-2xl bg-muted/30 p-3.5 border border-border/60">
            <Field>
              <FieldLabel htmlFor="p-branch-name" className="font-bold">Şube Adı</FieldLabel>
              <Input
                id="p-branch-name"
                value={form.branchName}
                onChange={(e) => set("branchName", e.target.value)}
                placeholder="Örn: Kadıköy Moda Şubesi"
                className="bg-background"
              />
              <span className="text-[11px] text-muted-foreground mt-1">Ana ekran başlığında ve şube rozetinde gösterilir.</span>
            </Field>

            <Field>
              <FieldLabel htmlFor="p-branch-addr" className="font-bold">Şube Adresi (Hava Durumu ve Konum)</FieldLabel>
              <Input
                id="p-branch-addr"
                value={form.branchAddress}
                onChange={(e) => set("branchAddress", e.target.value)}
                placeholder="Örn: Caferağa Mah. Moda Cad. Kadıköy, İstanbul"
                className="bg-background"
              />
              <span className="text-[11px] text-muted-foreground mt-1">Ana ekrandaki canlı hava durumunu doğrudan bu adrese göre çeker.</span>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="p-addr1">Adres Satırı 1</FieldLabel>
            <Input
              id="p-addr1"
              value={form.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="p-addr2">Adres Satırı 2</FieldLabel>
            <Input
              id="p-addr2"
              value={form.addressLine2}
              onChange={(e) => set("addressLine2", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="p-city">İlçe</FieldLabel>
              <Input
                id="p-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-state">İl / Şehir</FieldLabel>
              <Input
                id="p-state"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-pin">Posta Kodu</FieldLabel>
              <Input
                id="p-pin"
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="p-phone">Telefon Numarası</FieldLabel>
              <Input
                id="p-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                inputMode="tel"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-email">E-posta</FieldLabel>
              <Input
                id="p-email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                inputMode="email"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="p-web">Web Sitesi</FieldLabel>
              <Input
                id="p-web"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-ig">Instagram</FieldLabel>
              <Input
                id="p-ig"
                value={form.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder="@kullaniciadi veya link"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-fb">Facebook</FieldLabel>
              <Input
                id="p-fb"
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-goog">Google Haritalar Bağlantısı</FieldLabel>
              <Input
                id="p-goog"
                value={form.googleUrl}
                onChange={(e) => set("googleUrl", e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Yasal Bilgiler &amp; Ruhsat</CardTitle>
          <CardDescription>
            İşletme ruhsat numarası ve vergi kimlik numarası.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="p-fssai">İşletme Ruhsat / Kayıt No</FieldLabel>
              <Input
                id="p-fssai"
                value={form.fssaiLicense}
                onChange={(e) => set("fssaiLicense", e.target.value)}
                placeholder="Ruhsat numarası"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-fssai-exp">Ruhsat Geçerlilik Tarihi</FieldLabel>
              <Input
                id="p-fssai-exp"
                type="date"
                value={form.fssaiExpiry}
                onChange={(e) => set("fssaiExpiry", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-pan">Vergi / TC Kimlik No</FieldLabel>
              <Input
                id="p-pan"
                value={form.panNumber}
                onChange={(e) => set("panNumber", e.target.value)}
                placeholder="Vergi No"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Service & hours */}
      <Card>
        <CardHeader>
          <CardTitle>Hizmet Türleri &amp; Çalışma Saatleri</CardTitle>
          <CardDescription>Sunduğunuz servis türleri ve açık olduğunuz saatler.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Sipariş Hizmetleri</p>
            <ServiceOptionsField value={services} onChange={setServices} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Çalışma Saatleri</p>
            <BusinessHoursField value={hours} onChange={setHours} />
          </div>
        </CardContent>
      </Card>

      {/* Optional details */}
      <Card>
        <CardHeader>
          <CardTitle>Ek Detaylar &amp; Mutfak</CardTitle>
          <CardDescription>İsteğe bağlı — restoranınızı tanımlamaya yardımcı olur.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="p-format">İşletme Formatı</FieldLabel>
              <Select
                value={restaurantFormat || undefined}
                onValueChange={(v) => setRestaurantFormat((v ?? "") as RestaurantFormat | "")}
              >
                <SelectTrigger id="p-format">
                  <span>
                    {FORMAT_OPTIONS.find((o) => o.value === restaurantFormat)
                      ?.label ?? "Seçiniz…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="p-seats">Masa / Sandalye Kapasitesi</FieldLabel>
              <Input
                id="p-seats"
                inputMode="numeric"
                value={form.seatingCapacity}
                onChange={(e) => set("seatingCapacity", e.target.value)}
                placeholder="40"
              />
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Mutfak Çeşitleri</span>
            <div className="flex flex-wrap gap-1.5">
              {CUISINE_OPTIONS.map((cuisine) => {
                const active = cuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:border-primary",
                    )}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-background/80 sticky bottom-0 flex justify-end gap-2 border-t py-3 backdrop-blur">
        <Button type="submit" disabled={save.isPending || !form.name.trim()}>
          {save.isPending ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </form>
  );
}
