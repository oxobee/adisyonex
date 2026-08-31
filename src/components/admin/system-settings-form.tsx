"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  GlobeIcon,
  ImageIcon,
  Loader2Icon,
  SaveIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import { updateSystemSettingsAction } from "@/actions/system-setting.actions";
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
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

export function SystemSettingsForm({
  initialSettings,
}: {
  readonly initialSettings: SystemSettingsDTO;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    systemName: initialSettings.systemName,
    systemTagline: initialSettings.systemTagline ?? "",
    logoUrl: initialSettings.logoUrl ?? "",
    faviconUrl: initialSettings.faviconUrl ?? "",
    ogImageUrl: initialSettings.ogImageUrl ?? "",
    metaTitle: initialSettings.metaTitle ?? "",
    metaDescription: initialSettings.metaDescription ?? "",
    metaKeywords: initialSettings.metaKeywords ?? "",
  });

  const set = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const update = useServerAction(updateSystemSettingsAction, {
    onSuccess: () => {
      toast.success("Sistem genel bilgileri ve SEO meta etiketleri güncellendi!");
      router.refresh();
    },
    onError: (msg) => toast.error(msg || "Ayarlar güncellenemedi."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.systemName.trim()) {
      toast.error("Sistem adı zorunludur.");
      return;
    }
    update.execute(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl">
      {/* Platform Branding & Logo */}
      <Card className="rounded-3xl border-border/80 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-foreground">
                Sistem & Yazılım Marka Kimliği
              </CardTitle>
              <CardDescription className="text-xs">
                Bu ayarlar tüm platformun genel marka ismini, logosunu ve faviconunu belirler. Firma/Restoran bilgileri ile karıştırılmaz; yalnızca Super Admin tarafından değiştirilebilir.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="sys-name">Sistem Adı (Yazılım Markası)</FieldLabel>
              <Input
                id="sys-name"
                value={form.systemName}
                onChange={(e) => set("systemName", e.target.value)}
                placeholder="Örn: Elitale Restro"
                className="rounded-xl font-bold"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sys-tagline">Sistem Sloganı</FieldLabel>
              <Input
                id="sys-tagline"
                value={form.systemTagline}
                onChange={(e) => set("systemTagline", e.target.value)}
                placeholder="Örn: Gelişmiş Restoran & QR Menü Otomasyonu"
                className="rounded-xl"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="sys-logo">Sistem Logo URL (Panel ve Üst Bar)</FieldLabel>
              <Input
                id="sys-logo"
                type="url"
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="rounded-xl"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sys-favicon">Favicon URL (Tarayıcı Sekme İkonu)</FieldLabel>
              <Input
                id="sys-favicon"
                type="url"
                value={form.faviconUrl}
                onChange={(e) => set("faviconUrl", e.target.value)}
                placeholder="https://example.com/favicon.ico"
                className="rounded-xl"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* SEO, OpenGraph & Meta Tags */}
      <Card className="rounded-3xl border-border/80 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GlobeIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-foreground">
                SEO, OpenGraph (OG) & Meta Tag Yönetimi
              </CardTitle>
              <CardDescription className="text-xs">
                Arama motorları (Google) ve sosyal medya paylaşımları (WhatsApp, Twitter, Facebook vb.) için meta başlıkları, açıklamaları ve OG görseli.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="meta-title">Meta Başlık (Title Tag)</FieldLabel>
            <Input
              id="meta-title"
              value={form.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              placeholder="Örn: Elitale Restro | Restoran ve QR Menü Otomasyonu"
              className="rounded-xl font-medium"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="meta-desc">Meta Açıklama (Description)</FieldLabel>
            <Textarea
              id="meta-desc"
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              placeholder="Sitenin arama motorlarında ve sosyal medyada çıkacak kısa açıklaması..."
              rows={3}
              className="rounded-xl resize-none text-xs"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="meta-keywords">Meta Anahtar Kelimeler (Keywords)</FieldLabel>
            <Input
              id="meta-keywords"
              value={form.metaKeywords}
              onChange={(e) => set("metaKeywords", e.target.value)}
              placeholder="Örn: restoran otomasyonu, adisyon sistemi, qr menü, pos kasa"
              className="rounded-xl"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="og-image">OpenGraph (OG) Paylaşım Görseli URL</FieldLabel>
            <Input
              id="og-image"
              type="url"
              value={form.ogImageUrl}
              onChange={(e) => set("ogImageUrl", e.target.value)}
              placeholder="https://example.com/og-banner.jpg (Önerilen: 1200x630px)"
              className="rounded-xl"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Live Google & Social Preview Card */}
      <Card className="rounded-3xl border-border/80 bg-muted/20 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <SearchIcon className="size-4" />
            <span>Google Arama & Sosyal Medya Önizlemesi</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Google Search Snippet */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GlobeIcon className="size-3.5" />
              <span>https://adisyonex.vercel.app</span>
            </div>
            <div className="mt-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {form.metaTitle || form.systemName}
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {form.metaDescription || "Yeni nesil restoran adisyon, sipariş, mutfak ve QR menü yönetim platformu."}
            </p>
          </div>

          {/* Social OG Card Preview */}
          {form.ogImageUrl && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs max-w-sm">
              <div className="relative aspect-[1200/630] w-full bg-muted">
                <Image
                  src={form.ogImageUrl}
                  alt="OG Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <div className="font-bold text-xs text-foreground line-clamp-1">{form.metaTitle || form.systemName}</div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{form.metaDescription}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={update.isPending}
          className="rounded-2xl px-6 py-2.5 font-black bg-primary text-primary-foreground shadow-md cursor-pointer gap-2"
        >
          {update.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Kaydediliyor…</span>
            </>
          ) : (
            <>
              <SaveIcon className="size-4" />
              <span>Sistem Ayarlarını Kaydet</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
