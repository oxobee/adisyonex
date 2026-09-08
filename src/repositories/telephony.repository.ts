import type { CallSession, Customer, CustomerAddress, TelephonyIntegration } from "@/generated/prisma/client";
import { getPhoneSearchVariations, normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function getTelephonyIntegration(
  restaurantId: string
): Promise<TelephonyIntegration | null> {
  return prisma.telephonyIntegration.findUnique({
    where: { restaurantId },
  });
}

export async function upsertTelephonyIntegration(
  restaurantId: string,
  data: {
    provider?: string;
    enabled?: boolean;
    mode?: "SIMULATION" | "LIVE";
    status?: "ACTIVE" | "PENDING_SETUP" | "ERROR";
    incomingNumber?: string | null;
    sipExtension?: string | null;
    apiUsername?: string | null;
    apiPasswordEncrypted?: string | null;
    lastSuccessfulConnectionAt?: Date | null;
    lastIncomingCallAt?: Date | null;
    lastError?: string | null;
  }
): Promise<TelephonyIntegration> {
  return prisma.telephonyIntegration.upsert({
    where: { restaurantId },
    create: {
      restaurantId,
      provider: data.provider ?? "NETGSM",
      enabled: data.enabled ?? false,
      mode: data.mode ?? "SIMULATION",
      status: data.status ?? "PENDING_SETUP",
      incomingNumber: data.incomingNumber ?? null,
      sipExtension: data.sipExtension ?? null,
      apiUsername: data.apiUsername ?? null,
      apiPasswordEncrypted: data.apiPasswordEncrypted ?? null,
      lastSuccessfulConnectionAt: data.lastSuccessfulConnectionAt ?? null,
      lastIncomingCallAt: data.lastIncomingCallAt ?? null,
      lastError: data.lastError ?? null,
    },
    update: {
      provider: data.provider,
      enabled: data.enabled,
      mode: data.mode,
      status: data.status,
      incomingNumber: data.incomingNumber,
      sipExtension: data.sipExtension,
      apiUsername: data.apiUsername,
      ...(data.apiPasswordEncrypted !== undefined ? { apiPasswordEncrypted: data.apiPasswordEncrypted } : {}),
      lastSuccessfulConnectionAt: data.lastSuccessfulConnectionAt,
      lastIncomingCallAt: data.lastIncomingCallAt,
      lastError: data.lastError,
    },
  });
}

export type CustomerWithDetails = Customer & {
  addresses: CustomerAddress[];
  orders: Array<{
    id: string;
    orderNumber: number;
    grandTotal: unknown;
    status: string;
    createdAt: Date;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: unknown;
      variantName: string | null;
    }>;
  }>;
};

export async function findCustomerByPhoneNormalized(
  restaurantId: string,
  phone: string
): Promise<CustomerWithDetails | null> {
  const variations = getPhoneSearchVariations(phone);

  const customer = await prisma.customer.findFirst({
    where: {
      restaurantId,
      deletedAt: null,
      phone: { in: variations },
    },
    include: {
      addresses: {
        orderBy: [{ lastUsedAt: "desc" }, { isDefault: "desc" }, { createdAt: "desc" }],
      },
      orders: {
        where: { deletedAt: null, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: true,
        },
      },
    },
  });

  return customer as CustomerWithDetails | null;
}

