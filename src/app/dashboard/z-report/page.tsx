import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ZReportView } from "@/components/z-report/z-report-view";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { getZReportData, listHistoricalZReports } from "@/services/z-report.service";

export const dynamic = "force-dynamic";

export default async function ZReportPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ date?: string; zId?: string }>;
}) {
  const staffCtx = await getStaffContextOrNull().catch(() => null);
  const mgrCtx = await getManagerContextOrNull().catch(() => null);

  const restaurantId = staffCtx?.restaurantId || mgrCtx?.restaurantId;
  if (!restaurantId) {
    redirect("/login");
  }

  // Yetkilendirme Denetimi (Normal garsonların erişimini engelle)
  if (staffCtx) {
    const isAuthorized =
      staffCtx.role === "MANAGEMENT" ||
      staffCtx.allowedRoutes?.includes("/dashboard/z-report");
    if (!isAuthorized) {
      return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
          <PageHeader
            title="Erişim Yetkisi Yok"
            description="Bu sayfayı görüntüleme yetkiniz bulunmamaktadır."
          />
          <EmptyState
            title="Yetkisiz Erişim"
            description="Z Raporu ve Gün Sonu ekranı yalnızca işletme yöneticisi ve yetkilendirilmiş personel tarafından görüntülenebilir."
          />
        </div>
      );
    }
  }

  const { date, zId } = await searchParams;

  const [report, history] = await Promise.all([
    getZReportData(restaurantId, date, zId),
    listHistoricalZReports(restaurantId),
  ]);

  return <ZReportView report={report} history={history} />;
}
