"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  CopyIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
  Wand2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { generateFoodImagePromptAction } from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import type { AiCreditWalletDTO } from "@/types/ai";

export function ImageStudioView({ wallet }: { wallet: AiCreditWalletDTO }) {
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [style, setStyle] = useState<
    "STUDIO_FOOD" | "RUSTIC" | "MODERN_MINIMAL" | "FAST_FOOD_VIBRANT" | "DARK_GOURMET"
  >("STUDIO_FOOD");

  const [generatedPrompt, setGeneratedPrompt] = useState<{
    prompt: string;
    style: string;
    negativePrompt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePrompt = useServerAction(generateFoodImagePromptAction, {
    onSuccess: (res) => {
      if (res) {
        setGeneratedPrompt(res);
        toast.success("Fotoğraf stüdyosu promptu oluşturuldu!");
      }
    },
    onError: (msg) => toast.error(msg || "Prompt oluşturulamadı"),
  });

  const handleGenerate = () => {
    if (!itemName.trim()) {
      toast.error("Lütfen bir yemek / ürün adı girin.");
      return;
    }
    if (wallet.balance < 1) {
      toast.error("Yetersiz kredi. Bu işlem için 1 kredi gereklidir.");
      return;
    }

    generatePrompt.execute({
      itemName: itemName.trim(),
      itemDescription: itemDescription.trim() || undefined,
      style,
    });
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Prompt panoya kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const STYLES = [
    {
      id: "STUDIO_FOOD",
      title: "📸 Profesyonel Stüdyo Çekimi",
      desc: "Yumuşak softbox aydınlatma, makro lezzet odağı, parlak ve canlı reklam kalitesi.",
    },
    {
      id: "RUSTIC",
      title: "🪵 Rustik & Ahşap Sıcaklığı",
      desc: "Doğal güneş ışığı, ahşap masa dokusu, samimi ve otantik sunum.",
    },
    {
      id: "MODERN_MINIMAL",
      title: "🍽️ Michelin Yıldızı Minimal",
      desc: "Siyah kayrak taş üzerinde zarif fine dining tabağı, keskin gölgeler.",
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
            title="Yemek Fotoğrafı & Görsel Stüdyosu"
            description="Ürününüzü seçin; yapay zeka fotoğraf stüdyosu için ultra gerçekçi görsel promptları üretsin."
          />
        </div>

        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <SparklesIcon className="size-3.5 text-amber-500" />
          İşlem Maliyeti: <strong>1 Kredi</strong> (Kalan: {wallet.balance})
        </Badge>
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
                Fotoğrafını oluşturmak istediğiniz lezzetin detaylarını belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Ürün Adı *</label>
                <Input
                  placeholder="Örn: Smash Burger, San Sebastian Cheesecake"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Görsel Detayı / İçerik (Opsiyonel)</label>
                <Textarea
                  placeholder="Örn: Erimiş çedar peyniri akan, çıtır patates kızartması ve özel sos eşliğinde"
                  rows={3}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">Fotoğraf Çekim Stili</label>
                <div className="flex flex-col gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id as any)}
                      className={`flex flex-col text-left rounded-2xl border p-3 transition-all cursor-pointer ${
                        style === s.id
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-border/70 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground">{s.title}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="mt-2 h-12 rounded-2xl font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 cursor-pointer"
                disabled={generatePrompt.isPending || !itemName.trim()}
                onClick={handleGenerate}
              >
                {generatePrompt.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Prompt Üretiliyor…
                  </>
                ) : (
                  <>
                    <Wand2Icon className="size-4 mr-2" />
                    Görsel Promptu Oluştur (1 Kredi)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {generatedPrompt ? (
            <Card className="rounded-3xl border border-primary/40 bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <SparklesIcon className="size-4 text-amber-500" />
                  Hazır Fotoğraf Stüdyosu Promptu
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => copyPrompt(generatedPrompt.prompt)}
                >
                  {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                  Promptu Kopyala
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Pozitif Prompt (FLUX / Midjourney / DALL-E)</span>
                  <div className="rounded-2xl border bg-muted/40 p-4 text-xs font-mono text-foreground leading-relaxed">
                    {generatedPrompt.prompt}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Negatif Prompt (Filtreleme)</span>
                  <div className="rounded-xl border bg-muted/20 p-3 text-[11px] font-mono text-muted-foreground">
                    {generatedPrompt.negativePrompt}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                  <span>💡</span>
                  <span>Bu promptu kopyalayıp Midjourney, Flux.1 veya AI görsel üretim araçlarına yapıştırarak menünüz için göz alıcı yemek fotoğrafları elde edebilirsiniz.</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center bg-muted/10 h-full min-h-[300px]">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <ImageIcon className="size-6 opacity-40" />
              </div>
              <p className="font-bold text-sm text-foreground">Henüz Prompt Üretilmedi</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Soldaki formdan ürün adını ve fotoğraf stilini seçerek profesyonel yemek görseli promptu üretebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
