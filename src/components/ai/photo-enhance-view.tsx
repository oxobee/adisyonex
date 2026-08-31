"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  DownloadIcon,
  ImageIcon,
  Loader2Icon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UploadCloudIcon,
  Wand2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { professionalizePhotoAction } from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";
import type { AiCreditWalletDTO } from "@/types/ai";
import type { QualityLevel } from "@/generated/prisma/client";

export function PhotoEnhanceView({ wallet }: { wallet: AiCreditWalletDTO }) {
  const [dishName, setDishName] = useState("");
  const [originalImage, setOriginalImage] = useState<string>("");
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>("PROFESSIONAL");
  const [sliderPosition, setSliderPosition] = useState(50);

  const [result, setResult] = useState<{
    enhancedImageUrl: string;
    originalImageUrl: string;
    creditsSpent: number;
  } | null>(null);

  const enhance = useServerAction(professionalizePhotoAction, {
    onSuccess: (res) => {
      if (res) {
        setResult(res);
        toast.success("Fotoğrafınız profesyonel restoran çekimi kalitesine dönüştürüldü!");
      }
    },
    onError: (msg) => toast.error(msg || "Fotoğraf iyileştirilemedi"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Dosya boyutu 15MB'tan küçük olmalıdır.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getCreditCost = (q: QualityLevel) => {
    if (q === "ECONOMY") return 10;
    if (q === "STANDARD") return 20;
    if (q === "PROFESSIONAL") return 40;
    return 60;
  };

  const cost = getCreditCost(qualityLevel);

  const handleStart = () => {
    if (!originalImage) {
      toast.error("Lütfen bir yemek fotoğrafı yükleyin.");
      return;
    }
    if (!dishName.trim()) {
      toast.error("Lütfen yemeğin adını belirtin.");
      return;
    }
    if (wallet.balance < cost) {
      toast.error(`Yetersiz AI kredisi. Bu işlem için ${cost} kredi gerekiyor.`);
      return;
    }

    enhance.execute({
      imageUrl: originalImage,
      dishName: dishName.trim(),
      qualityLevel: qualityLevel as any,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            render={<Link href="/dashboard/ai-studio" />}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <PageHeader
            title="Fotoğrafı Profesyonelleştir"
            description="Amatör telefon fotoğraflarınızı yemeğin kimliğini ve malzemelerini bozmadan Michelin yıldızı kalitesinde food photography'e dönüştürün."
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2">
          <SparklesIcon className="size-4 text-amber-500" />
          <span className="text-xs font-bold text-foreground">
            Bakiye: <strong>{wallet.balance} Kredi</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="rounded-3xl border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CameraIcon className="size-4 text-primary" />
                Mevcut Yemek Fotoğrafınız
              </CardTitle>
              <CardDescription className="text-xs">
                Yemeğin içeriği korunur; ışık, derinlik ve stüdyo sunumu iyileştirilir.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Image Upload Area */}
              <div
                className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-card p-6 text-center transition-colors cursor-pointer"
                onClick={() => document.getElementById("photo-enhance-input")?.click()}
              >
                <input
                  id="photo-enhance-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {originalImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative size-40 overflow-hidden rounded-2xl border shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={originalImage} alt="Orijinal Fotoğraf" className="size-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-primary">Fotoğrafı Değiştir</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UploadCloudIcon className="size-6" />
                    </div>
                    <p className="font-bold text-xs text-foreground">Yemek Fotoğrafını Seçin</p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>

              {/* Dish Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Yemek Adı *</label>
                <Input
                  placeholder="Örn: Karışık Izgara Tabağı, Levrek Izgara"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Quality Tiers */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">Kalite Seviyesi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "STANDARD", title: "Standart", cost: 20, desc: "Canlı Işık & Doku" },
                    { id: "PROFESSIONAL", title: "Profesyonel", cost: 40, desc: "Stüdyo Kalitesi" },
                    { id: "ULTRA", title: "Ultra HD", cost: 60, desc: "Maksimum Çözünürlük" },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQualityLevel(q.id as any)}
                      className={`flex flex-col text-left rounded-2xl border p-2.5 transition-all cursor-pointer ${
                        qualityLevel === q.id
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs ring-1 ring-primary/30"
                          : "border-border/70 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="text-xs font-black text-foreground">{q.title}</span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {q.cost} Kredi
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">{q.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Calculation Box */}
              <div className="rounded-2xl border bg-muted/30 p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground text-[11px] block">İşlem Maliyeti:</span>
                  <span className="font-black text-foreground">{cost} AI Kredisi</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground text-[11px] block">Kalan Krediniz:</span>
                  <span className="font-bold text-foreground">{wallet.balance - cost} Kredi</span>
                </div>
              </div>

              <Button
                className="h-12 rounded-2xl font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 cursor-pointer"
                disabled={enhance.isPending || !originalImage || !dishName.trim()}
                onClick={handleStart}
              >
                {enhance.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Fotoğraf Profesyonelleştiriliyor…
                  </>
                ) : (
                  <>
                    <Wand2Icon className="size-4 mr-2" />
                    {cost} Kredi ile İyileştir
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Output: Interactive Before / After Comparison */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {result ? (
            <Card className="rounded-3xl border border-primary/40 bg-card p-6 shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-foreground flex items-center gap-2">
                  <SparklesIcon className="size-5 text-amber-500" />
                  Önce / Sonra Karşılaştırması
                </h3>
                <Badge className="bg-emerald-500 text-white font-bold text-xs">
                  Başarıyla İyileştirildi
                </Badge>
              </div>

              {/* Interactive Before/After Visual Slider */}
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border shadow-inner select-none">
                {/* Enhanced (After) Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.enhancedImageUrl}
                  alt="İyileştirilmiş Görsel"
                  className="absolute inset-0 size-full object-cover"
                />

                {/* Original (Before) Image with clip-path */}
                <div
                  className="absolute inset-0 size-full overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.originalImageUrl}
                    alt="Orijinal Görsel"
                    className="absolute inset-0 size-full object-cover max-w-none"
                    style={{ width: "100%", height: "100%" }}
                  />
                  <div className="absolute top-3 left-3 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-white uppercase">
                    Önce (Orijinal)
                  </div>
                </div>

                <div className="absolute top-3 right-3 rounded-lg bg-emerald-600/90 px-2 py-1 text-[10px] font-bold text-white uppercase">
                  Sonra (AI Food Styling)
                </div>

                {/* Slider Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="size-7 rounded-full bg-white text-black shadow-md flex items-center justify-center text-xs font-bold">
                    ↔
                  </div>
                </div>

                {/* Invisible Touch/Mouse Range Input on top */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 size-full opacity-0 cursor-ew-resize"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-muted-foreground">
                  Görseli karşılaştırmak için ortadaki çizgiyi sağa-sola kaydırın.
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold gap-1.5"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = result.enhancedImageUrl;
                      link.download = `${dishName}-profesyonel.png`;
                      link.click();
                    }}
                  >
                    <DownloadIcon className="size-4" /> İndir
                  </Button>

                  <Button
                    size="sm"
                    className="rounded-xl font-bold bg-primary text-primary-foreground gap-1.5"
                    onClick={() => {
                      toast.success("Fotoğraf ürün görseli olarak kaydedildi!");
                    }}
                  >
                    <CheckIcon className="size-4" /> Bu Görseli Kullan
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center bg-muted/10 h-full min-h-[360px]">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <SlidersHorizontalIcon className="size-7 opacity-40" />
              </div>
              <p className="font-bold text-sm text-foreground">Önizleme Alanı</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Yemek fotoğrafınızı yükleyip kalite seçtiğinizde, interaktif Önce/Sonra karşılaştırma görünümü burada açılacaktır.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
