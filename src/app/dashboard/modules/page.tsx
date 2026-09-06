import { redirect } from "next/navigation";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { serializeForClient } from "@/lib/utils";
import { getRestaurantModulesStatus } from "@/services/module.service";
import { getRestaurantLicenseInfo } from "@/services/license.service";
import { DashboardModulesView } from "@/components/dashboard/dashboard-modules-view";

export const dynamic = "force-dynamic";

export default async function DashboardModulesPage() {
  const [ctx, staffCtx] = await Promise.all([
    getManagerContextOrNull().catch(() => null),
    getStaffContextOrNull().catch(() => null),
  ]);

  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId;
  if (!restaurantId) {
    redirect("/dashboard/home");
  }

  const [modules, license] = await Promise.all([
    getRestaurantModulesStatus(restaurantId),
    getRestaurantLicenseInfo(restaurantId).catch(() => null),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <DashboardModulesView
        modules={serializeForClient(modules)}
        salesRep={serializeForClient(license?.salesRep || null)}
      />
    </div>
  );
}
