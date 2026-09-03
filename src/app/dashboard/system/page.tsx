import { redirect } from "next/navigation";
import { SystemHub } from "@/components/system/system-hub";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getLowStockCount } from "@/services/stock.service";
import { getTurkeyDayRange } from "@/services/z-report.service";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  const staffCtx = await getStaffContextOrNull().catch(() => null);
  const mgrCtx = await getManagerContextOrNull().catch(() => null);

  const restaurantId = staffCtx?.restaurantId || mgrCtx?.restaurantId;
  if (!restaurantId) {
    redirect("/login");
  }

  const { dayStart, dayEnd } = getTurkeyDayRange();

  const [restaurant, tableCount, staffCount, lowStockCount, todayZReport] =
    await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { name: true },
      }),
      prisma.diningTable.count({
        where: { restaurantId },
      }),
      prisma.staff.count({
        where: { restaurantId, deletedAt: null, status: "ACTIVE" },
      }),
      getLowStockCount(restaurantId).catch(() => 0),
      prisma.zReport.findFirst({
        where: {
          restaurantId,
          reportDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: { zNumberFormatted: true },
      }),
    ]);

  const stats = {
    tableCount,
    staffCount,
    lowStockCount,
    isDayClosed: !!todayZReport,
    zNumberFormatted: todayZReport?.zNumberFormatted || null,
    restaurantName: restaurant?.name || "AdisyonEx Restoran",
  };

  return <SystemHub stats={stats} allowedRoutes={staffCtx?.allowedRoutes} />;
}
