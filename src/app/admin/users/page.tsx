import { UsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/shared/page-header";
import { serializeForClient } from "@/lib/utils";
import { userListQuerySchema } from "@/lib/validators/admin";
import { listUsers } from "@/services/admin-user.service";
import { listSalesReps } from "@/services/sales-rep.service";

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = userListQuerySchema.parse({
    search: typeof sp.search === "string" ? sp.search : undefined,
    role: typeof sp.role === "string" ? sp.role : undefined,
    page: typeof sp.page === "string" ? sp.page : undefined,
  });
  const [result, salesReps] = await Promise.all([
    listUsers(query),
    listSalesReps().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kullanıcılar"
        description="Platformdaki tüm işletmeci ve yönetici hesapları."
      />
      <UsersTable
        data={serializeForClient(result)}
        salesReps={serializeForClient(salesReps)}
      />
    </div>
  );
}
