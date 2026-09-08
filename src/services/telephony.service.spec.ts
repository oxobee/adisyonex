import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    telephonyIntegration: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customerAddress: {
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
    callSession: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  buildWebhookUrl,
  getCustomerCallSummary,
  getTelephonySettings,
  updateTelephonySettings,
} from "./telephony.service";

describe("telephony.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds correct webhook url containing restaurantId and secret", () => {
    const url = buildWebhookUrl("res_123", "secret_abc");
    expect(url).toContain("rid=res_123");
    expect(url).toContain("secret=secret_abc");
    expect(url).toContain("/api/telephony/netgsm/webhook");
  });

  it("prevents switching to LIVE mode if Netgsm credentials are missing", async () => {
    vi.mocked(prisma.telephonyIntegration.findUnique).mockResolvedValueOnce({
      id: "int_1",
      restaurantId: "res_1",
      provider: "NETGSM",
      enabled: false,
      mode: "SIMULATION",
      status: "PENDING_SETUP",
      incomingNumber: null,
      sipExtension: null,
      apiUsername: null,
      apiPasswordEncrypted: null,
      webhookSecret: "sec_1",
      lastSuccessfulConnectionAt: null,
      lastIncomingCallAt: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateTelephonySettings("res_1", {
      mode: "LIVE",
      enabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Canlı mod için eksik ayarlar");
  });

  it("allows updating settings in SIMULATION mode freely", async () => {
    vi.mocked(prisma.telephonyIntegration.findUnique).mockResolvedValue({
      id: "int_1",
      restaurantId: "res_1",
      provider: "NETGSM",
      enabled: true,
      mode: "SIMULATION",
      status: "ACTIVE",
      incomingNumber: "05321112233",
      sipExtension: "101",
      apiUsername: "user",
      apiPasswordEncrypted: "pass",
      webhookSecret: "sec_1",
      lastSuccessfulConnectionAt: null,
      lastIncomingCallAt: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.telephonyIntegration.upsert).mockResolvedValueOnce({
      id: "int_1",
      restaurantId: "res_1",
      provider: "NETGSM",
      enabled: true,
      mode: "SIMULATION",
      status: "ACTIVE",
      incomingNumber: "05321112233",
      sipExtension: "101",
      apiUsername: "user",
      apiPasswordEncrypted: "pass",
      webhookSecret: "sec_1",
      lastSuccessfulConnectionAt: null,
      lastIncomingCallAt: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateTelephonySettings("res_1", {
      enabled: true,
      mode: "SIMULATION",
    });

    expect(result.success).toBe(true);
    expect(result.data?.mode).toBe("SIMULATION");
  });

  it("returns unregistered profile when customer is not found", async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(null);

    const summary = await getCustomerCallSummary("res_1", "05329998877");
    expect(summary.isRegistered).toBe(false);
    expect(summary.phone).toBe("+905329998877");
    expect(summary.orderCount).toBe(0);
  });
});
