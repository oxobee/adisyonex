import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ReservationsManagementView } from "@/components/reservations/reservations-management-view";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import {
  getReservationStats,
  listReservations,
} from "@/services/reservation.service";
import { listTablesForManager } from "@/services/table.service";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);

  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;

  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Masa Rezervasyonları"
          description="Telefon, POS ve online kanallardan gelen masa rezervasyonlarını yönetin."
        />
        <EmptyState
          title="Restoran oturumu bulunamadı"
          description="Rezervasyonları görüntülemek ve yönetmek için geçerli bir restoran oturumuna sahip olmalısınız."
        />
      </div>
    );
  }

  const [reservations, stats, tables] = await Promise.all([
    listReservations(restaurantId),
    getReservationStats(restaurantId),
    listTablesForManager(restaurantId),
  ]);

  return (
    <ReservationsManagementView
      initialReservations={reservations}
      initialStats={stats}
      tables={tables}
    />
  );
}
