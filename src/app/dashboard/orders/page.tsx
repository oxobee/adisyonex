import { OrdersBoard } from "@/components/orders/orders-board";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getMenu } from "@/services/menu-item.service";
import { listOrders } from "@/services/order.service";
import { getTodaySales } from "@/services/sales.service";
import { getTables } from "@/services/table.service";
import { getRestaurantProfile } from "@/services/restaurant-settings.service";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);

  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;

  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader title="Anlık Durum & Masalar" description="Canlı masa adisyonları, salon doluluğu ve hesap yönetimi." />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Siparişleri takip etmeye başlamak için bir yöneticiden restoranınızı tanımlamasını isteyin."
        />
      </div>
    );
  }

  const [open, completed, sales, tables, menu, profile] = await Promise.all([
    listOrders(restaurantId, ["OPEN"]).catch(() => []),
    listOrders(restaurantId, ["COMPLETED"]).catch(() => []),
    getTodaySales(restaurantId).catch(() => ({
      orders: 0,
      gross: 0,
      tax: 0,
      discount: 0,
      voids: 0,
      byMode: [],
    })),
    getTables(restaurantId).catch(() => []),
    getMenu(restaurantId).catch(() => ({ categories: [], items: [] })),
    getRestaurantProfile(restaurantId).catch(() => null),
  ]);

  return (
    <OrdersBoard
      open={open}
      completed={completed}
      sales={sales}
      tables={tables}
      menu={menu}
      restaurantName={profile?.name || "Restoran"}
      restaurantTagline={profile?.tagline}
    />
  );
}
