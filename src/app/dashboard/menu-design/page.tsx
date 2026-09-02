import { notFound, redirect } from "next/navigation";
import { MenuDesignManager } from "@/components/menu-design/menu-design-manager";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { findRestaurantById } from "@/repositories/restaurant.repository";
import { getMenu } from "@/services/menu-item.service";
import { getQrMenuTheme } from "@/services/restaurant-settings.service";

export default async function MenuDesignPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/dashboard/orders");
  }

  const [restaurant, menu, currentTheme] = await Promise.all([
    findRestaurantById(ctx.restaurantId),
    getMenu(ctx.restaurantId),
    getQrMenuTheme(ctx.restaurantId).catch(() => "MODERN"),
  ]);

  if (!restaurant || restaurant.deletedAt) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      <MenuDesignManager
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        restaurantUsername={restaurant.username || ""}
        logoUrl={restaurant.logoUrl}
        menu={menu}
        currentTheme={currentTheme}
      />
    </div>
  );
}
