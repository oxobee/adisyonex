import { MenuManager } from "@/components/menu/menu-manager"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { getManagerContextOrNull } from "@/lib/manager-auth"
import { getStaffContextOrNull } from "@/lib/staff-auth"
import { findRestaurantById } from "@/repositories/restaurant.repository"
import { getMenu } from "@/services/menu-item.service"
import { listModifierGroups } from "@/services/modifier.service"
import { listRecipes } from "@/services/recipe.service"
import { listStock } from "@/services/stock.service"

export default async function MenuPage() {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;

  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Menü Yönetimi"
          description="Kategorileri, yemekleri, fiyatları ve bulunabilirlik durumlarını yönetin."
        />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Menünüzü oluşturmaya başlamak için bir yöneticiden restoranınızı tanımlamasını isteyin."
        />
      </div>
    )
  }

  const [menu, groups, restaurant, stockItems, recipes] = await Promise.all([
    getMenu(restaurantId),
    listModifierGroups(restaurantId),
    findRestaurantById(restaurantId),
    listStock(restaurantId),
    listRecipes(restaurantId),
  ])

  return (
    <MenuManager
      menu={menu}
      groups={groups}
      gstRegistered={restaurant?.gstRegistrationType !== "UNREGISTERED"}
      stockItems={stockItems.filter((s) => s.isActive)}
      recipes={recipes}
      initialShowItemImages={restaurant?.showItemImages ?? true}
    />
  )
}
