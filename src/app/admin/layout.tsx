import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/admin-auth";
import { serializeForClient } from "@/lib/utils";
import { getSystemSettings } from "@/services/system-setting.service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  // Defense in depth: the edge proxy blocks unauthenticated requests, and this
  // DB-backed role check keeps /admin locked to admins only.
  const [, systemSettings] = await Promise.all([
    requireAdminPage(),
    getSystemSettings().catch(() => null),
  ]);
  return (
    <AdminShell
      systemSettings={systemSettings ? serializeForClient(systemSettings) : null}
    >
      {children}
    </AdminShell>
  );
}
