"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  FlameIcon,
  Loader2Icon,
  PenToolIcon,
  SparklesIcon,
  TagIcon,
} from "lucide-react";
import { toast } from "sonner";

import { generateItemCopywritingAction } from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import type { AiCopywriterResultDTO, AiCreditWalletDTO } from "@/types/ai";

export function CopywriterView({ wallet }: { wallet: AiCreditWalletDTO }) {
  const [itemName, setItemName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [tone, setTone] = useState<"APPETIZING" | "GOURMET" | "CONCISE" | "HEALTHY" | "CREATIVE">("APPETIZING");

  const [result, setResult] = useState<AiCopywriterResultDTO | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generate = useServerAction(generateItemCopywritingAction, {
    onSuccess: (res) => {
      if (res) {
        setResult(res);
        toast.success(`"${res.name}" için lezzet açıklamaları hazırlandı!`);
      }
    },
    onError: (msg) => toast.error(msg || "Açıklama üretilemedi"),
  });

  const handleGenerate = () => {
    if (!itemName.trim()) {
      toast.error("Lütfen bir ürün adı girin.");
      return;
    }
    if (wallet.balance < 2) {
      toast.error("Yetersiz kredi. Bu işlem için 2 kredi gereklidir.");
      return;
    }

    generate.execute({
      itemName: itemName.trim(),
      categoryName: categoryName.trim() || undefined,
      ingredients: ingredients.trim() || undefined,
      tone,
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Panoya kopyalandı!");
    setTimeout(() => setCopiedField(null), 2000);
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
            title="AI Menü Metin Yazarı & Besin Analizi"
            description="Ürününüzün adını girin; yapay zeka iştah açıcı açıklamalar, kalori ve alerjen analizleri üretsin."
          />
        </div>

        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <SparklesIcon className="size-3.5 text-amber-500" />
          İşlem Maliyeti: <strong>2 Kredi</strong> (Kalan: {wallet.balance})
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="rounded-3xl border border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PenToolIcon className="size-4 text-primary" />
                Ürün Bilgileri
              </CardTitle>
              <CardDescription className="text-xs">
                Açıklama üretmek istediğiniz ürünün temel özelliklerini girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Ürün Adı *</label>
                <Input
                  placeholder="Örn: Trüflü Dana Burger, Antep Fıstıklı Cheesecake"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Kategori (Opsiyonel)</label>
                <Input
                  placeholder="Örn: Burgerler, Tatlılar, Başlangıçlar"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Malzemeler / Şef Notları (Opsiyonel)</label>
                <Textarea
                  placeholder="Örn: 200gr dinlendirilmiş dana köfte, trüf mayonez, karamelize soğan, cheddar, brioche ekmeği"
                  rows={3}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Anlatım Tonu</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "APPETIZING", label: "🍔 İştah Kabartan" },
                    { id: "GOURMET", label: "🍷 Gurme & Seçkin" },
                    { id: "CONCISE", label: "⚡ Kısa & Net" },
                    { id: "HEALTHY", label: "🥗 Sağlıklı & Fit" },
                    { id: "CREATIVE", label: "✨ Hikaye Anlatımı" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id as any)}
                      className={`rounded-xl border p-2 text-xs font-semibold transition-all cursor-pointer ${
                        tone === t.id
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                          : "border-border/70 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="mt-2 h-12 rounded-2xl font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 cursor-pointer"
                disabled={generate.isPending || !itemName.trim()}
                onClick={handleGenerate}
              >
                {generate.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Metin Üretiliyor…
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-4 mr-2" />
                    Açıklama Üret (2 Kredi)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {result ? (
            <div className="flex flex-col gap-4">
              {/* Short Description */}
              <Card className="rounded-3xl border border-primary/40 bg-card shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>✨</span> Menü Kartı Açıklaması (Kısa)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs gap-1.5"
                    onClick={() => copyToClipboard(result.shortDescription, "short")}
                  >
                    {copiedField === "short" ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                    Kopyala
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground font-medium bg-muted/30 p-3.5 rounded-2xl border">
                    {result.shortDescription}
                  </p>
                </CardContent>
              </Card>

              {/* Long Description */}
              {result.longDescription ? (
                <Card className="rounded-3xl border border-border/80 bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>📖</span> Detay & Hikaye Açıklaması (Geniş)
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-xs gap-1.5"
                      onClick={() => copyToClipboard(result.longDescription!, "long")}
                    >
                      {copiedField === "long" ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                      Kopyala
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-3.5 rounded-2xl border">
                      {result.longDescription}
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Badges & Nutrition */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Calories & Allergens */}
                <Card className="rounded-3xl border p-4 bg-card">
                  <span className="text-xs font-bold text-foreground block mb-2">🔥 Besin & Alerjen Önerisi</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {result.suggestedCalories ? (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 gap-1 font-bold">
                        <FlameIcon className="size-3" /> {result.suggestedCalories} kcal
                      </Badge>
                    ) : null}

                    {result.suggestedAllergens?.map((a) => (
                      <Badge key={a} variant="secondary" className="text-xs">
                        ⚠️ {a}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Marketing Tags */}
                <Card className="rounded-3xl border p-4 bg-card">
                  <span className="text-xs font-bold text-foreground block mb-2">🏷️ Pazarlama Etiketleri</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {result.marketingTags?.map((tag) => (
                      <Badge key={tag} className="bg-primary/10 text-primary border-primary/20 font-bold text-[11px]">
                        <TagIcon className="size-2.5 mr-1" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-12 text-center bg-muted/10 h-full min-h-[300px]">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <PenToolIcon className="size-6 opacity-40" />
              </div>
              <p className="font-bold text-sm text-foreground">Henüz Metin Üretilmedi</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Soldaki formdan ürün adınızı girip *"Açıklama Üret"* butonuna basarak iştah açıcı açıklamalar oluşturabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
