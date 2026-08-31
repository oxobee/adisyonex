import Link from "next/link";

import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { Delta, StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { DashboardDTO } from "@/types/dashboard";

const deltaPct = (current: number, previous: number): number | null =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

const ageClass = (mins: number | null): string =>
  mins === null
    ? ""
    : mins >= 45
      ? "text-red-700"
      : mins >= 30
        ? "text-amber-700"
        : "text-emerald-700";

const MODE_LABEL: Record<string, string> = {
  CASH: "Nakit",
  UPI: "Havale/EFT",
  CARD: "Kredi Kartı",
  OTHER: "Diğer",
};
const TYPE_LABEL: Record<string, string> = {
  DINE_IN: "Masa",
  TAKEAWAY: "Gel-Al",
  DELIVERY: "Paket Servis",
};

export function DashboardView({
  data,
  lowStock,
}: {
  readonly data: DashboardDTO;
  readonly lowStock: number;
}) {
  const paymentsTotal = data.paymentMixToday.reduce((s, m) => s + m.amount, 0);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AutoRefresh />

      {lowStock > 0 ? (
        <Link
          href="/dashboard/inventory"
          className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <span>
            <strong>{lowStock}</strong> stok kalemi kritik seviyede veya altında.
          </span>
          <span className="font-medium underline">Stoğu görüntüle</span>
        </Link>
      ) : null}

      {/* Today */}
      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">Bugün</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Bugünkü Satış"
            value={formatCurrency(data.today.sales)}
            footer={
              <Delta
                pct={deltaPct(data.today.sales, data.yesterdaySales)}
                label="düne göre"
              />
            }
          />
          <StatCard
            label="Bugünkü Siparişler"
            value={String(data.today.orders)}
            footer={
              <span className="text-muted-foreground">
                Ort. Adisyon {formatCurrency(data.today.aov)}
              </span>
            }
          />
          <StatCard
            label="Açık Siparişler"
            value={formatCurrency(data.openNow.value)}
            footer={
              <span className="text-muted-foreground">
                {data.openNow.count} açık
                {data.openNow.oldestMinutes !== null ? (
                  <>
                    {" · en eski "}
                    <span className={ageClass(data.openNow.oldestMinutes)}>
                      {data.openNow.oldestMinutes} dk
                    </span>
                  </>
                ) : null}
              </span>
            }
          />
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Bugünkü Ödemeler</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {formatCurrency(paymentsTotal)}
              </CardTitle>
            </CardHeader>
            <CardFooter className="text-sm">
              {data.paymentMixToday.length === 0 ? (
                <span className="text-muted-foreground">Henüz ödeme yok</span>
              ) : (
                <span className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                  {data.paymentMixToday.map((m) => (
                    <span key={m.mode}>
                      {MODE_LABEL[m.mode] ?? m.mode} {formatCurrency(m.amount)}
                    </span>
                  ))}
                </span>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* This month */}
      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">Bu Ay</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Aylık Satış"
            value={formatCurrency(data.month.sales)}
            footer={
              <Delta
                pct={deltaPct(data.month.sales, data.lastMonthSales)}
                label="geçen aya göre"
              />
            }
          />
          <StatCard
            label="Aylık Siparişler"
            value={String(data.month.orders)}
            footer={
              <span className="text-muted-foreground">
                Ort. Adisyon {formatCurrency(data.month.aov)}
              </span>
            }
          />
          <StatCard
            label="Dolu Masalar"
            value={`${data.occupancy.occupied}/${data.occupancy.total}`}
            footer={
              <span className="text-muted-foreground">Şu an masada</span>
            }
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Günlük Satış Trendi</CardTitle>
            <CardDescription>Bu ayın günlük tamamlanan satışları</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={data.trend} />
          </CardContent>
        </Card>
      </section>

      {/* Detail */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bugün En Çok Satanlar</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topItemsToday.length === 0 ? (
              <p className="text-muted-foreground text-sm">Bugün henüz satış yok.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {data.topItemsToday.map((it) => (
                  <li
                    key={it.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{it.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      ×{it.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Günün Özeti</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <span>KDV: {formatCurrency(data.today.tax)}</span>
              <span>İndirimler: {formatCurrency(data.today.discount)}</span>
              <span>
                İptaller:{" "}
                <span className={data.voidsToday > 0 ? "text-amber-700" : ""}>
                  {data.voidsToday}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.orderTypeToday.map((t) => (
                <span
                  key={t.type}
                  className="bg-muted rounded-full px-2.5 py-1 text-xs"
                >
                  {TYPE_LABEL[t.type]} {t.orders}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
