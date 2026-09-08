"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneCallIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  PlayIcon,
  Loader2Icon,
  RadioTowerIcon,
  HelpCircleIcon,
  AlertTriangleIcon,
  SparklesIcon,
  PrinterIcon,
  BikeIcon,
  ReceiptTextIcon,
  BuildingIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  testTelephonyConnectionAction,
  triggerCallSimulationAction,
  updateTelephonySettingsAction,
} from "@/actions/telephony.actions";
import {
  renderCustomerBill,
  renderCourierSlip,
  renderMerchantCopy,
  renderKitchenTicket,
  type ReceiptOrderMetadata,
  type ReceiptItemData,
} from "@/lib/printer/receipt-engine";
import { broadcastTelephonyEvent } from "@/lib/telephony-broadcast";
import { PrinterClient } from "@/lib/printer/printer-client";
import { IncomingCallDrawer } from "@/components/telephony/incoming-call-drawer";
import type { ActiveCallDTO, SimulationScenario, TelephonySettingsDTO } from "@/services/telephony.service";

interface TelephonySettingsTabProps {
  readonly initialSettings: TelephonySettingsDTO;
  readonly restaurantName?: string;
}

export interface ReceiptCombination {
  id: string;
  name: string;
  description: string;
  meta: ReceiptOrderMetadata;
  items: ReceiptItemData[];
}

