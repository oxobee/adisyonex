"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CoinsIcon,
  DollarSignIcon,
  KeyIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  ServerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  Wand2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminRechargeAiCreditAction,
  testOpenRouterAction,
  updateAiSettingAction,
} from "@/actions/ai.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerAction } from "@/hooks/use-server-action";

export function AdminAiView({
  restaurants,
  stats,
  openRouterCredits,
  settings,
  models,
}: {
  restaurants: Array<{
    id: string;
    name: string;
    slug: string;
    ownerName: string | null;
    ownerPhone: string;
    balance: number;
    totalUsed: number;
  }>;
  stats: {
    totalWallets: number;
    totalActiveCredits: number;
    totalUsedCredits: number;
    totalTasks: number;
    totalProviderCostUsd: number;
  };
  openRouterCredits: {
    totalCredits: number;
    totalUsage: number;
    remainingUsd: number;
    isLowBalance: boolean;
  };
  settings: {
    openRouterApiKey: string;
    defaultVisionModel: string;
    defaultTextModel: string;
    defaultImageModel: string;
    lowBalanceThresholdUsd: number;
    maxCostPerRequestUsd: number;
  };
  models: Array<{
    id: string;
    modelId: string;
    displayName: string;
    provider: string;
    taskType: string;
    qualityLevel: string;
    creditCost: number;
    actualCostEst: number;
    isEnabled: boolean;
  }>;
}) {
  const router = useRouter();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Recharge Modal
  const [rechargeTarget, setRechargeTarget] = useState<{
    restaurantId: string;
    name: string;
  } | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [description, setDescription] = useState("Süper Yönetici Kredi Tanımlaması");

  const recharge = useServerAction(adminRechargeAiCreditAction, {
    onSuccess: () => {
      toast.success(`${rechargeTarget?.name} restoranına ${rechargeAmount} AI kredisi yüklendi!`);
      setRechargeTarget(null);
      router.refresh();
    },
    onError: (msg) => toast.error(msg || "Kredi yüklenemedi"),
  });

  const updateSetting = useServerAction(updateAiSettingAction, {
    onSuccess: () => {
      toast.success("OpenRouter ayarları güncellendi!");
      setApiKeyInput("");
      router.refresh();
    },
    onError: (msg) => toast.error(msg || "Ayar güncellenemedi"),
  });

  const handleTestKey = async () => {
    setIsTestingKey(true);
    try {
      const res = await testOpenRouterAction(apiKeyInput || undefined);
      if (res.success && res.data && res.data.valid) {
        toast.success(`OpenRouter bağlantısı başarılı! (${res.data.label})`);
      } else {
        const err = !res.success ? res.error : res.data?.error;
        toast.error(err || "Bağlantı kurulamadı.");
      }
    } catch {
      toast.error("Bağlantı testi başarısız oldu.");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRefreshBalance = () => {
    setIsRefreshingBalance(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshingBalance(false);
      toast.success("OpenRouter bakiyesi güncellendi!");
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Yapay Zeka Stüdyo & OpenRouter Yönetimi"
          description="OpenRouter API bağlantısını, canlı bakiyeyi, modelleri, maliyetleri ve restoran AI kredilerini yönetin."
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold gap-1.5"
            disabled={isRefreshingBalance}
            onClick={handleRefreshBalance}
          >
            <RefreshCwIcon className={`size-3.5 ${isRefreshingBalance ? "animate-spin" : ""}`} />
            Bakiyeyi Yenile
          </Button>
        </div>
      </div>

      {/* OPENROUTER LIVE BALANCE & STATUS BANNER */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* Balance Card */}
        <Card className="md:col-span-4 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                OpenRouter Canlı Bakiye
              </span>
              <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                API Aktif
              </Badge>
            </div>
            <p className="text-3xl font-black text-foreground tabular-nums mt-2">
              ${openRouterCredits.remainingUsd.toFixed(4)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>Toplam Kredi: ${openRouterCredits.totalCredits.toFixed(2)}</span>
              <span>·</span>
              <span>Harcanan: ${openRouterCredits.totalUsage.toFixed(4)}</span>
            </div>
          </div>

          {openRouterCredits.isLowBalance && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-semibold">
              <AlertTriangleIcon className="size-4 shrink-0" />
              <span>OpenRouter bakiyeniz eşik değerin altında ($5.00).</span>
            </div>
          )}
        </Card>

        {/* Global Statistics Cards */}
        <div className="md:col-span-8 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border p-4 bg-card shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Kullanılan Toplam Kredi</span>
              <CoinsIcon className="size-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black tabular-nums mt-2 text-amber-600 dark:text-amber-400">
              {stats.totalUsedCredits.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground">Tüm restoranların harcamaları</span>
          </Card>

          <Card className="rounded-2xl border p-4 bg-card shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Toplam AI Görevleri</span>
              <SparklesIcon className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-black tabular-nums mt-2 text-foreground">
              {stats.totalTasks}
            </p>
            <span className="text-[10px] text-muted-foreground">OCR, Görsel ve Metin Görevi</span>
          </Card>

          <Card className="rounded-2xl border p-4 bg-card shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Gerçek API Maliyeti</span>
              <DollarSignIcon className="size-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black tabular-nums mt-2 text-emerald-600 dark:text-emerald-400">
              ${stats.totalProviderCostUsd.toFixed(4)}
            </p>
            <span className="text-[10px] text-muted-foreground">OpenRouter fiili maliyet</span>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="restaurants" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-2xl p-1">
          <TabsTrigger value="restaurants" className="rounded-xl text-xs font-bold gap-2">
            <UsersIcon className="size-4" /> Krediler
          </TabsTrigger>
          <TabsTrigger value="models" className="rounded-xl text-xs font-bold gap-2">
            <ServerIcon className="size-4" /> Modeller
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl text-xs font-bold gap-2">
            <KeyIcon className="size-4" /> API Ayarları
          </TabsTrigger>
        </TabsList>

        {/* RESTAURANTS CREDIT MANAGEMENT TAB */}
        <TabsContent value="restaurants" className="mt-4">
          <Card className="rounded-3xl border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Restoran AI Kredi Bakiyeleri</CardTitle>
              <CardDescription className="text-xs">
                Restoranlara özel ek kredi tanımlayabilir veya mevcut bakiyeleri düzenleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/40 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3.5">Restoran Adı</th>
                      <th className="p-3.5">Yönetici / Telefon</th>
                      <th className="p-3.5 text-right">Mevcut Kredi</th>
                      <th className="p-3.5 text-right">Kullanılan Kredi</th>
                      <th className="p-3.5 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {restaurants.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">
                          {r.name}
                          <span className="block text-[10px] font-normal text-muted-foreground">/{r.slug}</span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {r.ownerName ?? "—"} ({r.ownerPhone})
                        </td>
                        <td className="p-3.5 text-right font-black tabular-nums text-amber-600 dark:text-amber-400">
                          {r.balance} Kredi
                        </td>
                        <td className="p-3.5 text-right tabular-nums text-muted-foreground">
                          {r.totalUsed} Kredi
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                            onClick={() => {
                              setRechargeTarget({ restaurantId: r.id, name: r.name });
                              setRechargeAmount(100);
                            }}
                          >
                            <PlusIcon className="size-3.5" /> Kredi Ekle / Çıkar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODELS & QUALITY TIERS PRICING TAB */}
        <TabsContent value="models" className="mt-4">
          <Card className="rounded-3xl border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Dinamik Model & Kredi Fiyatlandırma Tablosu</CardTitle>
              <CardDescription className="text-xs">
                Frontend kodunu değiştirmeden kalite seviyelerini OpenRouter modellerine bağlayın ve kredi bedellerini belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/40 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3.5">İşlem Türü</th>
                      <th className="p-3.5">Kalite Seviyesi</th>
                      <th className="p-3.5">OpenRouter Model ID</th>
                      <th className="p-3.5">Sağlayıcı</th>
                      <th className="p-3.5 text-right">Kullanıcı Kredisi</th>
                      <th className="p-3.5 text-right">Tahmini Maliyet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {models.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">
                          {m.taskType}
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {m.qualityLevel}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-foreground">
                          {m.modelId}
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {m.provider}
                        </td>
                        <td className="p-3.5 text-right font-black tabular-nums text-amber-600 dark:text-amber-400">
                          {m.creditCost} Kredi
                        </td>
                        <td className="p-3.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                          ${m.actualCostEst.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API SETTINGS & KEY MANAGEMENT TAB */}
        <TabsContent value="settings" className="mt-4">
          <Card className="rounded-3xl border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">OpenRouter API Bağlantı & Güvenlik Ayarları</CardTitle>
              <CardDescription className="text-xs">
                API anahtarı yalnızca sunucu tarafında şifreli olarak saklanır, istemciye kesinlikle sızdırılmaz.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-6 max-w-xl">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">Aktif OpenRouter API Anahtarı</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder={settings.openRouterApiKey || "sk-or-v1-..."}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="rounded-xl font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold shrink-0 gap-1.5"
                    disabled={isTestingKey}
                    onClick={handleTestKey}
                  >
                    {isTestingKey ? <Loader2Icon className="size-3.5 animate-spin" /> : <ShieldCheckIcon className="size-3.5" />}
                    Test Et
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Yeni bir API anahtarı girmek istemiyorsanız boş bırakabilirsiniz.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Düşük Bakiye Uyarısı ($)</label>
                  <Input
                    type="number"
                    defaultValue={settings.lowBalanceThresholdUsd}
                    className="rounded-xl font-bold tabular-nums"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">Maks. İstek Maliyet Limiti ($)</label>
                  <Input
                    type="number"
                    defaultValue={settings.maxCostPerRequestUsd}
                    className="rounded-xl font-bold tabular-nums"
                  />
                </div>
              </div>

              <Button
                className="h-11 rounded-xl font-bold bg-primary text-primary-foreground"
                disabled={updateSetting.isPending || (!apiKeyInput && true)}
                onClick={() =>
                  updateSetting.execute({
                    openRouterApiKey: apiKeyInput || undefined,
                  })
                }
              >
                {updateSetting.isPending ? "Kaydediliyor…" : "Ayarları Kaydet"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* RECHARGE DIALOG */}
      {rechargeTarget ? (
        <Dialog open onOpenChange={(open) => !open && setRechargeTarget(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6">
            <DialogHeader>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 mx-auto mb-2">
                <SparklesIcon className="size-6" />
              </div>
              <DialogTitle className="text-center font-black">
                {rechargeTarget.name}
              </DialogTitle>
              <DialogDescription className="text-center text-xs">
                Kredi eklemek için pozitif (örn: 500), çıkarmak için negatif (örn: -100) miktar girin.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 my-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-foreground">Kredi Miktarı</label>
                <Input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(parseInt(e.target.value, 10) || 0)}
                  className="rounded-xl font-bold tabular-nums"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-foreground">Açıklama / Sebep</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-center">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold"
                onClick={() => setRechargeTarget(null)}
              >
                Vazgeç
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold bg-primary text-primary-foreground"
                disabled={recharge.isPending || rechargeAmount === 0}
                onClick={() =>
                  recharge.execute({
                    restaurantId: rechargeTarget.restaurantId,
                    amount: rechargeAmount,
                    description,
                  })
                }
              >
                {recharge.isPending ? "İşleniyor…" : "Onayla"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
