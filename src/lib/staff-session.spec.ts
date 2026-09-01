import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      store.has(name) ? { value: store.get(name) } : undefined,
    set: (name: string, value: string) => {
      store.set(name, value);
    },
    delete: (name: string) => {
      store.delete(name);
    },
  }),
}));

import {
  createStaffSession,
  destroyStaffSession,
  getStaffSession,
} from "./staff-session";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-value";
});
beforeEach(() => store.clear());

describe("staff session", () => {
  it("round-trips a signed session for all staff roles", async () => {
    await createStaffSession({
      staffId: "st1",
      restaurantId: "res_1",
      role: "CASHIER",
    });

    expect(await getStaffSession()).toEqual({
      staffId: "st1",
      restaurantId: "res_1",
      role: "CASHIER",
    });

    await createStaffSession({
      staffId: "st2",
      restaurantId: "res_1",
      role: "OTHER",
    });

    expect(await getStaffSession()).toEqual({
      staffId: "st2",
      restaurantId: "res_1",
      role: "OTHER",
    });
  });

  it("returns null when there's no cookie", async () => {
    expect(await getStaffSession()).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    store.set("restro_staff", "not.a.jwt");

    expect(await getStaffSession()).toBeNull();
  });

  it("clears the cookie on destroy", async () => {
    await createStaffSession({
      staffId: "st1",
      restaurantId: "res_1",
      role: "KITCHEN",
    });
    await destroyStaffSession();

    expect(await getStaffSession()).toBeNull();
  });
});
