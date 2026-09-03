import { notFound, redirect } from "next/navigation";
import { MenuDesignManager } from "@/components/menu-design/menu-design-manager";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { findRestaurantById } from "@/repositories/restaurant.repository";
import { getMenu } from "@/services/menu-item.service";
import { getQrMenuTheme, getQrThemeCustomization } from "@/services/restaurant-settings.service";
import { getTables } from "@/services/table.service";

export default async function MenuDesignPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    redirect("/dashboard/home");
  }

  const [restaurant, menu, currentTheme, tables, customization] = await Promise.all([
    findRestaurantById(ctx.restaurantId),
    getMenu(ctx.restaurantId),
    getQrMenuTheme(ctx.restaurantId).catch(() => "MODERN"),
    getTables(ctx.restaurantId).catch(() => []),
    getQrThemeCustomization(ctx.restaurantId).catch(() => ({
      qrPrimaryColor: "#FF5500",
      qrSecondaryColor: "#FFF7ED",
      qrSlidersEnabled: true,
      qrSliders: [],
    })),
  ]);

  if (!restaurant || restaurant.deletedAt) {
    notFound();
  }

  // Find "Masa 1" or first available active table
  const masa1 = tables.find(
    (t) =>
      t.label.trim().toLowerCase() === "masa 1" ||
      t.label.trim() === "1" ||
      t.label.toLowerCase().includes("masa 1")
  ) || tables[0];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      <MenuDesignManager
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        restaurantUsername={restaurant.username || ""}
        previewTableId={masa1?.id}
        previewTableLabel={masa1?.label || "Masa 1"}
        logoUrl={restaurant.logoUrl}
        menu={menu}
        currentTheme={currentTheme}
        initialCustomization={customization}
      />
    </div>
  );
}
