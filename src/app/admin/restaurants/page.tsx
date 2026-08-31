import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { RestaurantsTable } from "@/components/admin/restaurants-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn, serializeForClient } from "@/lib/utils";
import { restaurantListQuerySchema } from "@/lib/validators/admin";
import { listRestaurants } from "@/services/restaurant.service";

import { listSalesReps } from "@/services/sales-rep.service";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminRestaurantsPage({ searchParams }: PageProps) {
  let result;
  let salesReps: any[] = [];
  try {
    const sp = await searchParams;
    const query = restaurantListQuerySchema.parse({
      search: typeof sp.search === "string" ? sp.search : undefined,
      page: typeof sp.page === "string" ? sp.page : undefined,
    });
    const [res, reps] = await Promise.all([
      listRestaurants(query),
      listSalesReps().catch(() => []),
    ]);
    result = res;
    salesReps = reps;
  } catch (e) {
    console.error("Failed to list restaurants:", e);
    result = { items: [], total: 0, page: 1, pageSize: 20 };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Restoranlar"
          description="Restoranları kaydedin ve yönetin."
        />
        <Link href="/admin/restaurants/new" className={cn(buttonVariants())}>
          <PlusIcon className="size-4" />
          Restoran Ekle
        </Link>
      </div>
      <RestaurantsTable
        data={serializeForClient(result)}
        salesReps={serializeForClient(salesReps)}
      />
    </div>
  );
}
