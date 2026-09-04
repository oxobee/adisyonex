import { PosTerminal } from "@/components/pos/pos-terminal";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { getMenu } from "@/services/menu-item.service";
import { listOrders } from "@/services/order.service";
import { getServiceOptions } from "@/services/restaurant-settings.service";
import { getTables } from "@/services/table.service";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);

  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;

  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader title="Kasa / POS" description="Sipariş alın ve mutfağa iletin." />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Sipariş almaya başlamak için bir yöneticiden restoranınızı tanımlamasını isteyin."
        />
      </div>
    );
  }

  const [menu, tables, openOrders, services, restaurant] = await Promise.all([
    getMenu(restaurantId),
    getTables(restaurantId),
    listOrders(restaurantId, ["OPEN"]),
    getServiceOptions(restaurantId),
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true },
    }),
  ]);

  const occupied: Record<string, string> = {};
  for (const order of openOrders) {
    if (order.tableId) {
      occupied[order.tableId] = order.id;
    }
  }

  return (
    <PosTerminal
      menu={menu}
      tables={tables}
      occupied={occupied}
      services={services}
      cashierName={staffCtx?.name || "Kasa Yetkilisi"}
      restaurantName={restaurant?.name || "Adisyoon"}
    />
  );
}
