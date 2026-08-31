import { HeadphonesIcon } from "lucide-react";
import { SalesRepsView } from "@/components/admin/sales-reps-view";
import { PageHeader } from "@/components/shared/page-header";
import { serializeForClient } from "@/lib/utils";
import { listSalesReps } from "@/services/sales-rep.service";

export const dynamic = "force-dynamic";

export default async function AdminSalesRepsPage() {
  let salesReps: any[] = [];
  try {
    salesReps = await listSalesReps();
  } catch (e) {
    console.error("Failed to list sales reps:", e);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Satış & Müşteri Temsilcileri"
        description="Müşterilere atanacak satış temsilcilerini, iletişim bilgilerini ve çalışma saatlerini yönetin."
      />
      <SalesRepsView salesReps={serializeForClient(salesReps)} />
    </div>
  );
}
