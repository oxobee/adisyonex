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

  const [selectedScenarioKey, setSelectedScenarioKey] = useState<
    "DELIVERY_CARD" | "DELIVERY_CASH" | "TAKEAWAY_CASH" | "DINE_IN" | "MARKETPLACE"
  >("DELIVERY_CARD");

  // Sample combinations for live simulator
  const SCENARIOS: Record<
    string,
    { name: string; meta: ReceiptOrderMetadata; items: ReceiptItemData[] }
  > = {
    DELIVERY_CARD: {
      name: "🛵 Paket (Kapıda Kart)",
      meta: {
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
      },
      items: [
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
      ],
    },
    DELIVERY_CASH: {
      name: "💵 Paket (Kapıda Nakit)",
      meta: {
        orderNumber: 105,
        orderType: "DELIVERY",
        createdAt: new Date(),
        customerName: "Mehmet Demir",
        customerPhone: "0533 111 22 33",
        customerAddress: "Caferağa Mah. Moda Cad. No: 45 Kat: 2 Moda / Kadıköy",
        customerNotes: "200 TL üzeri para üstü getirilsin.",
        paymentMode: "KAPIDA NAKİT",
        subtotal: 260.0,
        grandTotal: 260.0,
        channel: "Telefon / Caller ID",
        restaurantInfo: {
          name: restaurantName || "Oxonom Restaurant",
          phone: "0216 123 45 67",
          address: "Bağdat Cad. No: 88 Kadıköy / İstanbul",
        },
      },
      items: [
        {
          name: "Urfa Dürüm",
          quantity: 2,
          unitPrice: 110.0,
          totalPrice: 220.0,
        },
        {
          name: "Şalgam Suyu",
          quantity: 2,
          unitPrice: 20.0,
          totalPrice: 40.0,
        },
      ],
    },
    TAKEAWAY_CASH: {
      name: "🥡 Gel-Al (Takeaway)",
      meta: {
        orderNumber: 106,
        orderType: "TAKEAWAY",
        createdAt: new Date(),
        customerName: "Zeynep Kaya",
        customerPhone: "0533 987 65 43",
        paymentMode: "NAKİT",
        subtotal: 310.0,
        grandTotal: 310.0,
        channel: "Gel-Al / Telefon",
        note: "15 dakika sonra gelip teslim alacak.",
        restaurantInfo: {
          name: restaurantName || "Oxonom Restaurant",
          phone: "0216 123 45 67",
          address: "Bağdat Cad. No: 88 Kadıköy / İstanbul",
        },
      },
      items: [
        {
          name: "Tavuk Şiş Dürüm",
          quantity: 2,
          unitPrice: 130.0,
          totalPrice: 260.0,
        },
        {
          name: "Kutu Kola",
          quantity: 2,
          unitPrice: 25.0,
          totalPrice: 50.0,
        },
      ],
    },
    DINE_IN: {
      name: "🍽️ Masa / Salon (Masa 4)",
      meta: {
        orderNumber: 107,
        orderType: "DINE_IN",
        tableLabel: "Masa 4",
        createdAt: new Date(),
        customerName: "Caner Erkin",
        paymentMode: "KREDİ KARTI",
        subtotal: 580.0,
        grandTotal: 580.0,
        channel: "Salon / Garson",
        staffName: "Garson Murat",
        restaurantInfo: {
          name: restaurantName || "Oxonom Restaurant",
          phone: "0216 123 45 67",
          address: "Bağdat Cad. No: 88 Kadıköy / İstanbul",
        },
      },
      items: [
        {
          name: "Beyti Sarma",
          quantity: 2,
          unitPrice: 240.0,
          totalPrice: 480.0,
        },
        {
          name: "Künefe",
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
        },
      ],
    },
    MARKETPLACE: {
      name: "🛍️ Yemeksepeti Online",
      meta: {
        orderNumber: 108,
        orderType: "DELIVERY",
        createdAt: new Date(),
        customerName: "Ayşe Çelik (Yemeksepeti)",
        customerPhone: "0850 222 00 00",
        customerAddress: "Fenerbahçe Mah. Lale Sk. No: 12 Kadıköy / İstanbul",
        customerNotes: "Temassız teslimat, kapıya asın ve zili çalın.",
        paymentMode: "ONLINE ÖDENDİ (YEMEKSEPETİ)",
        isPaid: true,
        subtotal: 440.0,
        grandTotal: 440.0,
        channel: "Yemeksepeti",
        restaurantInfo: {
          name: restaurantName || "Oxonom Restaurant",
          phone: "0216 123 45 67",
          address: "Bağdat Cad. No: 88 Kadıköy / İstanbul",
        },
      },
      items: [
        {
          name: "Büyük Boy Karışık Pizza",
          quantity: 1,
          unitPrice: 320.0,
          totalPrice: 320.0,
          modifiers: ["Mısırsız"],
        },
        {
          name: "Patates Kızartması",
          quantity: 1,
          unitPrice: 80.0,
          totalPrice: 80.0,
        },
        {
          name: "Kutu Fanta",
          quantity: 1,
          unitPrice: 40.0,
          totalPrice: 40.0,
        },
      ],
    },
  };

  const activeScenario = SCENARIOS[selectedScenarioKey] || SCENARIOS.DELIVERY_CARD;

  const getSimulatorPreview = (): string => {
    if (activePreviewType === "CUSTOMER") {
      return renderCustomerBill(activeScenario.meta, activeScenario.items, { widthMm: previewWidth }).plainText;
    }
    if (activePreviewType === "COURIER") {
      return renderCourierSlip(activeScenario.meta, activeScenario.items, { widthMm: previewWidth }).plainText;
    }
    if (activePreviewType === "KITCHEN") {
      return renderKitchenTicket(activeScenario.meta, activeScenario.items, { widthMm: previewWidth, stationName: "SICAK MUTFAK" }).plainText;
    }
    if (activePreviewType === "MERCHANT") {
      return renderMerchantCopy(activeScenario.meta, activeScenario.items, { widthMm: previewWidth }).plainText;
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

            <div className="pt-3 space-y-2.5">
              {/* Scenario Selector Pills */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b">
                {Object.entries(SCENARIOS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedScenarioKey(key as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      selectedScenarioKey === key
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background/80 hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

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
