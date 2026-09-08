import { DashboardView } from "@/components/dashboard/dashboard-view";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getDashboard } from "@/services/dashboard.service";
import { getLowStockCount } from "@/services/stock.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Page() {
  const staffCtx = await getStaffContextOrNull();
  const mgrCtx = await getManagerContextOrNull();

  const restaurantId = staffCtx?.restaurantId || mgrCtx?.restaurantId;
  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Kontrol Paneli"
          description="Restoranınızın genel durumu ve günlük özet."
        />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Sayıları ve raporları görmek için yöneticinizden restoranınızı tanımlamasını isteyin."
        />
      </div>
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [data, lowStock, telephony] = await Promise.all([
    getDashboard(restaurantId),
    getLowStockCount(restaurantId),
    prisma.telephonyIntegration.findUnique({
      where: { restaurantId },
      select: { enabled: true, lastIncomingCallAt: true },
    }),
  ]);

  let telephonyStats: {
    enabled: boolean;
    todayPhoneOrdersCount: number;
    todayMissedCallsCount: number;
    lastIncomingCallAt?: string | null;
  } | undefined = undefined;

  if (telephony?.enabled) {
    const [phoneOrdersCount, missedCallsCount] = await Promise.all([
      prisma.order.count({
        where: {
          restaurantId,
          orderType: "DELIVERY",
          customerPhone: { not: null },
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.callSession.count({
        where: {
          restaurantId,
          status: "MISSED",
          createdAt: { gte: startOfDay },
        },
      }),
    ]);

    telephonyStats = {
      enabled: true,
      todayPhoneOrdersCount: phoneOrdersCount,
      todayMissedCallsCount: missedCallsCount,
      lastIncomingCallAt: telephony.lastIncomingCallAt?.toISOString() ?? null,
    };
  }

  return <DashboardView data={data} lowStock={lowStock} telephonyStats={telephonyStats} />;
}
