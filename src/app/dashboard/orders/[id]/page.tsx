import { notFound } from "next/navigation";

import { OrderDetail } from "@/components/orders/order-detail";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getMenu } from "@/services/menu-item.service";
import { getOrder } from "@/services/order.service";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;
  if (!restaurantId) {
    notFound();
  }
  const { id } = await params;
  const order = await getOrder(restaurantId, id).catch(() => null);
  if (!order) {
    notFound();
  }
  const menu = await getMenu(restaurantId);

  return <OrderDetail order={order} menu={menu} />;
}
