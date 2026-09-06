import { ModulesGrid } from "@/components/admin/modules-grid";
import { PageHeader } from "@/components/shared/page-header";
import { requireSuperAdminPage } from "@/lib/admin-auth";
import { serializeForClient } from "@/lib/utils";
import { listSystemModulesWithStats } from "@/services/module.service";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  await requireSuperAdminPage();

  const modules = await listSystemModulesWithStats().catch((error) => {
    console.error("Failed to load system modules:", error);
    return [];
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Modüller & Eklentiler"
        description="Platformdaki tüm akıllı özellikleri, yapay zeka araçlarını ve modülleri yönetin. Fiyatlandırın, genel durumunu belirleyin ve kullanım istatistiklerini takip edin."
      />

      <ModulesGrid modules={serializeForClient(modules)} />
    </div>
  );
}
