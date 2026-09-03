export type ZReportStatus = "OPEN" | "CLOSED";

export interface CashMovementDTO {
  readonly id: string;
  readonly type: "IN" | "OUT";
  readonly category: string;
  readonly amount: number;
  readonly description: string | null;
  readonly performedByName: string | null;
  readonly createdAt: string;
}

export interface ZReportKpis {
  readonly grossSales: number;
  readonly netSales: number;
  readonly totalCollections: number;
  readonly avgOrderAmount: number;
  readonly openOrdersCount: number;
  readonly openOrdersTotal: number;
  readonly cashDifference: number;
  readonly orderCount: number;
  readonly discountTotal: number;
  readonly voidTotal: number;
  readonly compTotal: number;
  readonly taxTotal: number;
}

export interface ZReportFinancialSummary {
  readonly grossSales: number;
  readonly discountTotal: number;
  readonly voidTotal: number;
  readonly returnTotal: number;
  readonly compTotal: number;
  readonly netSales: number;
  readonly orderCount: number;
  readonly itemCount: number;
  readonly avgOrderAmount: number;
  readonly avgItemPerOrder: number;
  readonly maxOrderAmount: number;
  readonly minOrderAmount: number;
}

export interface PosBreakdownItem {
  readonly name: string;
  readonly count: number;
  readonly amount: number;
}

export interface PaymentMixItem {
  readonly mode: string;
  readonly label: string;
  readonly count: number;
  readonly amount: number;
  readonly percentage: number;
  readonly subBreakdown?: readonly PosBreakdownItem[];
}

export interface CashReconciliationDTO {
  readonly openingCash: number;
  readonly cashSales: number;
  readonly cashInTotal: number;
  readonly cashOutTotal: number;
  readonly expectedCash: number;
  readonly countedCash: number;
  readonly cashDifference: number;
  readonly differenceType: "MATCH" | "SURPLUS" | "DEFICIT";
}

export interface TaxSummaryItem {
  readonly taxRate: number;
  readonly matrah: number;
  readonly taxAmount: number;
  readonly total: number;
}

export interface ChannelSalesItem {
  readonly channel: string;
  readonly label: string;
  readonly orderCount: number;
  readonly netSales: number;
  readonly percentage: number;
}

export interface CategorySalesItem {
  readonly categoryId: string;
  readonly categoryName: string;
  readonly itemCount: number;
  readonly grossSales: number;
  readonly netSales: number;
  readonly percentage: number;
}

export interface TopItemSalesItem {
  readonly name: string;
  readonly categoryName: string;
  readonly quantity: number;
  readonly netSales: number;
  readonly percentage: number;
}

export interface DiscountTypeItem {
  readonly type: string;
  readonly label: string;
  readonly count: number;
  readonly amount: number;
}

export interface StaffDiscountItem {
  readonly staffName: string;
  readonly count: number;
  readonly amount: number;
}

export interface DiscountSummary {
  readonly total: number;
  readonly orderCount: number;
  readonly avgDiscount: number;
  readonly percentageOfSales: number;
  readonly types: readonly DiscountTypeItem[];
  readonly staffDiscounts: readonly StaffDiscountItem[];
}

export interface AuditItemDTO {
  readonly id: string;
  readonly time: string;
  readonly orderNumber: number;
  readonly tableLabel: string | null;
  readonly itemName: string;
  readonly type: "VOID" | "RETURN" | "COMP";
  readonly quantity: number;
  readonly amount: number;
  readonly staffName: string;
  readonly reason: string | null;
}

export interface StaffPerformanceItem {
  readonly staffId: string;
  readonly staffName: string;
  readonly role: string;
  readonly orderCount: number;
  readonly netSales: number;
  readonly avgOrderAmount: number;
  readonly discountTotal: number;
  readonly voidTotal: number;
  readonly compTotal: number;
}

export interface OpenOrderItem {
  readonly orderId: string;
  readonly orderNumber: number;
  readonly tableLabel: string | null;
  readonly amount: number;
  readonly openedAt: string;
  readonly elapsedMinutes: number;
}

export interface HourlySalesPoint {
  readonly hour: string;
  readonly orders: number;
  readonly sales: number;
}

export interface ZReportDTO {
  readonly id: string | null;
  readonly restaurantId: string;
  readonly restaurantName: string;
  readonly status: ZReportStatus;
  readonly zNumber: number | null;
  readonly zNumberFormatted: string | null;
  readonly date: string;
  readonly dateFormatted: string;
  readonly openedAt: string;
  readonly closedAt: string | null;
  readonly closedByName: string | null;
  readonly kpis: ZReportKpis;
  readonly financial: ZReportFinancialSummary;
  readonly payments: readonly PaymentMixItem[];
  readonly cashReconciliation: CashReconciliationDTO;
  readonly taxes: readonly TaxSummaryItem[];
  readonly channels: readonly ChannelSalesItem[];
  readonly categories: readonly CategorySalesItem[];
  readonly topItems: readonly TopItemSalesItem[];
  readonly discounts: DiscountSummary;
  readonly audits: readonly AuditItemDTO[];
  readonly staffPerformance: readonly StaffPerformanceItem[];
  readonly openOrders: readonly OpenOrderItem[];
  readonly hourlySales: readonly HourlySalesPoint[];
  readonly cashMovements: readonly CashMovementDTO[];
  readonly notes: string | null;
}

export interface ZReportHistoryItem {
  readonly id: string;
  readonly zNumber: number;
  readonly zNumberFormatted: string;
  readonly date: string;
  readonly openedAt: string;
  readonly closedAt: string;
  readonly orderCount: number;
  readonly netSales: number;
  readonly cashSales: number;
  readonly cardSales: number;
  readonly cashDifference: number;
  readonly closedByName: string;
}