const SAMPLE_COMBINATIONS: ReceiptCombination[] = [
  {
    id: "DELIVERY_CARD",
    name: "🛵 Paket Servis (Kapıda Kredi Kartı)",
    description: "Kuryeli teslimat, pos cihazı yönlendirmeli ve açık adresli fiş.",
    meta: {
      orderNumber: 1042,
      orderType: "DELIVERY",
      customerName: "Ahmet Yılmaz",
      customerPhone: "0532 555 12 34",
      customerAddress: "Atatürk Mah. Karanfil Sok. No:14 Daire:8 Kadıköy / İstanbul (Zil: Yılmaz)",
      customerNotes: "Zil çalmayın lütfen, bebek uyuyor. Kapıya bırakıp arayın.",
      paymentMode: "KAPIDA KREDİ KARTI",
      subtotal: 385.0,
      grandTotal: 385.0,
      createdAt: new Date(),
      channel: "Telefon / Caller ID",
    },
    items: [
      {
        name: "Özel Karışık Kebap",
        quantity: 1,
        unitPrice: 220,
        totalPrice: 220,
        variantName: "Porsiyon",
        modifiers: ["Acılı", "Bol Yeşillik"],
      },
      {
        name: "Fındık Lahmacun",
        quantity: 2,
        unitPrice: 60,
        totalPrice: 120,
        modifiers: ["Limon & Maydanoz"],
      },
      {
        name: "Yayık Ayranı",
        quantity: 1,
        unitPrice: 45,
        totalPrice: 45,
      },
    ],
  },
  {
    id: "DELIVERY_CASH",
    name: "💵 Paket Servis (Kapıda Nakit Tahsilat)",
    description: "Kuryenin kapıda nakit tahsil edeceği tutar vurgulu fiş.",
    meta: {
      orderNumber: 1043,
      orderType: "DELIVERY",
      customerName: "Mehmet Demir",
      customerPhone: "0533 111 22 33",
      customerAddress: "Caferağa Mah. Moda Cad. No:45 Kat:2 Moda / Kadıköy",
      customerNotes: "200 TL üzeri para üstü getirilsin.",
      paymentMode: "KAPIDA NAKİT",
      subtotal: 260.0,
      grandTotal: 260.0,
      createdAt: new Date(),
      channel: "Telefon / Caller ID",
    },
    items: [
      {
        name: "Adana Dürüm",
        quantity: 2,
        unitPrice: 110,
        totalPrice: 220,
        modifiers: ["Acılı"],
      },
      {
        name: "Şalgam Suyu",
        quantity: 2,
        unitPrice: 20,
        totalPrice: 40,
      },
    ],
  },
  {
    id: "TAKEAWAY_CASH",
    name: "🥡 Gel-Al / Takeaway Sipariş",
    description: "Müşterinin restorana gelip kendisinin alacağı sipariş fişi.",
    meta: {
      orderNumber: 1044,
      orderType: "TAKEAWAY",
      customerName: "Zeynep Kaya",
      customerPhone: "0533 987 65 43",
      paymentMode: "NAKİT",
      subtotal: 310.0,
      grandTotal: 310.0,
      createdAt: new Date(),
      channel: "Gel-Al / Telefon",
      note: "15 dakika sonra gelip alacak.",
    },
    items: [
      {
        name: "Tavuk Şiş Porsiyon",
        quantity: 2,
        unitPrice: 130,
        totalPrice: 260,
      },
      {
        name: "Kutu Kola",
        quantity: 2,
        unitPrice: 25,
        totalPrice: 50,
      },
    ],
  },
  {
    id: "DINE_IN_TABLE",
    name: "🍽️ Salon / Masa Adisyonu (Masa 4)",
    description: "Masa hesabı, garson ve KDV dökümlü restoran adisyonu.",
    meta: {
      orderNumber: 1045,
      orderType: "DINE_IN",
      tableLabel: "Masa 4",
      customerName: "Caner Erkin",
      paymentMode: "KREDİ KARTI",
      subtotal: 580.0,
      grandTotal: 580.0,
      createdAt: new Date(),
      channel: "Salon / Garson",
      staffName: "Garson Murat",
    },
    items: [
      {
        name: "Beyti Sarma",
        quantity: 2,
        unitPrice: 240,
        totalPrice: 480,
      },
      {
        name: "Künefe",
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
      },
    ],
  },
  {
    id: "MARKETPLACE_ONLINE",
    name: "🛍️ Yemeksepeti / Online Ödenmiş Fiş",
    description: "Pazaryeri maskeli sipariş, tahsilat yapılmaz uyarılı çıktı.",
    meta: {
      orderNumber: 1046,
      orderType: "DELIVERY",
      customerName: "Ayşe Çelik (Yemeksepeti)",
      customerPhone: "0850 222 00 00",
      customerAddress: "Fenerbahçe Mah. Lale Sk. No: 12 Kadıköy / İstanbul",
      customerNotes: "Temassız teslimat, kapıya asın ve zili çalın.",
      paymentMode: "ONLINE ÖDENDİ (YEMEKSEPETİ)",
      isPaid: true,
      subtotal: 440.0,
      grandTotal: 440.0,
      createdAt: new Date(),
      channel: "Yemeksepeti",
    },
    items: [
      {
        name: "Büyük Boy Pizza Karışık",
        quantity: 1,
        unitPrice: 320,
        totalPrice: 320,
        modifiers: ["Mısırsız"],
      },
      {
        name: "Patates Kızartması",
        quantity: 1,
        unitPrice: 80,
        totalPrice: 80,
      },
      {
        name: "Kutu Fanta",
        quantity: 1,
        unitPrice: 40,
        totalPrice: 40,
      },
    ],
  },
];

