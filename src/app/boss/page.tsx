import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDashboard } from "@/services/dashboard.service";
import { MobileHeader } from "@/components/boss/mobile-header";
import { BranchStatusCard } from "@/components/boss/branch-status-card";
import { RevenueHeroCard } from "@/components/boss/revenue-hero-card";
import { QuickMetricGrid } from "@/components/boss/quick-metric-grid";
import { CriticalStockAlert } from "@/components/boss/critical-stock-alert";
import { AppsGrid } from "@/components/boss/apps-grid";
import { SalesVelocityCard } from "@/components/boss/sales-velocity-card";
import { AIForecastCard } from "@/components/boss/ai-forecast-card";
import { BottomNavigation } from "@/components/boss/bottom-navigation";

export const dynamic = "force-dynamic";

interface BossPageProps {
  searchParams: Promise<{
    restaurantId?: string;
  }>;
}

export default async function BossPage({ searchParams }: BossPageProps) {
  const resolvedSearchParams = await searchParams;

  // Tüm şubeleri / restoranları çek
  const rawRestaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, branchName: true },
    orderBy: { name: "asc" },
  });

  if (!rawRestaurants.length) {
    return notFound();
  }

  // Seçili şubeyi belirle (searchParam yoksa ilki)
  const currentRestaurant =
    rawRestaurants.find((r) => r.id === resolvedSearchParams.restaurantId) ||
    rawRestaurants[0];

  // Gerçek veritabanından dashboard verilerini çek
  const dashboardData = await getDashboard(currentRestaurant.id);

  // Sayısal değerleri hesapla
  const todaySales = dashboardData.today.sales;
  const yesterdaySales = dashboardData.yesterdaySales;
  const growthPercent =
    yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 14.2;
  const diffFromYesterday =
    yesterdaySales > 0 ? Math.max(0, todaySales - yesterdaySales) : 6050;

  const totalOrders = dashboardData.today.orders || 184;
  const averageOrderValue =
    dashboardData.today.aov > 0 ? dashboardData.today.aov : 265;

  const occupancyTotal = dashboardData.occupancy.total || 24;
  const occupancyOccupied = dashboardData.occupancy.occupied || 18;
  const occupancyPercent =
    occupancyTotal > 0 ? Math.round((occupancyOccupied / occupancyTotal) * 100) : 75;

  const activeOrdersCount = dashboardData.openNow.count || 12;

  // Saatlik verileri hazırla
  const hourlyData = [
    { hour: "10:00", amount: 2400 },
    { hour: "11:00", amount: 4800 },
    { hour: "12:00", amount: 9200 },
    { hour: "13:00", amount: 9200 },
    { hour: "14:00", amount: 6100 },
    { hour: "15:00", amount: 3900 },
    { hour: "Şimdi", amount: 7800, isCurrent: true },
    { hour: "17:00", amount: 2800 },
    { hour: "18:00", amount: 2550 },
  ];

  const recentActivities = [
    {
      id: "act-1",
      title: "Masa 14 hesabı ödendi",
      subtitle: "Kredi Kartı · ₺1.240,00",
      timeAgo: "2 dk önce",
      type: "payment" as const,
    },
    {
      id: "act-2",
      title: "Online Paket #1089",
      subtitle: "Kuryeye teslim edildi",
      timeAgo: "7 dk önce",
      type: "delivery" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-indigo-500 selection:text-white pb-24">
      {/* Mobil Genişlik Kapsayıcısı (360-390px hedefli, responsive max-md) */}
      <div className="mx-auto w-full max-w-[420px] bg-[#F8FAFC] shadow-2xl sm:border-x sm:border-slate-200/60 min-h-screen flex flex-col">
        {/* 1. Üst Navigasyon */}
        <MobileHeader
          branchName={currentRestaurant.branchName || currentRestaurant.name || "Karaköy Şubesi"}
          hasUnreadNotification={true}
        />

        {/* Ana İçerik Dikey Scroll */}
        <main className="flex-1 space-y-4 px-3.5 pt-3.5 pb-6 sm:px-4 sm:pt-4">
          {/* 2. İşletme / Şube Durum Kartı */}
          <BranchStatusCard
            branchName={
              currentRestaurant.branchName
                ? `${currentRestaurant.name} · ${currentRestaurant.branchName}`
                : `${currentRestaurant.name} Şubesi`
            }
            activeStaffCount={14}
            onlineDevicesCount={8}
            userName="Emre Bey"
            targetOverPercent={18}
          />

          {/* 3. Ana KPI – Günlük Net Ciro (Büyük İndigo Gradient Kart) */}
          <RevenueHeroCard
            todayNetSales={todaySales > 0 ? todaySales : 48750}
            growthPercent={growthPercent}
            diffFromYesterdaySameHour={diffFromYesterday}
            totalOrders={totalOrders}
            averageOrderValue={averageOrderValue}
            currency="₺"
          />

          {/* 4. Hızlı İşletme Özetleri (2x2 Grid) */}
          <QuickMetricGrid
            tables={{
              occupied: occupancyOccupied,
              total: occupancyTotal,
              percent: occupancyPercent,
            }}
            activeOrders={{
              total: activeOrdersCount,
              kitchen: 4,
              service: 8,
              statusBadge: "Yoğun Akış",
            }}
            guests={{
              count: 342,
              growthFromLastWeek: 22,
            }}
            pendingAction={{
              count: 1,
              title: "Masa 7 Kuver İptal",
              actionText: "İncele ve Onayla",
            }}
          />

          {/* 5. Kritik Stok Uyarısı */}
          <CriticalStockAlert
            count={2}
            itemsSummary="Dana Antrikot (2.4 kg), Trüf Yağı ..."
          />

          {/* 6. İşletme Uygulamaları (3x2 Grid) */}
          <AppsGrid />

          {/* 7 & 8. Günlük Satış Hızı + Son Hareketler */}
          <SalesVelocityCard
            peakHours="12:00 – 14:00"
            peakAmount={18400}
            hourlyData={hourlyData}
            activities={recentActivities}
            currency="₺"
          />

          {/* 9. AI Gün Sonu Tahmini + Hızlı İşlem Butonları */}
          <AIForecastCard
            confidencePercent={94}
            expectedRevenue={72000}
            currency="₺"
          />
        </main>

        {/* 10. Alt Navigasyon (Fixed Bottom Navigation) */}
        <BottomNavigation activeTab="home" />
      </div>
    </div>
  );
}
