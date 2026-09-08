"use client";

import {
  GlobeIcon,
  LayersIcon,
  PhoneCallIcon,
  QrCodeIcon,
  Share2Icon,
  ShoppingBagIcon,
  StoreIcon,
  UserPlusIcon,
  InfoIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CUSTOMER_SOURCES,
  ORDER_CHANNELS,
  MARKETPLACE_PROVIDERS,
} from "@/lib/order-channels";

export function ChannelsSettingsTab() {
  return (
    <div className="space-y-6">
      {/* 1. MİMARİ AÇIKLAMA KARTI */}
      <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
              <InfoIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-foreground">
                Müşteri Kaynağı ve Sipariş Kanalı Ayrımı
              </CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground leading-relaxed">
                Oxonom POS mimarisinde <strong>Müşteri Kaynağı</strong> ile{" "}
                <strong>Sipariş Kanalı</strong> birbirine karıştırılmaz ve ayrı olarak takip edilir:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">👤 Müşteri Kaynağı (Kalıcı)</span>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                  Sabit Kalır
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Müşterinin işletmenizle <strong>ilk kez hangi kanal üzerinden</strong> tanıştığını ve sisteme kaydedildiğini belirtir. Örneğin müşteri sisteme ilk kez telefonla sipariş vererek geldiyse, müşteri kaynağı &quot;Telefon&quot; olarak sabit kalır.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">📦 Sipariş Kanalı (Dinamik)</span>
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px]">
                  Her Siparişte Farklı
                </Badge>
              </div>
              <p className="text-muted-foreground">
                İlgili siparişin <strong>o an hangi kanaldan geldiğini</strong> gösterir. Telefonla ilk kaydı açılmış bir müşteri daha sonra Web Sitesinden veya Masada QR okutarak sipariş verebilir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. MÜŞTERİ KAYNAKLARI LİSTESİ */}
      <Card className="rounded-2xl border border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <UserPlusIcon className="size-4.5 text-primary" />
                <span>Tanımlı Müşteri Kaynakları</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Müşteri kartlarında ve müşteri raporlarında kullanılan edinim kanalları.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {CUSTOMER_SOURCES.length} Kaynak
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {CUSTOMER_SOURCES.map((src) => (
              <div
                key={src.id}
                className="p-3 rounded-xl border bg-muted/20 space-y-1 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{src.icon}</span>
                    <span className="text-xs font-bold text-foreground">{src.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${src.badgeClass}`}>
                    {src.id}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {src.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. SİPARİŞ KANALLARI VE ENTEGRASYONLAR */}
      <Card className="rounded-2xl border border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <LayersIcon className="size-4.5 text-primary" />
                <span>Sipariş Kanalları & Pazaryerleri</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Siparişlerin giriş yaptığı satış kanalları ve entegrasyon sağlayıcıları.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {ORDER_CHANNELS.length} Kanal
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ORDER_CHANNELS.map((ch) => (
              <div
                key={ch.id}
                className="p-3 rounded-xl border bg-muted/20 space-y-1 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ch.icon}</span>
                    <span className="text-xs font-bold text-foreground">{ch.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${ch.badgeClass}`}>
                    {ch.id}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {ch.description}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t">
            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <ShoppingBagIcon className="size-3.5 text-primary" />
              <span>Desteklenen Pazaryeri Entegratörleri (Marketplace Providers)</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {MARKETPLACE_PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs font-bold shadow-2xs"
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>{p.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {p.id}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
