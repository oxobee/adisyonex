"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckCircle2Icon,
  CheckIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
  UtensilsIcon,
  Wand2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  generateFoodImageAction,
  saveImageToItemAction,
} from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import type { AiCreditWalletDTO } from "@/types/ai";
import type { QualityLevel } from "@/generated/prisma/client";

interface MenuItemOption {
  id: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
}

export function ImageStudioView({
  wallet,
  menuItems = [],
}: {
  wallet: AiCreditWalletDTO;
  menuItems?: MenuItemOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryItemId = searchParams.get("itemId") || "";
  const queryName = searchParams.get("name") || "";
  const queryDesc = searchParams.get("desc") || "";

  const [selectedItemId, setSelectedItemId] = useState<string>(queryItemId);
  const [itemName, setItemName] = useState<string>(queryName);
  const [itemDescription, setItemDescription] = useState<string>(queryDesc);
  const [style, setStyle] = useState<
    | "STUDIO_FOOD"
    | "WHITE_BACKGROUND"
    | "RUSTIC"
    | "MODERN_MINIMAL"
    | "FAST_FOOD_VIBRANT"
    | "DARK_GOURMET"
  >("STUDIO_FOOD");
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>("STANDARD");

  const [generatedResult, setGeneratedResult] = useState<{
    imageUrl: string;
    prompt: string;
    creditsSpent: number;
  } | null>(null);

  const [isSavingToItem, setIsSavingToItem] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if query params change
  useEffect(() => {
    if (queryName && !itemName) setItemName(queryName);
    if (queryDesc && !itemDescription) setItemDescription(queryDesc);
    if (queryItemId && !selectedItemId) setSelectedItemId(queryItemId);
  }, [queryName, queryDesc, queryItemId, itemName, itemDescription, selectedItemId]);

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = menuItems.find((i) => i.id === itemId);
    if (item) {
      setItemName(item.name);
      setItemDescription(item.shortDescription || item.longDescription || "");
    }
  };

  const generateImage = useServerAction(generateFoodImageAction, {
    onSuccess: (res) => {
      if (res) {
        setGeneratedResult(res);
        setSavedSuccess(false);
        toast.success(`"${itemName}" için 1:1 kare profesyonel yemek görseli oluşturuldu!`);
      }
    },
    onError: (msg) =>
      toast.error(msg || "İşlem başarısız oldu, lütfen yeniden deneyiniz. Kredileriniz geri yüklendi."),
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

  const handleSaveToItem = async () => {
    if (!generatedResult || !selectedItemId) {
      toast.error("Kaydedilecek ürün seçilmedi.");
      return;
    }

    setIsSavingToItem(true);
    try {
      const res = await saveImageToItemAction({
        itemId: selectedItemId,
        imageUrl: generatedResult.imageUrl,
      });

      if (res.success) {
        setSavedSuccess(true);
        toast.success(`Görsel "${itemName}" ürününe başarıyla kaydedildi!`);
        router.refresh();
      } else {
        toast.error(res.error || "Görsel kaydedilemedi.");
      }
    } catch {
      toast.error("Görsel kaydedilirken bir hata oluştu.");
    } finally {
      setIsSavingToItem(false);
    }
  };

  const STYLES = [
    {
      id: "STUDIO_FOOD",
      title: "📸 Profesyonel Stüdyo Çekimi",
      desc: "Yumuşak softbox aydınlatma, makro lezzet odağı, canlı restoran sunumu.",
    },
    {
      id: "WHITE_BACKGROUND",
      title: "⚪ Beyaz Fonda Profesyonel Çekim",
      desc: "Kusursuz beyaz stüdyo fonu, net gölge izolasyonu ve katalog estetiği.",
    },
    {
      id: "RUSTIC",
      title: "🪵 Rustik & Ahşap Sıcaklığı",
      desc: "Doğal güneş ışığı, ahşap masa dokusu, samimi sunum.",
    },
    {
      id: "MODERN_MINIMAL",
      title: "🍽️ Michelin Yıldızı Minimal",
      desc: "Zarif porselen üzerinde modern fine dining sunumu.",
    },
    {
      id: "FAST_FOOD_VIBRANT",
      title: "🔥 Dinamik & İştah Kabartan",
      desc: "Canlı patlayan renkler, dumanı üstünde taze hissiyat.",
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
            render={<Link href="/dashboard/menu" />}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <PageHeader
            title="AI ile Yemek Görseli Oluştur"
            description="Menü ürünleriniz için gerçekçi ve profesyonel 1:1 kare yemek fotoğrafları oluşturun ve tek tıkla ürüne kaydedin."
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2">
          <SparklesIcon className="size-4 text-amber-500" />
          <span className="text-xs font-bold text-foreground">
            Bakiye: <strong>{wallet.balance} Kredi</strong>
          </span>
        </div>
      </div>

      {/* TARGET PRODUCT BANNER IF PRE-SELECTED */}
      {selectedItemId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <UtensilsIcon className="size-4" />
            <span>Hedef Ürün: <strong>{itemName || "Menü Ürünü"}</strong></span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Üretilen görseli aşağıdan doğrudan bu ürüne kaydedebilirsiniz.
          </span>
        </div>
      )}

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
              {/* Optional Menu Item Dropdown Selector */}
              {menuItems.length > 0 && !queryItemId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Menüden Ürün Seç (Opsiyonel)
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleSelectItem(e.target.value)}
                    className="h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Menüden bir ürün seçin --</option>
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">Yemek Adı *</label>
                <Input
                  placeholder="Örn: Smash Burger, San Sebastian Cheesecake, Mercimek Çorbası"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-foreground">
                  İçerik & Malzeme Detayı (Kısa Açıklama)
                </label>
                <Textarea
                  placeholder="Örn: Erimiş cheddar peyniri, karamelize soğan, çıtır patates kızartması ve özel sos eşliğinde"
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
                className="mt-1 h-12 rounded-2xl font-bold bg-primary text-primary-foreground shadow-md shadow-primary/20 cursor-pointer active:scale-[0.98] transition-all"
                disabled={generateImage.isPending || !itemName.trim()}
                onClick={handleGenerate}
              >
                {generateImage.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    1:1 Kare Görsel Üretiliyor…
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
                  Üretilen Yemek Fotoğrafı (1:1 Kare)
                </h3>
                <Badge className="bg-emerald-500 text-white font-bold text-xs">
                  {qualityLevel} Kalite
                </Badge>
              </div>

              {/* Perfect 1:1 Square Frame */}
              <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-3xl border shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedResult.imageUrl}
                  alt={itemName}
                  className="size-full object-cover"
                />
              </div>

              {/* Action Buttons: Save to Item, Download, Back to Menu */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                  {itemName}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold gap-1.5 cursor-pointer"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = generatedResult.imageUrl;
                      link.download = `${itemName}-kare.png`;
                      link.click();
                    }}
                  >
                    <DownloadIcon className="size-4" /> İndir
                  </Button>

                  {selectedItemId ? (
                    <Button
                      size="sm"
                      className={`rounded-xl font-bold gap-1.5 cursor-pointer ${
                        savedSuccess
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-primary text-primary-foreground"
                      }`}
                      disabled={isSavingToItem}
                      onClick={handleSaveToItem}
                    >
                      {isSavingToItem ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />
                          Kaydediliyor…
                        </>
                      ) : savedSuccess ? (
                        <>
                          <CheckCircle2Icon className="size-4" />
                          Ürüne Kaydedildi ✓
                        </>
                      ) : (
                        <>
                          <CheckIcon className="size-4" />
                          Görseli Ürüne Kaydet
                        </>
                      )}
                    </Button>
                  ) : null}

                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl font-bold gap-1.5 text-xs cursor-pointer"
                    render={<Link href="/dashboard/menu" />}
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    Menüye Dön
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
                Soldaki formdan yemek adını ve kısa açıklamasını girip *"Oluştur"* butonuna basarak 1:1 kare yemek fotoğrafları üretebilir ve doğrudan menüdeki ürüne kaydedebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
