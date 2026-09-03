import { notFound, redirect } from "next/navigation";
import { KitchenDisplay } from "@/components/kitchen/kitchen-display";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { listKitchenTickets } from "@/services/kitchen.service";
import { findRestaurantById } from "@/repositories/restaurant.repository";

export const dynamic = "force-dynamic";

export default async function DashboardKitchenPage() {
  const staffCtx = await getStaffContextOrNull();
  const mgrCtx = await getManagerContextOrNull();

  const restaurantId = staffCtx?.restaurantId || mgrCtx?.restaurantId;
  if (!restaurantId) {
    redirect("/personelgiris");
  }

  const restaurant = await findRestaurantById(restaurantId);
  if (!restaurant || !restaurant.username) {
    notFound();
  }

  const tickets = await listKitchenTickets(restaurantId);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-gray-50/60 text-gray-900">
      <KitchenDisplay
        username={restaurant.username}
        restaurantName={restaurant.name}
        staffName={staffCtx?.name || "Mutfak Şefi"}
        tickets={tickets}
      />
    </div>
  );
}
