import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDashboard } from "@/services/dashboard.service";
import { BossHeader } from "@/components/boss/boss-header";
import { BossFinancialCard } from "@/components/boss/boss-financial-card";
import { BossAnalytics } from "@/components/boss/boss-analytics";
import { BossFooter } from "@/components/boss/boss-footer";

export const dynamic = "force-dynamic";

interface BossPageProps {
  searchParams: Promise<{
    restaurantId?: string;
  }>;
}

interface RestaurantSummary {
  id: string;
  name: string;
  currency: string;
}

export default async function BossPage({ searchParams }: BossPageProps) {
  const resolvedSearchParams = await searchParams;

  // Tüm şubeleri / restoranları çek
  const rawRestaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (!rawRestaurants.length) {
    return notFound();
  }

  const restaurants: RestaurantSummary[] = rawRestaurants.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    currency: "₺",
  }));

  // Seçili şubeyi belirle (searchParam yoksa ilki)
  const currentRestaurant =
    restaurants.find((r) => r.id === resolvedSearchParams.restaurantId) ||
    restaurants[0];

  // Gerçek veritabanından dashboard verilerini çek
  const dashboardData = await getDashboard(currentRestaurant.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      <div>
        {/* Özel Patron Header */}
        <BossHeader
          currentRestaurant={currentRestaurant}
          allRestaurants={restaurants}
        />

        {/* Ana İçerik Alanı */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Günlük Finansal Özet Kartı */}
          <BossFinancialCard
            data={dashboardData}
            currency={currentRestaurant.currency}
          />

          {/* Analitik Alanları (Saatlik yoğunluk, kanallar, en çok satanlar, trend) */}
          <BossAnalytics
            data={dashboardData}
            currency={currentRestaurant.currency}
          />
        </main>
      </div>

      {/* Modern Footer */}
      <BossFooter />
    </div>
  );
}
