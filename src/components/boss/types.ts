export interface BossDashboardData {
  restaurant: {
    id: string;
    name: string;
    branchName: string;
    activeStaffCount: number;
    onlineDevicesCount: number;
  };
  greeting: {
    userName: string;
    targetOverPercent: number;
  };
  kpi: {
    todayNetSales: number;
    growthPercent: number;
    diffFromYesterdaySameHour: number;
    totalOrders: number;
    averageOrderValue: number;
    sparkline: number[];
  };
  metrics: {
    tables: {
      occupied: number;
      total: number;
      percent: number;
    };
    activeOrders: {
      total: number;
      kitchen: number;
      service: number;
      statusBadge: string;
    };
    guests: {
      count: number;
      growthFromLastWeek: number;
    };
    pendingAction: {
      count: number;
      title: string;
      actionText: string;
    };
  };
  criticalStock: {
    count: number;
    summary: string;
    items: string[];
  };
  apps: Array<{
    id: string;
    name: string;
    icon: string;
    badge?: string;
    badgeType?: "green" | "orange" | "neutral";
    subtext: string;
    href?: string;
  }>;
  salesVelocity: {
    peakHours: string;
    peakAmount: number;
    currentHourIndex: number;
    hourlyData: Array<{
      hour: string;
      amount: number;
      isCurrent?: boolean;
    }>;
  };
  recentActivities: Array<{
    id: string;
    title: string;
    subtitle: string;
    timeAgo: string;
    type: "payment" | "delivery" | "order";
  }>;
  aiForecast: {
    confidencePercent: number;
    expectedRevenue: number;
  };
}
