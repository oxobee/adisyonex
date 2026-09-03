"use client";

import { useRef, useState } from "react";
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
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  updateSystemSettingsAction,
  uploadSystemAssetAction,
} from "@/actions/system-setting.actions";
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
import { cn } from "@/lib/utils";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

function DropzoneUploader({
  label,
  recommendation,
  currentUrl,
  kind,
  aspect = "square",
  previewBg = "default",
  onUploaded,
  onClear,
}: {
  label: string;
  recommendation: string;
  currentUrl?: string | null;
  kind: "logo" | "logoDark" | "favicon" | "ogImage";
  aspect?: "square" | "wide" | "favicon";
  previewBg?: "light" | "dark" | "default";
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadSystemAssetAction(formData, kind);
      if (res.success && res.data?.url) {
        onUploaded(res.data.url);
        toast.success(`${label} başarıyla yüklendi!`);
      } else {
        toast.error(res.error || "Yükleme başarısız oldu");
      }
    } catch (e) {
      toast.error("Dosya yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-bold text-foreground">{label}</label>
        <span className="text-[11px] text-muted-foreground font-medium">{recommendation}</span>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !currentUrl && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
          !currentUrl && "cursor-pointer",
          aspect === "wide" ? "min-h-[140px]" : "min-h-[120px]",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.ico"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleUpload(e.target.files[0]);
            }
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-primary">
            <Loader2Icon className="size-7 animate-spin" />
            <span className="text-xs font-bold">Yükleniyor…</span>
          </div>
        ) : currentUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border border-border p-2 shadow-xs shrink-0 flex items-center justify-center",
                previewBg === "dark"
                  ? "bg-zinc-950 border-zinc-800"
                  : previewBg === "light"
                    ? "bg-white border-zinc-200"
                    : "bg-white dark:bg-zinc-950",
                aspect === "wide" ? "w-44 h-24" : aspect === "favicon" ? "size-16" : "size-24",
              )}
            >
              <Image
                src={currentUrl}
                alt={label}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <span className="text-xs font-bold text-foreground truncate">{label} Aktif</span>
              <span className="text-[11px] text-muted-foreground truncate max-w-xs">{currentUrl}</span>
              <div className="flex items-center gap-2 mt-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="rounded-xl text-xs h-7 cursor-pointer"
                >
                  <UploadCloudIcon className="size-3 mr-1" />
                  Değiştir
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="rounded-xl text-xs h-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2Icon className="size-3 mr-1" />
                  Kaldır
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <UploadCloudIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Görseli buraya sürükleyip bırakın
              </span>
              <span className="text-[11px] text-muted-foreground">
                veya bilgisayarınızdan seçmek için tıklayın
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
    logoDarkUrl: initialSettings.logoDarkUrl ?? "",
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
      toast.success("Sistem genel bilgileri ve SEO ayarları başarıyla kaydedildi!");
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
      {/* Platform Branding & Visual Identity */}
      <Card className="rounded-3xl border-border/80 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-foreground">
                Yazılım Markası & Görsel Kimlik
              </CardTitle>
              <CardDescription className="text-xs">
                Bu ayarlar tüm platformun genel marka adını, ana logosunu ve tarayıcı sekme ikonunu (favicon) belirler. Yalnızca Super Admin tarafından yönetilir.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
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

          <div className="grid gap-5 md:grid-cols-3 pt-2">
            {/* Light Mode Logo Drag & Drop */}
            <DropzoneUploader
              label="Açık Tema Logosu (Light Mode / Siyah Logo)"
              recommendation="Açık zeminlerde kullanılacak siyah/koyu yatay logo (PNG/SVG)"
              currentUrl={form.logoUrl}
              kind="logo"
              aspect="wide"
              previewBg="light"
              onUploaded={(url) => set("logoUrl", url)}
              onClear={() => set("logoUrl", "")}
            />

            {/* Dark Mode Logo Drag & Drop */}
            <DropzoneUploader
              label="Koyu Tema Logosu (Dark Mode / Beyaz Logo)"
              recommendation="Koyu zeminlerde kullanılacak beyaz/açık yatay logo (PNG/SVG)"
              currentUrl={form.logoDarkUrl}
              kind="logoDark"
              aspect="wide"
              previewBg="dark"
              onUploaded={(url) => set("logoDarkUrl", url)}
              onClear={() => set("logoDarkUrl", "")}
            />

            {/* Favicon / Icon Drag & Drop */}
            <DropzoneUploader
              label="Sistem İkonu (Favicon / Kare İkon)"
              recommendation="Tarayıcı sekmesi ve mobil kısayollar için kare ikon (ICO/PNG)"
              currentUrl={form.faviconUrl}
              kind="favicon"
              aspect="favicon"
              onUploaded={(url) => set("faviconUrl", url)}
              onClear={() => set("faviconUrl", "")}
            />
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
                Arama motorları (Google) ve sosyal medya paylaşımları (WhatsApp, Telegram, Twitter vb.) için meta başlıkları, açıklamaları ve OG görseli.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
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

          {/* OG Image Drag & Drop */}
          <div className="pt-2">
            <DropzoneUploader
              label="OpenGraph (OG) Paylaşım Görseli"
              recommendation="Önerilen: 1200x630px (JPG/PNG, Max 2MB)"
              currentUrl={form.ogImageUrl}
              kind="ogImage"
              aspect="wide"
              onUploaded={(url) => set("ogImageUrl", url)}
              onClear={() => set("ogImageUrl", "")}
            />
          </div>
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
              {form.faviconUrl ? (
                <div className="relative size-4 rounded-full overflow-hidden shrink-0">
                  <Image src={form.faviconUrl} alt="Favicon" fill className="object-contain" unoptimized />
                </div>
              ) : (
                <GlobeIcon className="size-3.5" />
              )}
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
                  unoptimized
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
