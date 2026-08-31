"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  FlameIcon,
  GlobeIcon,
  ImageIcon,
  Link2Icon,
  Loader2Icon,
  PlusIcon,
  RotateCcwIcon,
  ScanLineIcon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  commitAiMenuAction,
  digitizeMenuAction,
  digitizeMenuFromUrlAction,
} from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import type {
  AiCreditWalletDTO,
  AiDigitizedItemDTO,
  AiDigitizedMenuDTO,
} from "@/types/ai";

const STAGES = [
  { label: "Menü içeriği okunuyor...", percent: 18 },
  { label: "Kategoriler keşfediliyor...", percent: 38 },
  { label: "Ürünler ve porsiyonlar çıkarılıyor...", percent: 62 },
  { label: "Fiyatlar ve açıklamalar analiz ediliyor...", percent: 84 },
  { label: "Menü yapısı doğrulanıyor...", percent: 94 },
  { label: "Tamamlandı!", percent: 100 },
];

export function MenuImportView({ wallet }: { wallet: AiCreditWalletDTO }) {
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "url" | "text">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [rawText, setRawText] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Loading animation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  // Staging state
  const [digitizedMenu, setDigitizedMenu] = useState<AiDigitizedMenuDTO | null>(null);
  const [items, setItems] = useState<AiDigitizedItemDTO[]>([]);

  // Simulation timer for realistic progressive stages while AI runs
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnalyzing && progress < 92) {
      timer = setTimeout(() => {
        setProgress((prev) => {
          const next = prev + Math.floor(Math.random() * 6) + 3;
          if (next >= 92) return 92;
          // Determine stage index
          if (next < 25) setStageIndex(0);
          else if (next < 45) setStageIndex(1);
          else if (next < 68) setStageIndex(2);
          else if (next < 85) setStageIndex(3);
          else setStageIndex(4);
          return next;
        });
      }, 400);
    }
    return () => clearTimeout(timer);
  }, [isAnalyzing, progress]);

  // 1. Digitize Image Action
  const digitize = useServerAction(digitizeMenuAction, {
    onSuccess: (res) => {
      setProgress(100);
      setStageIndex(5);
      setTimeout(() => {
        setIsAnalyzing(false);
        if (res?.menu) {
          setDigitizedMenu(res.menu);
          const flattened: AiDigitizedItemDTO[] = [];
          for (const cat of res.menu.categories) {
            for (const it of cat.items) {
              flattened.push({
                ...it,
                categoryName: it.categoryName || cat.name,
                selected: true,
              });
            }
          }
          setItems(flattened);
          toast.success(`Tebrikler! ${flattened.length} adet ürün başarıyla çıkartıldı.`);
        }
      }, 600);
    },
    onError: (msg) => {
      setIsAnalyzing(false);
      setProgress(0);
      toast.error(msg || "Menü dijitalleştirilemedi");
    },
  });

  // 2. Digitize URL Action
  const digitizeUrl = useServerAction(digitizeMenuFromUrlAction, {
    onSuccess: (res) => {
      setProgress(100);
      setStageIndex(5);
      setTimeout(() => {
        setIsAnalyzing(false);
        if (res?.menu) {
          setDigitizedMenu(res.menu);
          const flattened: AiDigitizedItemDTO[] = [];
          for (const cat of res.menu.categories) {
            for (const it of cat.items) {
              flattened.push({
                ...it,
                categoryName: it.categoryName || cat.name,
                selected: true,
              });
            }
          }
          setItems(flattened);
          toast.success(`Tebrikler! URL'den ${flattened.length} adet ürün çıkartıldı.`);
        }
      }, 600);
    },
    onError: (msg) => {
      setIsAnalyzing(false);
      setProgress(0);
      toast.error(msg || "URL analizi başarısız oldu");
    },
  });

  // 3. Commit Action
  const commit = useServerAction(commitAiMenuAction, {
    onSuccess: (res) => {
      toast.success(
        `Harika! ${res?.importedCategoriesCount ?? 0} kategori ve ${res?.importedItemsCount ?? 0} ürün ana menünüze eklendi!`,
      );
      router.push("/dashboard/menu");
    },
    onError: (msg) => toast.error(msg || "Menü kaydedilemedi"),
  });

  // Multi-file handler
  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`${file.name} boyutu 15MB'tan büyük olamaz.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStartAnalysis = () => {
    if (wallet.balance < 25) {
      toast.error("Yetersiz kredi. Menü çıkarma işlemi için 25 kredi gereklidir.");
      return;
    }

    setIsAnalyzing(true);
    setProgress(5);
    setStageIndex(0);

    if (tab === "upload") {
      if (uploadedImages.length === 0) {
        setIsAnalyzing(false);
        toast.error("Lütfen en az bir menü görseli veya PDF yükleyin.");
        return;
      }
      digitize.execute({ fileUrls: uploadedImages, mediaType: "IMAGE" });
    } else if (tab === "url") {
      if (!urlInput.trim()) {
        setIsAnalyzing(false);
        toast.error("Lütfen geçerli bir menü web adresi girin.");
        return;
      }
      digitizeUrl.execute({ url: urlInput.trim() });
    } else {
      if (!rawText.trim()) {
        setIsAnalyzing(false);
        toast.error("Lütfen menü metnini girin.");
        return;
      }
      digitize.execute({ rawText, mediaType: "TEXT" });
    }
  };

  const toggleAll = (select: boolean) => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: select })));
  };

  const toggleItemSelection = (index: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it)),
    );
  };

  const updateItemField = (index: number, field: keyof AiDigitizedItemDTO, val: any) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: val } : it)),
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommit = () => {
    const selectedItems = items.filter((it) => it.selected);
    if (selectedItems.length === 0) {
      toast.error("Lütfen menüye aktarmak için en az bir ürün seçin.");
      return;
    }

    const uniqueCategories = Array.from(
      new Set(selectedItems.map((it) => it.categoryName.trim())),
    );

    commit.execute({
      categories: uniqueCategories,
      items: selectedItems.map((it) => ({
        name: it.name,
        categoryName: it.categoryName,
        price: Number(it.price) || 0,
        shortDescription: it.shortDescription,
        calories: it.calories,
        prepTimeMinutes: it.prepTimeMinutes,
        dietaryType: it.dietaryType,
        allergens: it.allergens ?? [],
        variants: it.variants ?? [],
      })),
    });
  };

  const selectedCount = items.filter((it) => it.selected).length;

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
            title="Yapay Zeka ile Menü İçe Aktar"
            description="Fotoğraf, çok sayfalı PDF veya web bağlantınızdaki tüm menüyü saniyeler içinde analiz edin."
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2">
          <SparklesIcon className="size-4 text-amber-500" />
          <span className="text-xs font-bold text-foreground">
            İşlem: <strong>25 Kredi</strong> (Kalan: {wallet.balance})
          </span>
        </div>
      </div>

      {/* ANIMATED LOADING OVERLAY */}
      {isAnalyzing ? (
        <Card className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-card/95 p-8 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          {/* Scanning Beam */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

          <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
            <div className="relative flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
              <ScanLineIcon className="size-10 animate-bounce" />
              <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                ✨
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl font-black text-foreground">Menünüz Analiz Ediliyor</h3>
              <p className="text-xs text-muted-foreground font-medium" aria-live="polite">
                {STAGES[stageIndex]?.label}
              </p>
            </div>

            {/* Premium Animated Progress Bar */}
            <div className="w-full max-w-md flex flex-col gap-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted border border-border/80">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-primary to-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                <span>İlerleme</span>
                <span className="tabular-nums font-black text-foreground">%{progress}</span>
              </div>
            </div>

            {/* Stages Step List */}
            <div className="grid w-full max-w-md gap-2 text-left text-xs mt-2">
              {STAGES.slice(0, 5).map((stg, i) => {
                const isDone = progress >= stg.percent;
                const isCurrent = stageIndex === i;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors",
                      isCurrent
                        ? "bg-primary/10 font-bold text-primary border border-primary/20"
                        : isDone
                          ? "text-foreground font-semibold opacity-80"
                          : "text-muted-foreground opacity-40",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2Icon className="size-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <div className="size-4 rounded-full border border-muted-foreground/40 shrink-0" />
                    )}
                    <span>{stg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : !digitizedMenu ? (
        /* STEP 1: INPUT TABS */
        <Card className="rounded-3xl border border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Menü Kaynağınızı Seçin</CardTitle>
            <CardDescription className="text-xs">
              Fotoğraf, çok sayfalı PDF veya web bağlantısı üzerinden menünüzü aktarın.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3 rounded-2xl p-1">
                <TabsTrigger value="upload" className="rounded-xl text-xs font-bold gap-2">
                  <ImageIcon className="size-4" /> Fotoğraf / PDF
                </TabsTrigger>
                <TabsTrigger value="url" className="rounded-xl text-xs font-bold gap-2">
                  <GlobeIcon className="size-4" /> Web Linkinden
                </TabsTrigger>
                <TabsTrigger value="text" className="rounded-xl text-xs font-bold gap-2">
                  <FileTextIcon className="size-4" /> Metin Olarak
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
                <div
                  className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-card p-8 text-center transition-colors cursor-pointer"
                  onClick={() => document.getElementById("multi-menu-file-input")?.click()}
                >
                  <input
                    id="multi-menu-file-input"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleMultipleFiles}
                  />

                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UploadCloudIcon className="size-7" />
                    </div>
                    <p className="font-bold text-sm text-foreground">
                      Menü Sayfalarını Seçin veya Sürükleyin
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Birden fazla görsel veya çok sayfalı PDF yükleyebilirsiniz (PNG, JPG, WEBP, PDF)
                    </p>
                  </div>
                </div>

                {/* Uploaded Thumbnails Preview */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-foreground">
                      Yüklenen Menü Sayfaları ({uploadedImages.length}):
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative group size-24 rounded-2xl border overflow-hidden shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`Sayfa ${i + 1}`} className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(i)}
                            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-destructive transition-colors cursor-pointer"
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* URL Tab */}
              <TabsContent value="url" className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Menü Web Bağlantısı (URL)</label>
                  <div className="relative">
                    <Link2Icon className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="https://restoraniniz.com/menu veya PDF bağlantısı"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Güvenli SSRF korumalı bağlantı tarayıcımız web sayfasındaki menü listesini otomatik çeker.
                  </p>
                </div>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="mt-4 flex flex-col gap-3">
                <Textarea
                  placeholder="Menü listenizi buraya yapıştırın... (Örn: Adana Kebap - 390 TL)"
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="rounded-2xl text-xs font-mono"
                />
              </TabsContent>
            </Tabs>

            <Button
              size="lg"
              className="h-13 rounded-2xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 text-base cursor-pointer"
              disabled={
                isAnalyzing ||
                (tab === "upload" && uploadedImages.length === 0) ||
                (tab === "url" && !urlInput.trim()) ||
                (tab === "text" && !rawText.trim())
              }
              onClick={handleStartAnalysis}
            >
              <SparklesIcon className="size-5 mr-2" />
              Menüyü Analiz Et (25 Kredi)
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* STEP 2: STAGING REVIEW & APPROVAL TABLE */
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-2xs">
            <div>
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                <CheckCircle2Icon className="size-5 text-emerald-500" />
                Menü Analiz Sonuçları
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {items.length} ürün başarıyla çıkarıldı. Kontrol edip onaylayarak menünüze ekleyin.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
                onClick={() => toggleAll(true)}
              >
                Tümünü Seç
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
                onClick={() => toggleAll(false)}
              >
                Tümünü Kaldır
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
                onClick={() => {
                  setDigitizedMenu(null);
                  setUploadedImages([]);
                }}
              >
                <RotateCcwIcon className="size-3.5 mr-1" /> Yeni Yükle
              </Button>

              <Button
                size="sm"
                className="rounded-xl font-bold bg-primary text-primary-foreground shadow-sm cursor-pointer"
                disabled={selectedCount === 0 || commit.isPending}
                onClick={handleCommit}
              >
                {commit.isPending ? "Ekleniyor…" : `Onayla ve Menüye Ekle (${selectedCount} Ürün)`}
              </Button>
            </div>
          </div>

          {/* Staging Items List */}
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-2xl border p-3.5 transition-all",
                  item.selected ? "border-primary/40 bg-card shadow-xs" : "border-border/60 bg-muted/20 opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItemSelection(idx)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />

                {/* Category */}
                <div className="w-36 sm:w-44">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Kategori</span>
                  <Input
                    value={item.categoryName}
                    onChange={(e) => updateItemField(idx, "categoryName", e.target.value)}
                    className="h-8 text-xs font-semibold rounded-lg mt-0.5"
                  />
                </div>

                {/* Name */}
                <div className="min-w-44 flex-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Ürün Adı</span>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItemField(idx, "name", e.target.value)}
                    className="h-8 text-xs font-bold rounded-lg mt-0.5"
                  />
                </div>

                {/* Price */}
                <div className="w-24">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Fiyat (₺)</span>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItemField(idx, "price", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-black tabular-nums rounded-lg mt-0.5"
                  />
                </div>

                {/* Description */}
                <div className="w-full sm:w-64">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Açıklama</span>
                  <Input
                    placeholder="Açıklama..."
                    value={item.shortDescription ?? ""}
                    onChange={(e) => updateItemField(idx, "shortDescription", e.target.value)}
                    className="h-8 text-xs text-muted-foreground rounded-lg mt-0.5"
                  />
                </div>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(idx)}
                  className="text-muted-foreground hover:text-destructive rounded-lg"
                  title="Kaldır"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
