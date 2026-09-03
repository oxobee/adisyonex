import { TablesManager } from "@/components/tables/tables-manager";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getSelfOrderShareInfo } from "@/services/restaurant-settings.service";
import { listTablesForManager } from "@/services/table.service";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);

  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;

  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Masalar"
          description="Garsonların masada servis siparişleri açabilmesi için salon planını düzenleyin."
        />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Masa eklemeye başlamak için bir yöneticiden restoranınızı tanımlamasını isteyin."
        />
      </div>
    );
  }

  const [tables, share] = await Promise.all([
    listTablesForManager(restaurantId),
    getSelfOrderShareInfo(restaurantId),
  ]);

  return (
    <TablesManager
      tables={tables}
      username={share.username}
      selfOrderEnabled={share.enabled}
    />
  );
}
