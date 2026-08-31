"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  ClockIcon,
  CoinsIcon,
  SparklesIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTime } from "@/lib/format";
import type {
  AiCreditTransactionDTO,
  AiCreditWalletDTO,
  AiTaskDTO,
} from "@/types/ai";

export function AiHistoryView({
  wallet,
  transactions,
  tasks,
}: {
  wallet: AiCreditWalletDTO;
  transactions: AiCreditTransactionDTO[];
  tasks: AiTaskDTO[];
}) {
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
            title="İşlem Geçmişi & Kredi Hareketleri"
            description="Geçmiş yapay zeka üretimlerinizi ve kredi harcama dökümünüzü inceleyin."
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2">
          <SparklesIcon className="size-4 text-amber-500" />
          <span className="text-xs font-bold text-foreground">
            Bakiye: <strong>{wallet.balance} Kredi</strong>
          </span>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full max-w-xs grid-cols-2 rounded-2xl p-1">
          <TabsTrigger value="tasks" className="rounded-xl text-xs font-bold gap-2">
            <ClockIcon className="size-4" /> AI Görevleri
          </TabsTrigger>
          <TabsTrigger value="credits" className="rounded-xl text-xs font-bold gap-2">
            <CoinsIcon className="size-4" /> Kredi Logları
          </TabsTrigger>
        </TabsList>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="mt-4">
          <Card className="rounded-3xl border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Tamamlanan & İşlenen Görevler</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground p-8 text-center text-xs">
                  Henüz kaydedilmiş bir yapay zeka görevi bulunmuyor.
                </p>
              ) : (
                <div className="divide-y">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {task.type === "MENU_DIGITIZATION"
                              ? "Menü Dijitalleştirme"
                              : task.type === "ITEM_DESCRIPTION"
                                ? "Ürün Açıklaması Yazarlığı"
                                : "Görsel Prompt Stüdyosu"}
                          </span>
                          <Badge
                            variant={task.status === "COMPLETED" ? "default" : "destructive"}
                            className="text-[10px]"
                          >
                            {task.status === "COMPLETED" ? "Başarılı" : task.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                          Model: {task.modelUsed ?? "OpenRouter Engine"} · {formatTime(task.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                          -{task.creditsSpent} Kredi
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CREDITS TAB */}
        <TabsContent value="credits" className="mt-4">
          <Card className="rounded-3xl border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Kredi Harcama & Yükleme Dökümü</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground p-8 text-center text-xs">
                  Henüz kredi hareketi bulunmuyor.
                </p>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground">
                          {tx.description ?? tx.action}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {formatTime(tx.createdAt)}
                        </span>
                      </div>

                      <span
                        className={`font-black tabular-nums ${
                          tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Kredi
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
