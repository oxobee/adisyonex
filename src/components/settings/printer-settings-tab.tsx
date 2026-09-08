"use client";

import { useState } from "react";
import {
  BikeIcon,
  BuildingIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PrinterIcon,
  ReceiptTextIcon,
  SaveIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updateReceiptSettingsAction } from "@/actions/settings.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerAction } from "@/hooks/use-server-action";
import {
  renderCourierSlip,
  renderCustomerBill,
  renderKitchenTicket,
  renderMerchantCopy,
  type ReceiptOrderMetadata,
  type ReceiptItemData,
} from "@/lib/printer/receipt-engine";

interface PrinterSettingsTabProps {
  readonly initialSettings: {
    receiptKitchenActive: boolean;
    receiptCourierActive: boolean;
    receiptCustomerActive: boolean;
    receiptMerchantActive: boolean;
  };
  readonly restaurantName: string;
}

export function PrinterSettingsTab({
  initialSettings,
  restaurantName,
}: PrinterSettingsTabProps) {
  const [kitchenActive, setKitchenActive] = useState(
    initialSettings.receiptKitchenActive
  );
  const [courierActive, setCourierActive] = useState(
    initialSettings.receiptCourierActive
  );
  const [customerActive, setCustomerActive] = useState(
    initialSettings.receiptCustomerActive
  );
  const [merchantActive, setMerchantActive] = useState(
    initialSettings.receiptMerchantActive
  );

  const [previewWidth, setPreviewWidth] = useState<58 | 80>(80);
  const [activePreviewType, setActivePreviewType] = useState<
    "CUSTOMER" | "COURIER" | "KITCHEN" | "MERCHANT"
  >("CUSTOMER");

  const saveSettings = useServerAction(updateReceiptSettingsAction, {
    onSuccess: () => {
      toast.success("Fiş ve yazıcı tercihleri kaydedildi.");
    },
    onError: (err) => {
      toast.error(err || "Ayarlar kaydedilemedi.");
    },
  });

  const handleSave = () => {
    saveSettings.execute({
      receiptKitchenActive: kitchenActive,
      receiptCourierActive: courierActive,
      receiptCustomerActive: customerActive,
      receiptMerchantActive: merchantActive,
    });
  };

  // Sample order for live simulator
  const sampleMeta: ReceiptOrderMetadata = {
    orderNumber: 104,
    orderType: "DELIVERY",
    createdAt: new Date(),
    customerName: "Ahmet Yılmaz",
    customerPhone: "0532 555 12 34",
    customerAddress: "Atatürk Mah. Karanfil Sok. No: 14 D: 3 Kadıköy / İstanbul",
    customerNotes: "Kapı zili çalışmıyor, lütfen varınca arayın.",
    paymentMode: "KAPIDA KREDİ KARTI / POS CİHAZI",
    subtotal: 420.0,
    deliveryFee: 30.0,
    grandTotal: 450.0,
    channel: "Telefon / Caller ID",
    restaurantInfo: {
      name: restaurantName || "Oxonom Restaurant",
      phone: "0216 123 45 67",
      address: "Bağdat Cad. No: 88 Kadıköy / İstanbul",
    },
  };

  const sampleItems: ReceiptItemData[] = [
    {
      name: "Adana Kebap Porsiyon",
      quantity: 2,
      unitPrice: 180.0,
      totalPrice: 360.0,
      modifiers: ["Acılı", "Lavaş Fazla Olsun"],
    },
    {
      name: "Kutu Ayran 330ml",
      quantity: 2,
      unitPrice: 30.0,
      totalPrice: 60.0,
    },
  ];

  const getSimulatorPreview = (): string => {
    if (activePreviewType === "CUSTOMER") {
      return renderCustomerBill(sampleMeta, sampleItems, { widthMm: previewWidth }).plainText;
    }
    if (activePreviewType === "COURIER") {
      return renderCourierSlip(sampleMeta, sampleItems, { widthMm: previewWidth }).plainText;
    }
    if (activePreviewType === "KITCHEN") {
      return renderKitchenTicket(sampleMeta, sampleItems, { widthMm: previewWidth, stationName: "SICAK MUTFAK" }).plainText;
    }
    if (activePreviewType === "MERCHANT") {
      return renderMerchantCopy(sampleMeta, sampleItems, { widthMm: previewWidth }).plainText;
    }
    return "";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* SOL PANEL: FİŞ AYARLARI */}
      <div className="lg:col-span-6 space-y-6">
        <Card className="rounded-2xl border border-border/80 shadow-xs">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <PrinterIcon className="size-4.5 text-primary" />
                  <span>Fiş Türlerini Aç / Kapat</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Kasa satışlarında ve yazdırma ekranlarında hangi fişlerin otomatik veya manuel yazdırılacağını belirleyin.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Termal ESC/POS
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {/* 1. Müşteri Fişi */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                  <ReceiptTextIcon className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Müşteri & Paket Fişi
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        customerActive
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {customerActive ? "Aktif" : "Devre Dışı"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Müşteriye verilen hesap, KDV ve ödeme dökümü fişi.
                  </p>
                </div>
              </div>
              <Switch
                checked={customerActive}
                onCheckedChange={setCustomerActive}
              />
            </div>

            {/* 2. Kurye Fişi */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <BikeIcon className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Kurye Teslimat Fişi
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        courierActive
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {courierActive ? "Aktif" : "Devre Dışı"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paket teslimatı için kuryeye verilen, büyük adres ve net tahsilat kutusu içeren fiş.
                  </p>
                </div>
              </div>
              <Switch
                checked={courierActive}
                onCheckedChange={setCourierActive}
              />
            </div>

            {/* 3. Mutfak Fişi (KOT) */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mt-0.5">
                  <UtensilsCrossedIcon className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Mutfak Fişi (KOT)
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        kitchenActive
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {kitchenActive ? "Aktif" : "Devre Dışı"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sipariş girildiğinde mutfak istasyonlarına gönderilen sipariş hazırlık fişi.
                  </p>
                </div>
              </div>
              <Switch
                checked={kitchenActive}
                onCheckedChange={setKitchenActive}
              />
            </div>

            {/* 4. İşletme Fişi */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-0.5">
                  <BuildingIcon className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      İşletme / Muhasebe Kopyası
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        merchantActive
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {merchantActive ? "Aktif" : "Devre Dışı"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kasa veya arşiv için basılan özet işletme kopyası.
                  </p>
                </div>
              </div>
              <Switch
                checked={merchantActive}
                onCheckedChange={setMerchantActive}
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={saveSettings.isPending}
                className="w-full font-bold gap-2"
              >
                {saveSettings.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                <span>Tercihleri Kaydet</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SAĞ PANEL: CANLI TERMAL SİMÜLATÖR */}
      <div className="lg:col-span-6 space-y-4">
        <Card className="rounded-2xl border border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <span>Canlı Termal Fiş Simülatörü</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Yazıcıdan çıkacak olan monospaced çıktıyı gerçek boyutunda canlı görüntüleyin.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border">
                <button
                  type="button"
                  onClick={() => setPreviewWidth(80)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                    previewWidth === 80
                      ? "bg-white dark:bg-slate-900 text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  80 mm
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWidth(58)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                    previewWidth === 58
                      ? "bg-white dark:bg-slate-900 text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  58 mm
                </button>
              </div>
            </div>

            <div className="pt-3">
              <Tabs
                value={activePreviewType}
                onValueChange={(v) => setActivePreviewType(v as any)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 w-full h-8">
                  <TabsTrigger value="CUSTOMER" className="text-xs font-bold">
                    Müşteri
                  </TabsTrigger>
                  <TabsTrigger value="COURIER" className="text-xs font-bold">
                    Kurye
                  </TabsTrigger>
                  <TabsTrigger value="KITCHEN" className="text-xs font-bold">
                    Mutfak
                  </TabsTrigger>
                  <TabsTrigger value="MERCHANT" className="text-xs font-bold">
                    İşletme
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex justify-center bg-slate-950/90 dark:bg-black/90 p-6 rounded-b-2xl min-h-[480px]">
            <div
              style={{ width: previewWidth === 58 ? "260px" : "360px" }}
              className="bg-white text-slate-950 p-4 rounded shadow-2xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text border border-slate-300 transition-all duration-200"
            >
              {getSimulatorPreview()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
