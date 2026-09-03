import { CustomersTable } from "@/components/customers/customers-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getBirthdayAutomation, listCustomers } from "@/services/customer.service";

export default async function CustomersPage() {
  const ctx = await getManagerContextOrNull();
  if (!ctx) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Kayıtlı Müşteriler"
          description="QR menü ve kampanyalardan kaydolan müşterileri ve doğum günlerini takip edin."
        />
        <EmptyState
          title="Restoran bulunamadı"
          description="Müşterileri görüntülemek için geçerli bir restoran oturumuna sahip olmalısınız."
        />
      </div>
    );
  }

  const [{ items }, birthdayAutomation] = await Promise.all([listCustomers(ctx.restaurantId, {
    page: 1,
    pageSize: 100,
  }), getBirthdayAutomation(ctx.restaurantId)]);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Kayıtlı Müşteriler"
        description="QR menüden doğum günü ve özel kampanyalara kaydolan müşterilerin listesi."
      />
      <CustomersTable initialCustomers={items} birthdayAutomation={birthdayAutomation} />
    </div>
  );
}
