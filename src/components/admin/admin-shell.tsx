import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import type { SystemSettingsDTO } from "@/services/system-setting.service";

export function AdminShell({
  children,
  systemSettings,
}: {
  readonly children: ReactNode;
  readonly systemSettings?: Partial<SystemSettingsDTO> | null;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground overflow-x-hidden">
      <AdminNav systemSettings={systemSettings} />
      <main className="min-w-0 flex-1 p-3.5 sm:p-6 lg:p-8 max-w-full overflow-x-auto">
        {children}
      </main>
    </div>
  );
}
