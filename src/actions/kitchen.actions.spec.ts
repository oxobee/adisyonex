import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ getAdminContextOrNull: vi.fn() }));
vi.mock("@/lib/manager-auth", () => ({ getManagerContextOrNull: vi.fn() }));
vi.mock("@/lib/staff-auth", () => ({ getStaffContextOrNull: vi.fn() }));
vi.mock("@/services/kitchen.service", () => ({
  advanceTicket: vi.fn(),
  markPickedUp: vi.fn(),
}));

import { getManagerContextOrNull } from "@/lib/manager-auth";
import { getStaffContextOrNull } from "@/lib/staff-auth";
import { advanceTicket, markPickedUp } from "@/services/kitchen.service";
import {
  advanceTicketAction,
  markPickedUpAction,
} from "./kitchen.actions";

const kitchenCtx = {
  staffId: "st_k",
  restaurantId: "res_1",
  role: "KITCHEN" as const,
  name: "Suresh",
  employeeCode: "K1",
};

const waiterCtx = {
  staffId: "st_w",
  restaurantId: "res_1",
  role: "WAITER" as const,
  name: "Ramesh",
  employeeCode: "W1",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getManagerContextOrNull).mockResolvedValue(null);
});

describe("advanceTicketAction", () => {
  it("advances the ticket for a kitchen staff member", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(kitchenCtx);

    const result = await advanceTicketAction({ orderId: "o1" });

    expect(result.success).toBe(true);
    expect(advanceTicket).toHaveBeenCalledWith("res_1", "o1");
  });

  it("advances the ticket for a manager session", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(null);
    vi.mocked(getManagerContextOrNull).mockResolvedValue({
      restaurantId: "res_1",
      userId: "u1",
    } as any);

    const result = await advanceTicketAction({ orderId: "o1" });

    expect(result.success).toBe(true);
    expect(advanceTicket).toHaveBeenCalledWith("res_1", "o1");
  });

  it("rejects when there is no session at all", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(null);
    vi.mocked(getManagerContextOrNull).mockResolvedValue(null);

    const result = await advanceTicketAction({ orderId: "o1" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("NO_SESSION");
  });

  it("fails validation without an orderId", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(kitchenCtx);

    const result = await advanceTicketAction({});

    expect(result.success).toBe(false);
    expect(advanceTicket).not.toHaveBeenCalled();
  });
});

describe("markPickedUpAction", () => {
  it("marks the ticket picked up for an operator", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(waiterCtx);

    const result = await markPickedUpAction({ orderId: "o1" });

    expect(result.success).toBe(true);
    expect(markPickedUp).toHaveBeenCalledWith("res_1", "o1");
  });

  it("rejects when there is no session at all", async () => {
    vi.mocked(getStaffContextOrNull).mockResolvedValue(null);
    vi.mocked(getManagerContextOrNull).mockResolvedValue(null);

    const result = await markPickedUpAction({ orderId: "o1" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("NO_SESSION");
    expect(markPickedUp).not.toHaveBeenCalled();
  });
});