export function TelephonySettingsTab({ initialSettings, restaurantName = "Oxonom Restaurant" }: TelephonySettingsTabProps) {
  const [settings, setSettings] = useState<TelephonySettingsDTO>(initialSettings);
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [mode, setMode] = useState<"SIMULATION" | "LIVE">(initialSettings.mode);
  const [incomingNumber, setIncomingNumber] = useState(initialSettings.incomingNumber || "");
  const [sipExtension, setSipExtension] = useState(initialSettings.sipExtension || "");
  const [apiUsername, setApiUsername] = useState(initialSettings.apiUsername || "");
  const [apiPassword, setApiPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simScenario, setSimScenario] = useState<SimulationScenario>("REGISTERED_DELIVERY");
  const [simulatedCall, setSimulatedCall] = useState<ActiveCallDTO | null>(null);
  const [isSimDrawerOpen, setIsSimDrawerOpen] = useState(false);

  // Thermal preview state
  const [previewPaperWidth, setPreviewPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const [previewDocType, setPreviewDocType] = useState<"CUSTOMER" | "COURIER" | "MERCHANT" | "KITCHEN">("CUSTOMER");
  const [selectedCombinationId, setSelectedCombinationId] = useState<string>("DELIVERY_CARD");
  const [isPrintingSample, setIsPrintingSample] = useState(false);

  const selectedCombination = useMemo(() => {
    return (
      SAMPLE_COMBINATIONS.find((c) => c.id === selectedCombinationId) ||
      SAMPLE_COMBINATIONS[0]
    );
  }, [selectedCombinationId]);

  const previewRenderResult = useMemo(() => {
    const widthMm = previewPaperWidth === "58mm" ? 58 : 80;
    const metaWithRest: ReceiptOrderMetadata = {
      ...selectedCombination.meta,
      restaurantInfo: {
        name: restaurantName,
        phone: incomingNumber || "0850 300 00 00",
        address: "Kadıköy / İstanbul",
      },
    };

    if (previewDocType === "COURIER") {
      return renderCourierSlip(metaWithRest, selectedCombination.items, { widthMm });
    }
    if (previewDocType === "KITCHEN") {
      return renderKitchenTicket(metaWithRest, selectedCombination.items, { widthMm, stationName: "ANA MUTFAK" });
    }
    if (previewDocType === "MERCHANT") {
      return renderMerchantCopy(metaWithRest, selectedCombination.items, { widthMm });
    }
    return renderCustomerBill(metaWithRest, selectedCombination.items, { widthMm });
  }, [previewDocType, previewPaperWidth, selectedCombination, restaurantName, incomingNumber]);

  const previewRaw = previewRenderResult.plainText;

  // Copy webhook URL helper
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(settings.webhookUrl);
    toast.success("Webhook adresi panoya kopyalandı.");
  };

  // Save settings handler
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await updateTelephonySettingsAction({
        enabled,
        mode,
        provider: "NETGSM",
        incomingNumber: incomingNumber.trim() || null,
        sipExtension: sipExtension.trim() || null,
        apiUsername: apiUsername.trim() || null,
        apiPassword: apiPassword.trim() || undefined,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Ayarlar kaydedilemedi.");
        return;
      }

      setSettings(res.data);
      setApiPassword(""); // Clear memory
      toast.success("Akıllı Telefon Sipariş ayarları kaydedildi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle module on/off
  const handleToggleModule = async (checked: boolean) => {
    setEnabled(checked);
    setIsSaving(true);
    try {
      const res = await updateTelephonySettingsAction({
        enabled: checked,
        mode,
      });
      if (res.success && res.data) {
        setSettings(res.data);
        toast.success(
          checked
            ? "Akıllı Telefon Sipariş Modülü aktif edildi."
            : "Akıllı Telefon Sipariş Modülü pasif yapıldı."
        );
      } else {
        setEnabled(!checked);
        toast.error(res.error || "Modül durumu güncellenemedi.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Test Netgsm connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testTelephonyConnectionAction();
      if (res.success) {
        toast.success("✓ Netgsm santral bağlantısı başarılı!");
      } else {
        toast.error(res.error || "Netgsm bağlantısı başarısız.");
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Trigger test simulation call
  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await triggerCallSimulationAction({
        scenario: simScenario,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Simülasyon başlatılamadı.");
        return;
      }

      // Broadcast to current tab and all other open tabs (POS terminal, etc.)
      broadcastTelephonyEvent({
        type: "INCOMING_CALL",
        call: res.data,
      });

      // Also display call drawer immediately in the current settings view!
      setSimulatedCall(res.data);
      setIsSimDrawerOpen(true);

      const scenarioLabels: Record<SimulationScenario, string> = {
        REGISTERED_DELIVERY: "Kayıtlı Müşteri (Paket - Kapıda Kart)",
        REGISTERED_TAKEAWAY: "Kayıtlı Müşteri (Gel-Al - Zeynep Kaya)",
        REGISTERED_DINE_IN: "Kayıtlı Müşteri (Salon - Caner Erkin)",
        NEW_CUSTOMER: "Yeni Müşteri (Kayıtsız Numara)",
        MARKETPLACE_YEMEKSEPETI: "Pazaryeri Siparişi (Yemeksepeti)",
        REGISTERED: "Kayıtlı Müşteri",
        NEW: "Yeni Müşteri",
      };

      toast.success(
        `✓ ${scenarioLabels[simScenario] || "Test"} araması başlatıldı! Çağrı ekranı açıldı.`
      );
    } finally {
      setIsSimulating(false);
    }
  };

  // Calculate missing settings for Live mode
  const missingItems = settings.missingLiveRequirements;
  const isLiveBlocked = mode === "LIVE" && missingItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PhoneCallIcon className="size-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Akıllı Telefon Sipariş Modülü (Caller ID)
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Telefonla sipariş veren müşterileri aradıkları anda tanıyın. Müşteri bilgilerini, adreslerini
          ve geçmiş siparişlerini otomatik görüntüleyerek saniyeler içinde sipariş oluşturun.
        </p>
      </div>

      {/* Status & Toggle Card */}
      <Card className="border shadow-none">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Modül Durumu:</span>
                {enabled ? (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                    🟢 Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    ⚪ Pasif
                  </Badge>
                )}
                {enabled && (
                  <Badge
                    variant="outline"
                    className={
                      mode === "LIVE"
                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs"
                        : "border-amber-500 text-amber-600 dark:text-amber-400 text-xs"
                    }
                  >
                    {mode === "LIVE" ? "Canlı Mod" : "Simülasyon Modu"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {enabled
                  ? "Modül aktif. POS terminalinde gelen aramalar otomatik algılanacaktır."
                  : "Modül pasif. Arama bildirimleri ve arama ekranları gizlenmiştir."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                {enabled ? "Açık" : "Kapalı"}
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={handleToggleModule}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {enabled && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Sağlayıcı</span>
                <span className="font-semibold text-foreground">Netgsm Santral</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Santral No</span>
                <span className="font-semibold text-foreground">
                  {incomingNumber || "Tanımlanmadı"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Son Bağlantı</span>
                <span className="font-semibold text-foreground">
                  {settings.lastSuccessfulConnectionAt
                    ? new Date(settings.lastSuccessfulConnectionAt).toLocaleDateString("tr-TR")
                    : "Test Edilmedi"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Son Gelen Çağrı</span>
                <span className="font-semibold text-foreground">
                  {settings.lastIncomingCallAt
                    ? new Date(settings.lastIncomingCallAt).toLocaleTimeString("tr-TR")
                    : "—"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mode Selection */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <RadioTowerIcon className="size-4 text-primary" />
            Çalışma Modu
          </CardTitle>
          <CardDescription className="text-xs">
            Sistemi gerçek Netgsm santralinizle canlı olarak veya test senaryolarıyla simülasyon modunda kullanabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setMode("SIMULATION")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                mode === "SIMULATION"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "hover:border-muted-foreground/30 bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5 text-amber-500" />
                  1. Simülasyon Modu (Önerilen Test)
                </span>
                {mode === "SIMULATION" && <Badge variant="default" className="text-[10px]">Seçili</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Gerçek Netgsm santraline bağlanmadan tüm arama, müşteri tanıma ve sipariş akışını simüle edin.
              </p>
            </div>

            <div
              onClick={() => setMode("LIVE")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                mode === "LIVE"
                  ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                  : "hover:border-muted-foreground/30 bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                  2. Canlı Mod
                </span>
                {mode === "LIVE" && <Badge variant="default" className="bg-emerald-600 text-[10px]">Seçili</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Netgsm santralinizden gelen gerçek aramaları anında POS terminaline aktarır.
              </p>
            </div>
          </div>

          {/* Live Mode Missing Requirements Warning */}
          {mode === "LIVE" && missingItems.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                <AlertTriangleIcon className="size-4" />
                Canlı Mod Kullanılamıyor (Eksik Ayarlar)
              </div>
              <p className="text-muted-foreground">
                Akıllı Telefon Sipariş Modülü&apos;nü canlı kullanabilmek için aşağıdaki Netgsm bilgilerini tamamlamanız gerekmektedir:
              </p>
              <ul className="space-y-1 pt-1">
                {["Santral / Netgsm telefon numarası", "API kullanıcı adı", "API şifresi"].map((item) => {
                  const isMissing = missingItems.includes(item);
                  return (
                    <li key={item} className="flex items-center gap-2">
                      {isMissing ? (
                        <span className="text-destructive font-bold">✕</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">✓</span>
                      )}
                      <span className={isMissing ? "text-destructive" : "text-muted-foreground"}>
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Trigger Box */}
      <Card className="border border-amber-500/30 bg-amber-500/5 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <SparklesIcon className="size-4 text-amber-500" />
              Simülasyon Test Araması
            </CardTitle>
            <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs">
              Test Paneli
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Tek tıkla gerçek bir Netgsm çağrısı gelmiş gibi POS ekranında çağrı panelini açın ve akışı deneyimleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-foreground block mb-2">
              Arama Senaryosu Seçin:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimScenario("REGISTERED_DELIVERY")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  simScenario === "REGISTERED_DELIVERY" || simScenario === "REGISTERED"
                    ? "bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/50"
                    : "bg-background/80 hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    🛵 Kayıtlı - Paket Servis
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    Kapıda Kart
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Ahmet Yılmaz (0532 123 45 67) • Geçmiş siparişli ve 2 kayıtlı adresli müşteri.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSimScenario("REGISTERED_TAKEAWAY")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  simScenario === "REGISTERED_TAKEAWAY"
                    ? "bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/50"
                    : "bg-background/80 hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    🥡 Kayıtlı - Gel-Al (Takeaway)
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300">
                    Nakit
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Zeynep Kaya (0533 987 65 43) • Restorandan teslim alacak müşteri.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSimScenario("REGISTERED_DINE_IN")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  simScenario === "REGISTERED_DINE_IN"
                    ? "bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/50"
                    : "bg-background/80 hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    🍽️ Kayıtlı - Salon / Masa
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300">
                    VIP / Masa
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Caner Erkin (0542 333 44 55) • Masa rezervasyonu & restoran müdavimi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSimScenario("NEW_CUSTOMER")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  simScenario === "NEW_CUSTOMER" || simScenario === "NEW"
                    ? "bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/50"
                    : "bg-background/80 hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    👤 Yeni Müşteri (Kayıtsız)
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    Hızlı Kayıt
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Sistemde kaydı olmayan rastgele numara • Hızlı kayıt formu tetikler.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSimScenario("MARKETPLACE_YEMEKSEPETI")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer sm:col-span-2 ${
                  simScenario === "MARKETPLACE_YEMEKSEPETI"
                    ? "bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/50"
                    : "bg-background/80 hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    🛍️ Pazaryeri Hattı (Yemeksepeti)
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300">
                    Online Ödendi
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Yemeksepeti santral hattı (0850 222 00 00) • Online ödenmiş sipariş akışı.
                </p>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              onClick={handleTriggerSimulation}
              disabled={isSimulating}
              className="gap-2 text-xs font-bold"
            >
              {isSimulating ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlayIcon className="size-3.5 fill-current" />
              )}
              Test Araması Başlat (POS Ekranına Gönder)
            </Button>
            <span className="text-[11px] text-muted-foreground">
              * Başlat butonuna basıldığında tüm açık POS sekmelerinde zil çalar ve arama çekmecesi açılır.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Netgsm Credentials Form */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Netgsm Entegrasyon Bilgileri</CardTitle>
          <CardDescription className="text-xs">
            Netgsm hesabınızdan temin ettiğiniz API ve santral bilgilerini girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="incomingNumber" className="text-xs font-medium">
                Santral / Netgsm Numarası <span className="text-destructive">*</span>
              </Label>
              <Input
                id="incomingNumber"
                placeholder="Örn: 08503000000 veya 02123456789"
                value={incomingNumber}
                onChange={(e) => setIncomingNumber(e.target.value)}
                className="text-xs"
              />
              <span className="text-[11px] text-muted-foreground block">
                Müşterilerinizin restoranınızı aradığı 0850 veya coğrafi numaranız.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sipExtension" className="text-xs font-medium">
                Dahili Numara (Opsiyonel)
              </Label>
              <Input
                id="sipExtension"
                placeholder="Örn: 101, 102"
                value={sipExtension}
                onChange={(e) => setSipExtension(e.target.value)}
                className="text-xs"
              />
              <span className="text-[11px] text-muted-foreground block">
                Çağrının yönlendirildiği dahili hat numarası.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apiUsername" className="text-xs font-medium">
                Netgsm API Kullanıcı Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apiUsername"
                placeholder="Netgsm abone veya kullanıcı kodunuz"
                value={apiUsername}
                onChange={(e) => setApiUsername(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apiPassword" className="text-xs font-medium">
                Netgsm API Şifresi <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="apiPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={settings.hasApiPassword ? "•••••••••••• (Kayıtlı)" : "API şifrenizi girin"}
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  className="text-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="text-xs font-semibold"
            >
              {isSaving ? <Loader2Icon className="size-3.5 animate-spin mr-1.5" /> : null}
              Ayarları Kaydet
            </Button>

            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || !apiUsername || (!apiPassword && !settings.hasApiPassword)}
              className="text-xs"
            >
              {isTesting ? <Loader2Icon className="size-3.5 animate-spin mr-1.5" /> : null}
              Bağlantıyı Test Et
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Thermal Receipt Simulator Card */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PrinterIcon className="size-4 text-primary" />
                Termal Fiş Şablonları &amp; Yazıcı Önizleme Simülatörü
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Telefon ve paket siparişlerinde 58mm ve 80mm termal yazıcılara giden çıktıların canlı önizlemesi.
              </CardDescription>
            </div>
            {/* Paper Width Selector */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border text-xs">
              <button
                type="button"
                onClick={() => setPreviewPaperWidth("58mm")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  previewPaperWidth === "58mm"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                58mm (32 Kolon)
              </button>
              <button
                type="button"
                onClick={() => setPreviewPaperWidth("80mm")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  previewPaperWidth === "80mm"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                80mm (48 Kolon)
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* Combination Selector Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-xs text-foreground">
                Örnek Sipariş Senaryosu:
              </span>
              <span className="text-[11px] text-muted-foreground">
                {selectedCombination.description}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_COMBINATIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCombinationId(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedCombinationId === c.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Document Type Selector Buttons */}
          <div className="flex flex-wrap gap-2 pt-1 border-t">
            <Button
              type="button"
              size="sm"
              variant={previewDocType === "CUSTOMER" ? "default" : "outline"}
              onClick={() => setPreviewDocType("CUSTOMER")}
              className="h-8 text-xs gap-1.5 font-bold"
            >
              <ReceiptTextIcon className="size-3.5" />
              Müşteri &amp; Paket Fişi
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewDocType === "COURIER" ? "default" : "outline"}
              onClick={() => setPreviewDocType("COURIER")}
              className="h-8 text-xs gap-1.5 font-bold"
            >
              <BikeIcon className="size-3.5" />
              Kurye Teslimat Fişi
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewDocType === "KITCHEN" ? "default" : "outline"}
              onClick={() => setPreviewDocType("KITCHEN")}
              className="h-8 text-xs gap-1.5 font-bold"
            >
              <UtensilsCrossedIcon className="size-3.5" />
              Mutfak Sipariş Fişi (KOT)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewDocType === "MERCHANT" ? "default" : "outline"}
              onClick={() => setPreviewDocType("MERCHANT")}
              className="h-8 text-xs gap-1.5 font-bold"
            >
              <BuildingIcon className="size-3.5" />
              İşletme Kopyası
            </Button>
          </div>

          {/* Thermal Receipt Simulator Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-lg border border-dashed">
            <div
              className={`w-full bg-white text-neutral-900 border border-neutral-300 shadow-md p-4 rounded font-mono text-[11px] leading-relaxed select-all overflow-x-auto transition-all ${
                previewPaperWidth === "58mm" ? "max-w-[290px]" : "max-w-[440px]"
              }`}
            >
              {/* Receipt Body - 100% Clean Clean Text */}
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-neutral-800 leading-tight">
                {previewRaw}
              </pre>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(previewRaw);
                  toast.success("Fiş metni panoya kopyalandı.");
                }}
              >
                <CopyIcon className="size-3.5" />
                Metni Kopyala
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={isPrintingSample}
                onClick={async () => {
                  setIsPrintingSample(true);
                  try {
                    const res = await PrinterClient.printRaw(
                      {
                        id: "sample-printer",
                        restaurantId: "default",
                        name: "Kasa Yazıcısı",
                        code: "CASHIER",
                        description: null,
                        color: null,
                        printerIp: null,
                        printerPort: null,
                        printerModel: null,
                        printerEnabled: true,
                        printerPaperWidth: previewPaperWidth === "58mm" ? 58 : 80,
                        printerConnectionType: "LOCAL_OS",
                        isDefault: true,
                        sortOrder: 1,
                      },
                      previewRaw,
                    );
                    if (res.success) {
                      toast.success("Örnek fiş yazıcıya gönderildi.");
                    } else {
                      toast.info("Yazıcı bağlantısı yok veya QZ Tray çevrimdışı. Tarayıcı önizlemesi açılıyor...");
                      window.print();
                    }
                  } catch {
                    window.print();
                  } finally {
                    setIsPrintingSample(false);
                  }
                }}
              >
                {isPrintingSample ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <PrinterIcon className="size-3.5" />
                )}
                Örnek Fişi Yazdır
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Installation Guide */}
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HelpCircleIcon className="size-4 text-primary" />
            Nasıl Kurulur? (Adım Adım Kurulum Rehberi)
          </CardTitle>
          <CardDescription className="text-xs">
            Netgsm santralinizi Adisyonex ile eşleştirmek için aşağıdaki adımları izleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Netgsm Hesabınıza Giriş Yapın</span>
                <p className="text-muted-foreground">
                  netgsm.com.tr adresinden müşteri panelinize giriş yapın ve &quot;Bulut Santral&quot; veya &quot;Netsipp&quot; menüsünü açın.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Santral ve API Ayarlarınızı Alın</span>
                <p className="text-muted-foreground">
                  Geliştirici / API menüsünden kullanıcı adı ve API şifrenizi öğrenip yukarıdaki forma kaydedin.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] shrink-0">
                3
              </div>
              <div className="space-y-2">
                <span className="font-semibold text-foreground">Webhook Adresini Netgsm Paneline Ekleyin</span>
                <p className="text-muted-foreground">
                  Netgsm Santral &gt; Gelişmiş Ayarlar &gt; Webhook / CDR Bildirimi alanına aşağıdaki bağlantı adresini yapıştırın:
                </p>

                <div className="flex items-center gap-2 bg-muted/60 p-2.5 rounded-md border font-mono text-[11px]">
                  <span className="truncate flex-1">{settings.webhookUrl}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyWebhookUrl}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <CopyIcon className="size-3.5" />
                    Kopyala
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] shrink-0">
                4
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">Bağlantıyı Test Edin</span>
                <p className="text-muted-foreground">
                  Yukarıdaki &quot;Bağlantıyı Test Et&quot; butonuna basarak yeşil doğrulama onayını alın. Ardından çalışma modunu &quot;Canlı Mod&quot;a alabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <IncomingCallDrawer
        call={simulatedCall}
        open={isSimDrawerOpen}
        onClose={() => setIsSimDrawerOpen(false)}
        onDismissCall={() => {
          setIsSimDrawerOpen(false);
          setSimulatedCall(null);
        }}
        onStartOrder={() => {
          setIsSimDrawerOpen(false);
          toast.success("Sipariş başlatıldı! POS ekranına yönlendiriliyorsunuz...");
          router.push("/dashboard/pos");
        }}
      />
    </div>
  );
}
