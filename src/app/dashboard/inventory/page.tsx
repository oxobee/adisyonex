import { InventoryManager } from "@/components/inventory/inventory-manager";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { listStock } from "@/services/stock.service";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);

  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;

  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Stok & Hammadde"
          description="Restorandaki hammadde, malzeme ve stok durumunu takip edin."
        />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Stok takibine başlamak için bir yöneticiden restoranınızı tanımlamasını isteyin."
        />
      </div>
    );
  }

  const items = await listStock(restaurantId);
  return <InventoryManager items={items} />;
}
