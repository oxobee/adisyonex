"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  EyeIcon,
  LayoutGridIcon,
  PaletteIcon,
  SmartphoneIcon,
  SparklesIcon,
  StarIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updateQrMenuThemeAction } from "@/actions/settings.actions";
import { PhonePreviewMockup } from "@/components/menu-design/phone-preview-mockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuDTO } from "@/types/menu";

export interface ThemeOption {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly badgeText?: string;
  readonly badgeColor?: string;
  readonly features: readonly string[];
  readonly accentColor: string;
  readonly bgPreview: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    id: "MODERN",
    name: "Tema 01",
    category: "Orijinal Tasarım",
    description: "Kategori sekmeli, modern ürün kartları ve akıcı sepet deneyimi sunan orijinal standart tasarım.",
    badgeText: "Tema 01 · Orijinal",
    badgeColor: "bg-primary/10 text-primary border-primary/25",
    features: [
      "Dinamik yatay kategori kaydırma",
      "Görsel destekli modern kart yerleşimi",
      "Akıllı arama ve anlık sepet çubuğu",
      "Tüm restoran ve kafe tiplerine uygun",
    ],
    accentColor: "bg-primary",
    bgPreview: "from-primary/20 via-background to-card",
  },
  {
    id: "QSR_FASTFOOD",
    name: "Tema 02",
    category: "QSR & Fast Food (Self-Order)",
    description: "Beyaz minimalist zemin, kırmızı kategori kapsülleri, ortalı 2'li ürün kartları ve sarı yüzen sepet butonu.",
    badgeText: "Tema 02 · Yeni Tasarım",
    badgeColor: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    features: [
      "Kırmızı kapsüllü yatay kategori kaydırma",
      "2 sütunlu beyaz ortalı ürün kartları",
      "₺ gri hap fiyat etiketleri",
      "Sarı yuvarlak yüzen sepet butonu",
    ],
    accentColor: "bg-red-600",
    bgPreview: "from-red-500/20 via-background to-amber-500/10",
  },
];

