"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CoinsIcon,
  PlusIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { adminRechargeAiCreditAction } from "@/actions/ai.actions";
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
import { useServerAction } from "@/hooks/use-server-action";

export function AdminAiView({
  restaurants,
  stats,
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
  };
}) {
  const router = useRouter();
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

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Yapay Zeka Stüdyo & Kredi Yönetimi"
          description="Sistemdeki tüm restoranların AI kredi bakiyelerini, kullanım istatistiklerini ve OpenRouter modellerini yönetin."
        />
      </div>

      {/* Global Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border p-4 bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold">Aktif Cüzdanlar</p>
            <UsersIcon className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-black tabular-nums mt-1 text-foreground">
            {stats.totalWallets}
          </p>
        </Card>

        <Card className="rounded-2xl border p-4 bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold">Toplam Dağıtılan Kredi</p>
            <CoinsIcon className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black tabular-nums mt-1 text-amber-600 dark:text-amber-400">
            {stats.totalActiveCredits}
          </p>
        </Card>

        <Card className="rounded-2xl border p-4 bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold">Kullanılan Toplam Kredi</p>
            <TrendingUpIcon className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black tabular-nums mt-1 text-emerald-600 dark:text-emerald-400">
            {stats.totalUsedCredits}
          </p>
        </Card>

        <Card className="rounded-2xl border p-4 bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-semibold">Toplam AI Görevleri</p>
            <SparklesIcon className="size-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black tabular-nums mt-1 text-foreground">
            {stats.totalTasks}
          </p>
        </Card>
      </div>

      {/* Restaurants Table */}
      <Card className="rounded-3xl border">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold">Restoran Kredi Bakiyeleri</CardTitle>
          <CardDescription className="text-xs">
            Restoranlara özel ek kredi tanımlayabilir veya mevcut bakiyeleri görüntüleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 text-muted-foreground font-bold">
                <tr>
                  <th className="p-3.5">Restoran Adı</th>
                  <th className="p-3.5">Yönetici / Telefon</th>
                  <th className="p-3.5 text-right">Kalan Kredi</th>
                  <th className="p-3.5 text-right">Harcanan Kredi</th>
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
                        <PlusIcon className="size-3.5" /> Kredi Yükle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                Restorana tanımlanacak AI kredi miktarını girin.
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
                <label className="text-xs font-bold text-foreground">Açıklama</label>
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
                disabled={recharge.isPending || rechargeAmount <= 0}
                onClick={() =>
                  recharge.execute({
                    restaurantId: rechargeTarget.restaurantId,
                    amount: rechargeAmount,
                    description,
                  })
                }
              >
                {recharge.isPending ? "Yükleniyor…" : "Kredi Yükle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
