import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StaffManager } from "@/components/staff/staff-manager";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { listStaff } from "@/services/staff.service";

export default async function StaffPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Personel Yönetimi"
          description="Restoranınızda çalışan personelleri ve erişim yetkilerini yönetin."
        />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Personel eklemeye başlamak için bir yöneticiden restoranınızı tanımlamasını isteyin."
        />
      </div>
    );
  }

  const staff = await listStaff(ctx.restaurantId);
  return <StaffManager staff={staff} />;
}
