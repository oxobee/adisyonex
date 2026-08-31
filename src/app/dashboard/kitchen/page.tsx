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
    <div className="flex-1 space-y-4 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>🍳 Mutfak Ekranı & KOT</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Mutfakta hazırlanan yemekleri anlık takip edin ve durumlarını güncelleyin.
          </p>
        </div>
      </div>

      <KitchenDisplay
        username={restaurant.username}
        restaurantName={restaurant.name}
        staffName={staffCtx?.name || "Mutfak Şefi"}
        tickets={tickets}
      />
    </div>
  );
}
