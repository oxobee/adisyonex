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
    <div className="flex min-h-svh">
      <AdminNav systemSettings={systemSettings} />
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
