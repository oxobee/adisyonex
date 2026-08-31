import { SystemSettingsForm } from "@/components/admin/system-settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { getSystemSettings } from "@/services/system-setting.service";

export const dynamic = "force-dynamic";

export default async function AdminSystemSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4">
      <PageHeader
        title="Sistem & Marka Kimliği Ayarları"
        description="Platform genel adı (Elitale Restro), logo, favicon, OpenGraph ve SEO meta etiketlerini yönetin."
      />
      <SystemSettingsForm initialSettings={settings} />
    </div>
  );
}
