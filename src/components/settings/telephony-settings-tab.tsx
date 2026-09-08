"use client";

import { useState } from "react";
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
import type { TelephonySettingsDTO } from "@/services/telephony.service";

interface TelephonySettingsTabProps {
  readonly initialSettings: TelephonySettingsDTO;
}

export function TelephonySettingsTab({ initialSettings }: TelephonySettingsTabProps) {
  const [settings, setSettings] = useState<TelephonySettingsDTO>(initialSettings);
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [mode, setMode] = useState<"SIMULATION" | "LIVE">(initialSettings.mode);
  const [incomingNumber, setIncomingNumber] = useState(initialSettings.incomingNumber || "");
  const [sipExtension, setSipExtension] = useState(initialSettings.sipExtension || "");
  const [apiUsername, setApiUsername] = useState(initialSettings.apiUsername || "");
  const [apiPassword, setApiPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simScenario, setSimScenario] = useState<"REGISTERED" | "NEW">("REGISTERED");

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

      toast.success(
        `✓ ${simScenario === "REGISTERED" ? "Kayıtlı Müşteri" : "Yeni Müşteri"} test araması başlatıldı!`
      );

      // Dispatch global browser event for instantaneous reaction on POS screen
      window.dispatchEvent(
        new CustomEvent("telephony-simulated-call", { detail: res.data })
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
        <CardContent className="space-y-3.5">
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scenario"
                checked={simScenario === "REGISTERED"}
                onChange={() => setSimScenario("REGISTERED")}
                className="accent-primary"
              />
              <span className="font-medium text-foreground">Kayıtlı Müşteri (Ahmet Yılmaz - 0532 123 45 67)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scenario"
                checked={simScenario === "NEW"}
                onChange={() => setSimScenario("NEW")}
                className="accent-primary"
              />
              <span className="font-medium text-foreground">Yeni Müşteri (Sistemde Kayıtsız Numara)</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTriggerSimulation}
              disabled={isSimulating}
              className="gap-2 text-xs font-semibold"
            >
              {isSimulating ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <PlayIcon className="size-3.5 fill-current" />
              )}
              Test Araması Başlat
            </Button>
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
    </div>
  );
}
