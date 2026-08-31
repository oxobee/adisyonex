import { OrdersBoard } from "@/components/orders/orders-board";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getMenu } from "@/services/menu-item.service";
import { listOrders } from "@/services/order.service";
import { getTodaySales } from "@/services/sales.service";
import { getTables } from "@/services/table.service";

export default async function OrdersPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader title="Siparişler & Masalar" description="Canlı masa adisyonları, salon doluluğu ve hesap yönetimi." />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Siparişleri takip etmeye başlamak için bir yöneticiden restoranınızı tanımlamasını isteyin."
        />
      </div>
    );
  }

  const [open, completed, sales, tables, menu] = await Promise.all([
    listOrders(ctx.restaurantId, ["OPEN"]),
    listOrders(ctx.restaurantId, ["COMPLETED"]),
    getTodaySales(ctx.restaurantId),
    getTables(ctx.restaurantId),
    getMenu(ctx.restaurantId),
  ]);

  return (
    <OrdersBoard
      open={open}
      completed={completed}
      sales={sales}
      tables={tables}
      menu={menu}
    />
  );
}