export async function createCustomerWithAddress(data: {
  restaurantId: string;
  name: string;
  phone: string;
  notes?: string | null;
  address?: string;
  addressTitle?: string;
}): Promise<{ customer: Customer; address?: CustomerAddress }> {
  const normalizedPhone = normalizePhoneNumber(data.phone) || data.phone;

  return prisma.$transaction(async (tx) => {
    let customer = await tx.customer.findFirst({
      where: {
        restaurantId: data.restaurantId,
        deletedAt: null,
        phone: { in: getPhoneSearchVariations(normalizedPhone) },
      },
    });

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          restaurantId: data.restaurantId,
          name: data.name.trim(),
          phone: normalizedPhone,
          notes: data.notes?.trim() || null,
          source: "PHONE_ORDER",
          kvkkConsent: true,
          kvkkAcceptedAt: new Date(),
        },
      });
    } else if (data.notes) {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          notes: data.notes.trim(),
        },
      });
    }

    let createdAddress: CustomerAddress | undefined = undefined;
    if (data.address && data.address.trim()) {
      createdAddress = await tx.customerAddress.create({
        data: {
          customerId: customer.id,
          restaurantId: data.restaurantId,
          title: data.addressTitle?.trim() || "Ev",
          address: data.address.trim(),
          isDefault: true,
          lastUsedAt: new Date(),
        },
      });
    }

    return { customer, address: createdAddress };
  });
}

export async function markAddressAsUsed(addressId: string): Promise<void> {
  await prisma.customerAddress.update({
    where: { id: addressId },
    data: { lastUsedAt: new Date() },
  });
}

export async function upsertCallSession(data: {
  restaurantId: string;
  provider: string;
  providerCallId: string;
  fromNumber: string;
  normalizedFromNumber: string;
  toNumber?: string | null;
  sipExtension?: string | null;
  customerId?: string | null;
  status: "RINGING" | "ANSWERED" | "ENDED" | "MISSED";
  isSimulation?: boolean;
}): Promise<CallSession> {
  const now = new Date();
  return prisma.callSession.upsert({
    where: {
      restaurantId_providerCallId: {
        restaurantId: data.restaurantId,
        providerCallId: data.providerCallId,
      },
    },
    create: {
      restaurantId: data.restaurantId,
      provider: data.provider,
      providerCallId: data.providerCallId,
      fromNumber: data.fromNumber,
      normalizedFromNumber: data.normalizedFromNumber,
      toNumber: data.toNumber ?? null,
      sipExtension: data.sipExtension ?? null,
      customerId: data.customerId ?? null,
      status: data.status,
      isSimulation: data.isSimulation ?? false,
      startedAt: now,
      answeredAt: data.status === "ANSWERED" ? now : null,
      endedAt: data.status === "ENDED" || data.status === "MISSED" ? now : null,
    },
    update: {
      status: data.status,
      customerId: data.customerId !== undefined ? data.customerId : undefined,
      answeredAt: data.status === "ANSWERED" ? now : undefined,
      endedAt: data.status === "ENDED" || data.status === "MISSED" ? now : undefined,
    },
  });
}

export async function findActiveRingingCall(restaurantId: string): Promise<(CallSession & { customer: (Customer & { addresses: CustomerAddress[] }) | null }) | null> {
  // A call is considered active if RINGING within the last 90 seconds
  const cutoff = new Date(Date.now() - 90 * 1000);

  return prisma.callSession.findFirst({
    where: {
      restaurantId,
      status: "RINGING",
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        include: {
          addresses: {
            orderBy: [{ lastUsedAt: "desc" }, { isDefault: "desc" }],
          },
        },
      },
    },
  });
}

export async function listRecentMissedCalls(
  restaurantId: string,
  take = 10
): Promise<Array<CallSession & { customer: Customer | null }>> {
  return prisma.callSession.findMany({
    where: {
      restaurantId,
      status: "MISSED",
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      customer: true,
    },
  });
}

export async function updateCallSessionStatus(
  restaurantId: string,
  sessionId: string,
  status: "RINGING" | "ANSWERED" | "ENDED" | "MISSED",
  orderId?: string
): Promise<CallSession | null> {
  const session = await prisma.callSession.findFirst({
    where: { id: sessionId, restaurantId },
  });
  if (!session) return null;

  return prisma.callSession.update({
    where: { id: sessionId },
    data: {
      status,
      ...(status === "ANSWERED" && !session.answeredAt ? { answeredAt: new Date() } : {}),
      ...(status === "ENDED" || status === "MISSED" ? { endedAt: new Date() } : {}),
      ...(orderId ? { orderId } : {}),
    },
  });
}
