"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  FileTextIcon,
  FlameIcon,
  ImageIcon,
  Loader2Icon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react";
import { toast } from "sonner";

import { commitAiMenuAction, digitizeMenuAction } from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AiCreditWalletDTO,
  AiDigitizedCategoryDTO,
  AiDigitizedItemDTO,
  AiDigitizedMenuDTO,
} from "@/types/ai";

export function MenuImportView({ wallet }: { wallet: AiCreditWalletDTO }) {
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "text">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [uploading, setUploading] = useState(false);

  // Staging state
  const [digitizedMenu, setDigitizedMenu] = useState<AiDigitizedMenuDTO | null>(null);
  const [items, setItems] = useState<AiDigitizedItemDTO[]>([]);

  // 1. Digitize Action
  const digitize = useServerAction(digitizeMenuAction, {
    onSuccess: (res) => {
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
    },
    onError: (msg) => toast.error(msg || "Menü dijitalleştirilemedi"),
  });

  // 2. Commit Action
  const commit = useServerAction(commitAiMenuAction, {
    onSuccess: (res) => {
      toast.success(
        `Harika! ${res?.importedCategoriesCount ?? 0} kategori ve ${res?.importedItemsCount ?? 0} ürün ana menünüze eklendi!`,
      );
      router.push("/dashboard/menu");
    },
    onError: (msg) => toast.error(msg || "Menü kaydedilemedi"),
  });

  // Handle local image selection & convert to Base64 for OCR
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Dosya boyutu 15MB'tan küçük olmalıdır.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error("Dosya okunamadı.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleStartDigitize = () => {
    if (wallet.balance < 10) {
      toast.error("Yetersiz kredi. Menü çıkarma işlemi için 10 kredi gereklidir.");
      return;
    }

    if (tab === "upload") {
      if (!imageUrl) {
        toast.error("Lütfen önce bir menü görseli seçin.");
        return;
      }
      digitize.execute({ fileUrl: imageUrl, mediaType: "IMAGE" });
    } else {
      if (!rawText.trim()) {
        toast.error("Lütfen menü metnini girin.");
        return;
      }
      digitize.execute({ rawText, mediaType: "TEXT" });
    }
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
            title="Menü Dijitalleştirici (OCR & AI)"
            description="Fotoğraf veya metin halindeki menünüzü saniyeler içinde analiz edip ana menünüze aktarın."
          />
        </div>

        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
          <SparklesIcon className="size-3.5 text-amber-500" />
          İşlem Maliyeti: <strong>10 Kredi</strong> (Kalan: {wallet.balance})
        </Badge>
      </div>

      {!digitizedMenu ? (
        /* STEP 1: UPLOAD / INPUT FORM */
        <Card className="rounded-3xl border border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Menü Kaynağını Belirleyin</CardTitle>
            <CardDescription className="text-xs">
              Mevcut menünüzün fotoğrafını çekip yükleyin veya menü listesini metin olarak yapıştırın.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1">
                <TabsTrigger value="upload" className="rounded-xl text-xs font-bold gap-2">
                  <ImageIcon className="size-4" /> Fotoğraf / PDF Yükle
                </TabsTrigger>
                <TabsTrigger value="text" className="rounded-xl text-xs font-bold gap-2">
                  <FileTextIcon className="size-4" /> Metin Olarak Yapıştır
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="mt-4 flex flex-col gap-4">
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
                    imageUrl ? "border-primary bg-primary/5" : "border-border/80 hover:border-primary/50 bg-card",
                  )}
                  onClick={() => document.getElementById("menu-file-input")?.click()}
                >
                  <input
                    id="menu-file-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {imageUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative size-40 overflow-hidden rounded-2xl border shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Menü Önizleme" className="size-full object-cover" />
                      </div>
                      <p className="text-xs font-bold text-foreground">Görsel Seçildi (Değiştirmek için tıklayın)</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <UploadCloudIcon className="size-7" />
                      </div>
                      <p className="font-bold text-sm text-foreground">Menü Fotoğrafını Seçin veya Sürükleyin</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP veya PDF (Maks. 15MB)</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="mt-4 flex flex-col gap-3">
                <Textarea
                  placeholder="Örnek:
BURGERLER
- Classic Burger: 240 TL (200gr dana köfte, cheddar, marul)
- Truffle Burger: 320 TL (Trüf mayonez, karamelize soğan)

İÇECEKLER
- Kola: 50 TL
- Ayran: 40 TL"
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="rounded-2xl text-xs font-mono"
                />
              </TabsContent>
            </Tabs>

            <Button
              size="lg"
              className="h-13 rounded-2xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 text-base cursor-pointer"
              disabled={digitize.isPending || uploading || (tab === "upload" && !imageUrl) || (tab === "text" && !rawText.trim())}
              onClick={handleStartDigitize}
            >
              {digitize.isPending ? (
                <>
                  <Loader2Icon className="size-5 animate-spin mr-2" />
                  Yapay Zeka Menünüzü Çözümlüyor…
                </>
              ) : (
                <>
                  <SparklesIcon className="size-5 mr-2" />
                  Menüyü Dijitalleştir (10 Kredi)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* STEP 2: INTERACTIVE STAGING & APPROVAL TABLE */
        <div className="flex flex-col gap-4">
          {/* Top Review Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-2xs">
            <div>
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                <CheckCircle2Icon className="size-5 text-emerald-500" />
                Çıkartılan Ürünleri İnceleyin & Onaylayın
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {items.length} ürün tespit edildi. İstediğiniz bilgileri doğrudan düzenleyebilir ve sadece seçtiklerinizi aktarabilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
                onClick={() => setDigitizedMenu(null)}
              >
                <RotateCcwIcon className="size-3.5 mr-1.5" />
                Yeniden Yükle
              </Button>

              <Button
                size="sm"
                className="rounded-xl font-bold bg-primary text-primary-foreground shadow-sm cursor-pointer"
                disabled={selectedCount === 0 || commit.isPending}
                onClick={handleCommit}
              >
                {commit.isPending ? (
                  "Aktarılıyor…"
                ) : (
                  <>
                    <CheckIcon className="size-4 mr-1.5" />
                    Seçili {selectedCount} Ürünü Menüye Aktar
                  </>
                )}
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
                {/* Select Checkbox */}
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItemSelection(idx)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />

                {/* Category Input */}
                <div className="w-36 sm:w-44">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Kategori</span>
                  <Input
                    value={item.categoryName}
                    onChange={(e) => updateItemField(idx, "categoryName", e.target.value)}
                    className="h-8 text-xs font-semibold rounded-lg mt-0.5"
                  />
                </div>

                {/* Item Name */}
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

                {/* Calories */}
                <div className="w-20 hidden sm:block">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Kalori</span>
                  <Input
                    type="number"
                    placeholder="kcal"
                    value={item.calories ?? ""}
                    onChange={(e) => updateItemField(idx, "calories", parseInt(e.target.value, 10) || null)}
                    className="h-8 text-xs tabular-nums rounded-lg mt-0.5"
                  />
                </div>

                {/* Description */}
                <div className="w-full sm:w-64">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Açıklama</span>
                  <Input
                    placeholder="Ürün açıklaması..."
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
                  title="Listeden Kaldır"
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