export function MenuDesignManager({
  restaurantId,
  restaurantName,
  restaurantUsername,
  previewTableId,
  previewTableLabel = "Masa 1",
  logoUrl,
  menu,
  currentTheme = "MODERN",
}: {
  readonly restaurantId: string;
  readonly restaurantName: string;
  readonly restaurantUsername: string;
  readonly previewTableId?: string;
  readonly previewTableLabel?: string;
  readonly logoUrl?: string | null;
  readonly menu?: MenuDTO | null;
  readonly currentTheme?: string;
}) {
  const [activeTheme, setActiveTheme] = useState<string>(currentTheme || "MODERN");
  const [previewTheme, setPreviewTheme] = useState<string>(currentTheme || "MODERN");
  const [isSaving, setIsSaving] = useState(false);

  const handleApplyTheme = async (themeId: string) => {
    setIsSaving(true);
    try {
      const res = await updateQrMenuThemeAction(themeId);
      if (res.success) {
        setActiveTheme(themeId);
        toast.success("QR Menü tasarımı başarıyla güncellendi!", {
          description: `Seçilen "${THEME_OPTIONS.find((t) => t.id === themeId)?.name}" tasarımı müşteriler için aktif edildi.`,
        });
      } else {
        toast.error("Tasarım kaydedilemedi: " + (res.error || "Bilinmeyen hata"));
      }
    } catch {
      toast.error("İşlem sırasında bir hata meydana geldi.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedThemeDetails = THEME_OPTIONS.find((t) => t.id === previewTheme) || THEME_OPTIONS[0];

  const liveQrUrl = previewTableId
    ? `/order/${restaurantUsername}?table=${previewTableId}`
    : `/order/${restaurantUsername}`;

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <PaletteIcon className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              QR Menü Tasarım Stüdyosu
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground max-w-2xl">
            Müşterilerinizin masadaki QR kodu okuttuğunda karşılaşacağı menü temasını seçin. Telefon ekranından canlı önizleyip tek tıkla işletmenize uygulayabilirsiniz.
          </p>
        </div>

        {/* Live QR Link Button (Opens Masa 1 Live Session) */}
        {restaurantUsername && (
          <Link
            href={liveQrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          >
            <SmartphoneIcon className="size-4" />
            <span>Canlı QR Menüyü Aç ({previewTableLabel})</span>
            <ExternalLinkIcon className="size-3.5 opacity-80" />
          </Link>
        )}
      </div>

      {/* Main Studio Grid: Left Phone Mockup, Right Expandable Theme Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Smartphone Mockup (xl:col-span-5) */}
        <div className="xl:col-span-5 flex flex-col items-center gap-4 bg-card/60 p-6 rounded-3xl border border-border/70 shadow-sm backdrop-blur-sm sticky top-20">
          <div className="w-full flex items-center justify-between border-b pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-foreground">Canlı Telefon Önizlemesi</span>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono font-bold bg-muted/50">
              {selectedThemeDetails.name}
            </Badge>
          </div>

          {/* Phone Frame */}
          <PhonePreviewMockup
            theme={previewTheme}
            restaurantName={restaurantName}
            restaurantUsername={restaurantUsername}
            previewTableId={previewTableId}
            logoUrl={logoUrl}
            menu={menu}
            tableLabel={previewTableLabel}
          />

          <p className="text-[11px] font-semibold text-muted-foreground text-center">
            📱 Bu önizleme restoranınızın gerçek menü ürünleriyle canlı olarak oluşturulmaktadır.
          </p>
        </div>

        {/* Right Column: Theme Gallery Selector (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <LayoutGridIcon className="size-4 text-primary" />
              <span>Mevcut Tasarım Şablonları ({THEME_OPTIONS.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">
              Aktif Tema: <strong className="text-foreground">{THEME_OPTIONS.find((t) => t.id === activeTheme)?.name}</strong>
            </span>
          </div>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEME_OPTIONS.map((theme) => {
              const isCurrentActive = activeTheme === theme.id;
              const isBeingPreviewed = previewTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  className={cn(
                    "relative flex flex-col justify-between p-5 rounded-3xl border transition-all duration-200 bg-card shadow-xs",
                    isCurrentActive
                      ? "border-2 border-primary ring-2 ring-primary/20 shadow-md bg-gradient-to-br from-primary/5 via-card to-card"
                      : isBeingPreviewed
                        ? "border-primary/60 ring-1 ring-primary/20 bg-muted/20"
                        : "border-border/80 hover:border-foreground/30 hover:shadow-md",
                  )}
                >
                  {/* Top Badges & Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-2xs", theme.badgeColor)}>
                        {theme.badgeText}
                      </span>

                      {isCurrentActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black">
                          <CheckCircle2Icon className="size-3" />
                          <span>AKTİF KULLANILAN</span>
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-1.5">
                        <span>{theme.name}</span>
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                      {theme.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
                          <span className="size-1.5 rounded-full bg-primary/70 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center gap-2">
                    <Button
                      type="button"
                      variant={isBeingPreviewed ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setPreviewTheme(theme.id)}
                      className={cn(
                        "flex-1 rounded-xl text-xs font-bold gap-1.5 cursor-pointer",
                        isBeingPreviewed && "border-primary/40 bg-primary/10 text-primary font-black",
                      )}
                    >
                      <EyeIcon className="size-3.5" />
                      <span>{isBeingPreviewed ? "Önizleniyor" : "Telefonda Önizle"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant={isCurrentActive ? "outline" : "default"}
                      size="sm"
                      disabled={isSaving || isCurrentActive}
                      onClick={() => handleApplyTheme(theme.id)}
                      className={cn(
                        "flex-1 rounded-xl text-xs font-bold gap-1.5 cursor-pointer",
                        isCurrentActive
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 cursor-default opacity-100"
                          : "font-black shadow-xs",
                      )}
                    >
                      {isCurrentActive ? (
                        <>
                          <CheckCircle2Icon className="size-3.5" />
                          <span>Seçili Tema</span>
                        </>
                      ) : (
                        <>
                          <ZapIcon className="size-3.5" />
                          <span>Tasarımı Uygula</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extensibility Info Banner */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center gap-3">
            <SparklesIcon className="size-5 text-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground font-medium">
              Sistem yeni QR menü şablonları eklenmeye hazır modüler yapıda tasarlanmıştır. İlerleyen güncellemelerde eklenecek tüm yeni tasarımlar otomatik olarak bu panelde listelenecektir.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
