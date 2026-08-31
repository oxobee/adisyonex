"use client";

import Link from "next/link";
import {
  BookOpenIcon,
  ClockIcon,
  FlameIcon,
  ImageIcon,
  PenToolIcon,
  PlusIcon,
  SparklesIcon,
  Wand2Icon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import type {
  AiCreditTransactionDTO,
  AiCreditWalletDTO,
  AiTaskDTO,
} from "@/types/ai";

export function AiStudioView({
  wallet,
  transactions,
  tasks,
}: {
  wallet: AiCreditWalletDTO;
  transactions: AiCreditTransactionDTO[];
  tasks: AiTaskDTO[];
}) {
  const tools = [
    {
      title: "Menü Dijitalleştirici (OCR)",
      description: "Menü fotoğrafı veya PDF yükleyin. Yapay zeka tüm ürünleri, fiyatları, kategorileri ve seçenekleri otomatik çıkarsın.",
      icon: BookOpenIcon,
      href: "/dashboard/ai-studio/menu-import",
      cost: "10 Kredi / Sayfa",
      badge: "En Popüler",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-500",
    },
    {
      title: "AI Menü Metin Yazarı",
      description: "Ürünleriniz için iştah açıcı açıklamalar, kalori tahminleri, alerjen analizleri ve pazarlama etiketleri üretin.",
      icon: PenToolIcon,
      href: "/dashboard/ai-studio/copywriter",
      cost: "2 Kredi / Ürün",
      badge: "Hızlı & Pratik",
      color: "from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-500",
    },
    {
      title: "Yemek Fotoğrafı & Görsel Stüdyosu",
      description: "Ürünleriniz için profesyonel stüdyo aydınlatmalı, Michelin yıldızı kalitesinde ultra detaylı görsel promptları oluşturun.",
      icon: ImageIcon,
      href: "/dashboard/ai-studio/image-studio",
      cost: "1 Kredi / Prompt",
      badge: "Görsel Tasarım",
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-500",
    },
    {
      title: "İşlem Geçmişi & Kredi Hareketleri",
      description: "Daha önce ürettiğiniz menü taslaklarını, AI loglarını ve kredi harcama dökümünüzü inceleyin.",
      icon: ClockIcon,
      href: "/dashboard/ai-studio/history",
      cost: "Ücretsiz",
      badge: "Log & Rapor",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Top Header with Credit Wallet Widget */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Yapay Zeka Stüdyosu"
          description="Restoranınızın menüsünü, görsellerini ve pazarlama metinlerini yapay zeka gücüyle saniyeler içinde oluşturun."
        />

        {/* Credit Badge Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-3.5 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-black shadow-sm">
            <SparklesIcon className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              AI Kredi Bakiyesi
            </p>
            <p className="text-xl font-black text-foreground tabular-nums">
              {wallet.balance} <span className="text-xs font-normal text-muted-foreground">Kredi</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid of AI Tools */}
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full rounded-2xl border border-border/80 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md group-hover:scale-[1.01]">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${tool.color} shadow-xs`}
                  >
                    <tool.icon className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-medium">
                      Maliyet: {tool.cost}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {tool.badge}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  {tool.description}
                </CardDescription>
                <div className="mt-4 flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Stüdyoya Git ➔
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent AI Tasks Overview */}
      {tasks.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border p-4 bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Wand2Icon className="size-4 text-amber-500" />
              Son Yapay Zeka İşlemleri
            </h3>
            <Link
              href="/dashboard/ai-studio/history"
              className="text-xs font-bold text-primary hover:underline"
            >
              Tümünü Gör ({tasks.length})
            </Link>
          </div>

          <div className="divide-y">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {task.type === "MENU_DIGITIZATION"
                        ? "Menü Dijitalleştirme"
                        : task.type === "ITEM_DESCRIPTION"
                          ? "Ürün Metin Yazarlığı"
                          : "Görsel Prompt Stüdyosu"}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {formatTime(task.createdAt)} · {task.modelUsed ?? "AI Engine"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    -{task.creditsSpent} Kredi
                  </Badge>
                  <Badge
                    variant={task.status === "COMPLETED" ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {task.status === "COMPLETED" ? "Tamamlandı" : task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
