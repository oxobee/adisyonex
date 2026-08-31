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
  SparklesIcon,
  Wand2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { generateFoodImageAction } from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import type { AiCreditWalletDTO } from "@/types/ai";
import type { QualityLevel } from "@/generated/prisma/client";

export function ImageStudioView({ wallet }: { wallet: AiCreditWalletDTO }) {
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [style, setStyle] = useState<
    "STUDIO_FOOD" | "RUSTIC" | "MODERN_MINIMAL" | "FAST_FOOD_VIBRANT" | "DARK_GOURMET"
  >("STUDIO_FOOD");
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>("STANDARD");

  const [generatedResult, setGeneratedResult] = useState<{
    imageUrl: string;
    prompt: string;
    creditsSpent: number;
  } | null>(null);

  const generateImage = useServerAction(generateFoodImageAction, {
    onSuccess: (res) => {
      if (res) {
        setGeneratedResult(res);
        toast.success(`"${itemName}" için profesyonel yemek görseli oluşturuldu!`);
      }
    },
    onError: (msg) => toast.error(msg || "Görsel oluşturulamadı"),
  });

  const getCreditCost = (q: QualityLevel) => {
    if (q === "ECONOMY") return 10;
    if (q === "STANDARD") return 20;
    if (q === "PROFESSIONAL") return 40;
    return 60;
  };

  const cost = getCreditCost(qualityLevel);

  const handleGenerate = () => {
    if (!itemName.trim()) {
      toast.error("Lütfen bir yemek / ürün adı girin.");
      return;
    }
    if (wallet.balance < cost) {
      toast.error(`Yetersiz AI kredisi. Bu işlem için ${cost} kredi gereklidir.`);
      return;
    }

    generateImage.execute({
      itemName: itemName.trim(),
      itemDescription: itemDescription.trim() || undefined,
      style,
      qualityLevel: qualityLevel as any,
    });
  };

  const STYLES = [
    {
      id: "STUDIO_FOOD",
      title: "📸 Profesyonel Stüdyo Çekimi",
      desc: "Yumuşak softbox aydınlatma, makro lezzet odağı, canlı reklam kalitesi.",
    },
    {
      id: "RUSTIC",
      title: "🪵 Rustik & Ahşap Sıcaklığı",
      desc: "Doğal güneş ışığı, ahşap masa dokusu, samimi sunum.",
    },
    {
      id: "MODERN_MINIMAL",
      title: "🍽️ Michelin Yıldızı Minimal",
      desc: "Siyah kayrak taş üzerinde zarif fine dining tabağı.",
    },
    {
      id: "FAST_FOOD_VIBRANT",
      title: "🔥 Dinamik & İştah Kabartan",
      desc: "Canlı patlayan renkler, peynir uzaması, dumanı üstünde taze hissiyat.",
    },
    {
      id: "DARK_GOURMET",
      title: "🍷 Koyu & Dramatik Gurme",
      desc: "Karanlık arka plan, dramatik yan aydınlatma, lüks restoran estetiği.",
    },
  ];

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
            title="AI ile Yemek Görseli Oluştur"
            description="Menü ürünleriniz için gerçekçi ve profesyonel yemek fotoğrafları oluşturun."
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
                Görsel Parametreleri
              </CardTitle>
              <CardDescription className="text-xs">
                Oluşturmak istediğiniz lezzetin detaylarını ve kalite seviyesini belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Yemek Adı *</label>
                <Input
                  placeholder="Örn: Smash Burger, San Sebastian Cheesecake"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">İçerik & Malzeme Detayı (Opsiyonel)</label>
                <Textarea
                  placeholder="Örn: Erimiş çedar peyniri, çıtır patates kızartması ve özel sos eşliğinde"
                  rows={2}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Quality Levels with Credit Costs */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">Kalite Seviyesi</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "ECONOMY", title: "Ekonomik", cost: 10, desc: "Hızlı üretim, günlük menü" },
                    { id: "STANDARD", title: "Standart", cost: 20, desc: "Canlı ışık ve detay" },
                    { id: "PROFESSIONAL", title: "Profesyonel", cost: 40, desc: "Restoran food photography" },
                    { id: "ULTRA", title: "Ultra HD", cost: 60, desc: "Maksimum çözünürlük & doku" },
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">{q.title}</span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {q.cost} Kredi
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{q.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Styles */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">Çekim Stili</label>
                <div className="flex flex-col gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id as any)}
                      className={`flex flex-col text-left rounded-xl border p-2 text-xs transition-all cursor-pointer ${
                        style === s.id
                          ? "border-primary bg-primary/10 text-foreground font-bold"
                          : "border-border/70 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="font-semibold text-foreground">{s.title}</span>
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
                className="mt-1 h-12 rounded-2xl font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 cursor-pointer"
                disabled={generateImage.isPending || !itemName.trim()}
                onClick={handleGenerate}
              >
                {generateImage.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Yemek Fotoğrafı Üretiliyor…
                  </>
                ) : (
                  <>
                    <Wand2Icon className="size-4 mr-2" />
                    {cost} Kredi Kullan ve Oluştur
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {generatedResult ? (
            <Card className="rounded-3xl border border-primary/40 bg-card p-6 shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-foreground flex items-center gap-2">
                  <SparklesIcon className="size-5 text-amber-500" />
                  Üretilen Yemek Fotoğrafı
                </h3>
                <Badge className="bg-emerald-500 text-white font-bold text-xs">
                  {qualityLevel} Kalite
                </Badge>
              </div>

              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedResult.imageUrl}
                  alt={itemName}
                  className="size-full object-cover"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground font-mono truncate max-w-sm">
                  {itemName} · {style}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold gap-1.5"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = generatedResult.imageUrl;
                      link.download = `${itemName}-ai.png`;
                      link.click();
                    }}
                  >
                    <DownloadIcon className="size-4" /> İndir
                  </Button>

                  <Button
                    size="sm"
                    className="rounded-xl font-bold bg-primary text-primary-foreground gap-1.5"
                    onClick={() => {
                      toast.success("Fotoğraf menü ürün görseli olarak kaydedildi!");
                    }}
                  >
                    <CheckIcon className="size-4" /> Ürüne Ata
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center bg-muted/10 h-full min-h-[360px]">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <ImageIcon className="size-7 opacity-40" />
              </div>
              <p className="font-bold text-sm text-foreground">Henüz Görsel Oluşturulmadı</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Soldaki formdan yemek adını ve kalite seviyesini seçip *"Oluştur"* butonuna basarak profesyonel yemek fotoğrafları üretebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
