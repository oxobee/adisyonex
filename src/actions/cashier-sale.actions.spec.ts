import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/manager-auth", () => ({ getManagerContextOrNull: vi.fn() }));
vi.mock("@/lib/staff-auth", () => ({ getStaffContextOrNull: vi.fn() }));
vi.mock("@/services/order.service", () => ({
  createOrder: vi.fn(),
}));
vi.mock("@/services/settlement.service", () => ({
  settle: vi.fn(),
}));

import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { createOrder } from "@/services/order.service";
import { settle } from "@/services/settlement.service";
import { quickCashierSaleAction } from "./cashier-sale.actions";

const MANAGER_CTX = { userId: "m1", restaurantId: "res_1" };
const STAFF_CTX = {
  staffId: "s1",
  restaurantId: "res_1",
  role: "CASHIER" as const,
  name: "Ali Kasiyer",
  employeeCode: "EMP01",
  jobTitle: "Kasiyer",
  allowedRoutes: ["/dashboard/pos"],
};

const validSale = {
  idempotencyKey: "sale-idem-12345",
  orderType: "TAKEAWAY" as const,
  items: [{ menuItemId: "item_1", quantity: 2 }],
  discountType: "NONE" as const,
  discountValue: 0,
  payments: [
    { mode: "CASH" as const, amount: 150, tendered: 200, reference: "Nakit Kasa" },
  ],
};

describe("quickCashierSaleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails when neither manager nor staff is signed in", async () => {
    vi.mocked(getManagerContextOrNull).mockResolvedValue(null);
    vi.mocked(getStaffContextOrNull).mockResolvedValue(null);

    const result = await quickCashierSaleAction(validSale);
    expect(result.success).toBe(false);
    expect(result.error).toBe("NO_SESSION");
  });

  it("successfully creates and settles sale with manager session", async () => {
    vi.mocked(getManagerContextOrNull).mockResolvedValue(MANAGER_CTX);
    vi.mocked(getStaffContextOrNull).mockResolvedValue(null);

    vi.mocked(createOrder).mockResolvedValue({ id: "ord_1" } as any);
    vi.mocked(settle).mockResolvedValue({
      id: "ord_1",
      orderNumber: 105,
      grandTotal: 150,
    } as any);

    const result = await quickCashierSaleAction(validSale);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderNumber).toBe(105);
      expect(result.data.grandTotal).toBe(150);
      expect(result.data.paidAmount).toBe(150);
      expect(result.data.tenderedAmount).toBe(200);
      expect(result.data.changeAmount).toBe(50);
      expect(result.data.invoiceUrl).toBe("/dashboard/orders/ord_1/invoice");
    }

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: "res_1", userId: "m1" }),
      expect.objectContaining({ idempotencyKey: "sale-idem-12345" }),
    );
    expect(settle).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: "res_1" }),
      expect.objectContaining({ orderId: "ord_1" }),
    );
  });

  it("successfully creates and settles sale with staff (cashier) session", async () => {
    vi.mocked(getManagerContextOrNull).mockResolvedValue(null);
    vi.mocked(getStaffContextOrNull).mockResolvedValue(STAFF_CTX);

    vi.mocked(createOrder).mockResolvedValue({ id: "ord_2" } as any);
    vi.mocked(settle).mockResolvedValue({
      id: "ord_2",
      orderNumber: 106,
      grandTotal: 150,
    } as any);

    const result = await quickCashierSaleAction(validSale);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderNumber).toBe(106);
      expect(result.data.changeAmount).toBe(50);
    }

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: "res_1", staffId: "s1" }),
      expect.anything(),
    );
  });
});
