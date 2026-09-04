import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminContextOrNull } from "@/lib/admin-auth";
import { serializeForClient } from "@/lib/utils";
import { getSystemSettings } from "@/services/system-setting.service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const adminCtx = await getAdminContextOrNull();
  if (!adminCtx || !adminCtx.isSuperAdmin) {
    redirect("/dashboard/home");
  }

  const systemSettings = await getSystemSettings().catch(() => null);

  return (
    <AdminShell
      systemSettings={systemSettings ? serializeForClient(systemSettings) : null}
    >
      {children}
    </AdminShell>
  );
}
