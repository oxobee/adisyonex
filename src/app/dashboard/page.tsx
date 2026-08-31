import { DashboardView } from "@/components/dashboard/dashboard-view"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { getManagerContextOrNull } from "@/lib/manager-auth"
import { getDashboard } from "@/services/dashboard.service"
import { getLowStockCount } from "@/services/stock.service"

export const dynamic = "force-dynamic";

export default async function Page() {
  const ctx = await getManagerContextOrNull()
  if (!ctx) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Kontrol Paneli"
          description="Restoranınızın genel durumu ve günlük özet."
        />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Sayıları ve raporları görmek için yöneticinizden restoranınızı tanımlamasını isteyin."
        />
      </div>
    )
  }

  const [data, lowStock] = await Promise.all([
    getDashboard(ctx.restaurantId),
    getLowStockCount(ctx.restaurantId),
  ])

  return <DashboardView data={data} lowStock={lowStock} />
}
