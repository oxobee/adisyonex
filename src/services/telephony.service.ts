import { getTelephonyProvider } from "@/lib/telephony/provider-registry";
import { formatPhoneForDisplay, normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import {
  createCustomerWithAddress,
  findActiveRingingCall,
  findCustomerByPhoneNormalized,
  getTelephonyIntegration,
  listRecentMissedCalls,
  markAddressAsUsed,
  updateCallSessionStatus,
  upsertCallSession,
  upsertTelephonyIntegration,
} from "@/repositories/telephony.repository";

export interface TelephonySettingsDTO {
  id: string;
  restaurantId: string;
  provider: string;
  enabled: boolean;
  mode: "SIMULATION" | "LIVE";
  status: "ACTIVE" | "PENDING_SETUP" | "ERROR";
  incomingNumber: string | null;
  sipExtension: string | null;
  apiUsername: string | null;
  hasApiPassword: boolean;
  webhookUrl: string;
  webhookSecret: string;
  lastSuccessfulConnectionAt: string | null;
  lastIncomingCallAt: string | null;
  lastError: string | null;
  missingLiveRequirements: string[];
}

export interface CustomerCallProfileDTO {
  isRegistered: boolean;
  customerId?: string;
  name?: string;
  phone: string;
  formattedPhone: string;
  notes?: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  addresses: Array<{
    id: string;
    title: string;
    address: string;
    isDefault: boolean;
    isLastUsed: boolean;
  }>;
  lastOrder?: {
    id: string;
    orderNumber: number;
    total: number;
    createdAt: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      variantName?: string | null;
    }>;
  } | null;
}

export interface ActiveCallDTO {
  id: string;
  providerCallId: string;
  fromNumber: string;
  formattedFromNumber: string;
  toNumber?: string | null;
  status: "RINGING" | "ANSWERED" | "ENDED" | "MISSED";
  isSimulation: boolean;
  startedAt: string;
  customerProfile: CustomerCallProfileDTO;
}

export interface MissedCallDTO {
  id: string;
  fromNumber: string;
  formattedFromNumber: string;
  customerName?: string | null;
  customerId?: string | null;
  status: string;
  createdAt: string;
  isRegistered: boolean;
}

function computeMissingLiveRequirements(integration: {
  incomingNumber?: string | null;
  apiUsername?: string | null;
  apiPasswordEncrypted?: string | null;
}): string[] {
  const missing: string[] = [];
  if (!integration.incomingNumber?.trim()) {
    missing.push("Santral / Netgsm telefon numarası");
  }
  if (!integration.apiUsername?.trim()) {
    missing.push("API kullanıcı adı");
  }
  if (!integration.apiPasswordEncrypted?.trim()) {
    missing.push("API şifresi");
  }
  return missing;
}

/**
 * Builds the publicly accessible webhook URL for Netgsm panel.
 */
export function buildWebhookUrl(restaurantId: string, webhookSecret: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://adisyoon.vercel.app";
  return `${baseUrl}/api/telephony/netgsm/webhook?rid=${restaurantId}&secret=${webhookSecret}`;
}

export async function getTelephonySettings(restaurantId: string): Promise<TelephonySettingsDTO> {
  let integration = await getTelephonyIntegration(restaurantId);

  if (!integration) {
    integration = await upsertTelephonyIntegration(restaurantId, {
      provider: "NETGSM",
      enabled: false,
      mode: "SIMULATION",
      status: "PENDING_SETUP",
    });
  }

  const webhookUrl = buildWebhookUrl(restaurantId, integration.webhookSecret);
  const missingLiveRequirements = computeMissingLiveRequirements(integration);

  return {
    id: integration.id,
    restaurantId: integration.restaurantId,
    provider: integration.provider,
    enabled: integration.enabled,
    mode: integration.mode as "SIMULATION" | "LIVE",
    status: integration.status as "ACTIVE" | "PENDING_SETUP" | "ERROR",
    incomingNumber: integration.incomingNumber,
    sipExtension: integration.sipExtension,
    apiUsername: integration.apiUsername,
    hasApiPassword: Boolean(integration.apiPasswordEncrypted),
    webhookUrl,
    webhookSecret: integration.webhookSecret,
    lastSuccessfulConnectionAt: integration.lastSuccessfulConnectionAt?.toISOString() ?? null,
    lastIncomingCallAt: integration.lastIncomingCallAt?.toISOString() ?? null,
    lastError: integration.lastError,
    missingLiveRequirements,
  };
}

export async function updateTelephonySettings(
  restaurantId: string,
  input: {
    enabled?: boolean;
    mode?: "SIMULATION" | "LIVE";
    provider?: string;
    incomingNumber?: string | null;
    sipExtension?: string | null;
    apiUsername?: string | null;
    apiPassword?: string | null;
  }
): Promise<{ success: boolean; data?: TelephonySettingsDTO; error?: string }> {
  const existing = await getTelephonyIntegration(restaurantId);

  // If user tries to activate LIVE mode, verify required fields
  const targetMode = input.mode ?? existing?.mode ?? "SIMULATION";
  const targetIncomingNumber = input.incomingNumber !== undefined ? input.incomingNumber : existing?.incomingNumber;
  const targetApiUsername = input.apiUsername !== undefined ? input.apiUsername : existing?.apiUsername;
  const hasPassword = Boolean(input.apiPassword?.trim() || existing?.apiPasswordEncrypted);

  if (targetMode === "LIVE" && input.enabled !== false) {
    const missing: string[] = [];
    if (!targetIncomingNumber?.trim()) missing.push("Santral / Netgsm telefon numarası");
    if (!targetApiUsername?.trim()) missing.push("API kullanıcı adı");
    if (!hasPassword) missing.push("API şifresi");

    if (missing.length > 0) {
      return {
        success: false,
        error: `Canlı mod için eksik ayarlar: ${missing.join(", ")}. Lütfen eksik bilgileri doldurun.`,
      };
    }
  }

  let status: "ACTIVE" | "PENDING_SETUP" | "ERROR" = "PENDING_SETUP";
  if (input.enabled === false) {
    status = "PENDING_SETUP";
  } else if (targetMode === "LIVE" && targetIncomingNumber && targetApiUsername && hasPassword) {
    status = "ACTIVE";
  } else if (targetMode === "SIMULATION") {
    status = "ACTIVE";
  }

  const updated = await upsertTelephonyIntegration(restaurantId, {
    enabled: input.enabled,
    mode: input.mode,
    provider: input.provider,
    incomingNumber: input.incomingNumber ? input.incomingNumber.trim() : input.incomingNumber,
    sipExtension: input.sipExtension ? input.sipExtension.trim() : input.sipExtension,
    apiUsername: input.apiUsername ? input.apiUsername.trim() : input.apiUsername,
    apiPasswordEncrypted: input.apiPassword ? input.apiPassword.trim() : undefined,
    status,
  });

  const dto = await getTelephonySettings(restaurantId);
  return { success: true, data: dto };
}

export async function testTelephonyConnection(
  restaurantId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const integration = await getTelephonyIntegration(restaurantId);
  if (!integration) {
    return { success: false, message: "Entegrasyon ayarları bulunamadı." };
  }

  const provider = getTelephonyProvider(integration.provider);
  const result = await provider.testConnection({
    apiUsername: integration.apiUsername,
    apiPassword: integration.apiPasswordEncrypted,
    incomingNumber: integration.incomingNumber,
    sipExtension: integration.sipExtension,
  });

  if (result.success) {
    await upsertTelephonyIntegration(restaurantId, {
      lastSuccessfulConnectionAt: new Date(),
      lastError: null,
      status: "ACTIVE",
    });
  } else {
    await upsertTelephonyIntegration(restaurantId, {
      lastError: result.error || result.message,
      status: "ERROR",
    });
  }

  return result;
}

export async function getCustomerCallSummary(
  restaurantId: string,
  rawPhone: string
): Promise<CustomerCallProfileDTO> {
  const normalized = normalizePhoneNumber(rawPhone) || rawPhone;
  const customer = await findCustomerByPhoneNormalized(restaurantId, normalized);

  if (!customer) {
    return {
      isRegistered: false,
      phone: normalized,
      formattedPhone: formatPhoneForDisplay(normalized),
      orderCount: 0,
      totalSpent: 0,
      addresses: [],
      lastOrder: null,
    };
  }

  const addresses = customer.addresses.map((addr, idx) => ({
    id: addr.id,
    title: addr.title,
    address: addr.address,
    isDefault: addr.isDefault,
    isLastUsed: idx === 0, // Ordered by lastUsedAt desc
  }));

  const lastOrder = customer.orders[0]
    ? {
        id: customer.orders[0].id,
        orderNumber: customer.orders[0].orderNumber,
        total: Number(customer.orders[0].grandTotal || 0),
        createdAt: customer.orders[0].createdAt.toISOString(),
        items: customer.orders[0].items.map((it) => ({
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          price: Number(it.unitPrice || 0),
          variantName: it.variantName,
        })),
      }
    : null;

  return {
    isRegistered: true,
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone,
    formattedPhone: formatPhoneForDisplay(customer.phone),
    notes: customer.notes,
    orderCount: customer.orderCount,
    totalSpent: Number(customer.totalSpent || 0),
    lastOrderDate: customer.orders[0]?.createdAt.toISOString() ?? null,
    addresses,
    lastOrder,
  };
}

export async function getActiveRingingCall(restaurantId: string): Promise<ActiveCallDTO | null> {
  const activeCall = await findActiveRingingCall(restaurantId);
  if (!activeCall) return null;

  // Check if telephony integration allows calls (or if it's a simulated call, allow it always)
  const integration = await getTelephonyIntegration(restaurantId);
  if (!activeCall.isSimulation) {
    if (!integration || !integration.enabled) {
      return null;
    }
  }

  const profile = await getCustomerCallSummary(restaurantId, activeCall.normalizedFromNumber);

  return {
    id: activeCall.id,
    providerCallId: activeCall.providerCallId,
    fromNumber: activeCall.fromNumber,
    formattedFromNumber: formatPhoneForDisplay(activeCall.normalizedFromNumber),
    toNumber: activeCall.toNumber,
    status: activeCall.status,
    isSimulation: activeCall.isSimulation,
    startedAt: activeCall.startedAt.toISOString(),
    customerProfile: profile,
  };
}

export async function getRecentMissedCalls(
  restaurantId: string
): Promise<readonly MissedCallDTO[]> {
  const integration = await getTelephonyIntegration(restaurantId);
  if (!integration || !integration.enabled) {
    return [];
  }

  const calls = await listRecentMissedCalls(restaurantId, 8);
  return calls.map((c) => ({
    id: c.id,
    fromNumber: c.fromNumber,
    formattedFromNumber: formatPhoneForDisplay(c.normalizedFromNumber),
    customerName: c.customer?.name ?? null,
    customerId: c.customerId,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    isRegistered: Boolean(c.customer),
  }));
}

export async function dismissCallSession(
  restaurantId: string,
  callSessionId: string,
  status: "ANSWERED" | "ENDED" | "MISSED" = "ENDED"
): Promise<boolean> {
  const updated = await updateCallSessionStatus(restaurantId, callSessionId, status);
  return Boolean(updated);
}

export async function quickRegisterCustomerFromCall(
  restaurantId: string,
  data: {
    phone: string;
    name: string;
    address?: string;
    addressTitle?: string;
    notes?: string;
  }
): Promise<{ customerId: string; name: string; phone: string; address?: string }> {
  const res = await createCustomerWithAddress({
    restaurantId,
    name: data.name,
    phone: data.phone,
    notes: data.notes,
    address: data.address,
    addressTitle: data.addressTitle,
  });

  return {
    customerId: res.customer.id,
    name: res.customer.name,
    phone: res.customer.phone,
    address: res.address?.address,
  };
}

export type SimulationScenario =
  | "REGISTERED_DELIVERY"
  | "REGISTERED_TAKEAWAY"
  | "REGISTERED_DINE_IN"
  | "NEW_CUSTOMER"
  | "MARKETPLACE_YEMEKSEPETI"
  | "REGISTERED" // Backwards compatibility
  | "NEW"; // Backwards compatibility

/**
 * Triggers a real simulation call that follows the exact backend pipeline.
 */
export async function triggerSimulationCall(
  restaurantId: string,
  options: {
    scenario: SimulationScenario;
    customPhone?: string;
    customName?: string;
  }
): Promise<ActiveCallDTO> {
  const integration = await getTelephonyIntegration(restaurantId);
  if (!integration) {
    throw new Error("TELEPHONY_NOT_INITIALIZED");
  }

  const scenario = options.scenario;
  let callerPhone = options.customPhone?.trim();
  let callerName = options.customName?.trim();

  if (scenario === "NEW" || scenario === "NEW_CUSTOMER") {
    // NEW customer: unique non-existent phone number
    if (!callerPhone) {
      callerPhone = `0555${Math.floor(1000000 + Math.random() * 9000000)}`;
    }
  } else if (scenario === "MARKETPLACE_YEMEKSEPETI") {
    // Yemeksepeti / Pazaryeri maskeli çağrı
    callerPhone = callerPhone || "08502220000";
    callerName = callerName || "Yemeksepeti (Sipariş Destek)";

    let marketplaceCustomer = await prisma.customer.findFirst({
      where: { restaurantId, phone: callerPhone, deletedAt: null },
    });
    if (!marketplaceCustomer) {
      marketplaceCustomer = await prisma.customer.create({
        data: {
          restaurantId,
          name: "Yemeksepeti Entegrasyon",
          phone: callerPhone,
          notes: "Pazaryeri otomatik sipariş bildirim hattı. Ödeme online alınmıştır.",
          source: "YEMEKSEPETI",
          customerSource: "YEMEKSEPETI",
        },
      });
    }
  } else if (scenario === "REGISTERED_TAKEAWAY") {
    callerPhone = callerPhone || "05339876543";
    callerName = callerName || "Zeynep Kaya";

    let takeawayCust = await prisma.customer.findFirst({
      where: { restaurantId, phone: callerPhone, deletedAt: null },
    });
    if (!takeawayCust) {
      takeawayCust = await prisma.customer.create({
        data: {
          restaurantId,
          name: callerName,
          phone: callerPhone,
          notes: "Müşteri gelip kendisi teslim alacak. 15 dk sonra hazır olsun.",
          source: "PHONE_ORDER",
          customerSource: "PHONE",
          orderCount: 4,
          totalSpent: 1250,
        },
      });
      // Add previous takeaway order
      await prisma.order.create({
        data: {
          restaurantId,
          orderNumber: Math.floor(1000 + Math.random() * 9000),
          idempotencyKey: `sim_order_takeaway_${Date.now()}`,
          orderType: "TAKEAWAY",
          orderChannel: "PHONE",
          status: "COMPLETED",
          customerId: takeawayCust.id,
          customerName: takeawayCust.name,
          customerPhone: takeawayCust.phone,
          subtotal: 310,
          grandTotal: 310,
          items: {
            create: [
              { name: "Tavuk Şiş Dürüm", quantity: 2, unitPrice: 130, itemType: "SERVED" },
              { name: "Kutu Kola", quantity: 2, unitPrice: 25, itemType: "SERVED" },
            ],
          },
        },
      });
    }
  } else if (scenario === "REGISTERED_DINE_IN") {
    callerPhone = callerPhone || "05423334455";
    callerName = callerName || "Caner Erkin";

    let dineInCust = await prisma.customer.findFirst({
      where: { restaurantId, phone: callerPhone, deletedAt: null },
    });
    if (!dineInCust) {
      dineInCust = await prisma.customer.create({
        data: {
          restaurantId,
          name: callerName,
          phone: callerPhone,
          notes: "Masa rezervasyonu veya salonda sipariş veren VIP müşteri.",
          source: "PHONE_ORDER",
          customerSource: "PHONE",
          orderCount: 8,
          totalSpent: 4200,
        },
      });
    }
  } else {
    // REGISTERED or REGISTERED_DELIVERY
    callerPhone = callerPhone || "05321234567";
    callerName = callerName || "Ahmet Yılmaz";

    // Look for existing customer
    const existing = await prisma.customer.findFirst({
      where: { restaurantId, deletedAt: null },
      include: { addresses: true },
    });

    if (existing) {
      callerPhone = existing.phone;
      callerName = existing.name;

      if (existing.addresses.length === 0) {
        await prisma.customerAddress.create({
          data: {
            customerId: existing.id,
            restaurantId,
            title: "Ev",
            address: "Barbaros Mah. Ihlamur Sk. No: 14 Daire: 5 Ataşehir / İstanbul",
            isDefault: true,
            lastUsedAt: new Date(),
          },
        });
      }
    } else {
      const created = await createCustomerWithAddress({
        restaurantId,
        name: callerName,
        phone: callerPhone,
        notes: "Müşteri acı biber istemiyor, kapıda kredi kartı ile öder.",
        address: "Bağdat Caddesi No: 242 Daire: 6 Kadıköy / İstanbul",
        addressTitle: "Ev",
      });

      await prisma.customerAddress.create({
        data: {
          customerId: created.customer.id,
          restaurantId,
          title: "İş",
          address: "Maslak Plaza Kat: 12 Sarıyer / İstanbul",
          isDefault: false,
          lastUsedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.order.create({
        data: {
          restaurantId,
          orderNumber: Math.floor(1000 + Math.random() * 9000),
          idempotencyKey: `sim_order_${Date.now()}_${Math.random()}`,
          orderType: "DELIVERY",
          status: "COMPLETED",
          customerId: created.customer.id,
          customerName: created.customer.name,
          customerPhone: created.customer.phone,
          customerAddress: "Bağdat Caddesi No: 242 Daire: 6 Kadıköy / İstanbul",
          subtotal: 860,
          grandTotal: 860,
          items: {
            create: [
              {
                name: "Adana Kebap",
                quantity: 2,
                unitPrice: 380,
                itemType: "SERVED",
              },
              {
                name: "Yayık Ayran",
                quantity: 2,
                unitPrice: 50,
                itemType: "SERVED",
              },
            ],
          },
        },
      });

      await prisma.customer.update({
        where: { id: created.customer.id },
        data: { orderCount: 14, totalSpent: 8450 },
      });
    }
  }

  const normalizedPhone = normalizePhoneNumber(callerPhone) || callerPhone;

  // Check if customer matches in database
  const customer = await prisma.customer.findFirst({
    where: {
      restaurantId,
      deletedAt: null,
      phone: normalizedPhone,
    },
  });

  const providerCallId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Save active call session
  const callSession = await upsertCallSession({
    restaurantId,
    provider: "NETGSM",
    providerCallId,
    fromNumber: callerPhone,
    normalizedFromNumber: normalizedPhone,
    toNumber: integration.incomingNumber || "08503000000",
    sipExtension: integration.sipExtension || "101",
    customerId: customer?.id ?? null,
    status: "RINGING",
    isSimulation: true,
  });

  await upsertTelephonyIntegration(restaurantId, {
    lastIncomingCallAt: new Date(),
  });

  const profile = await getCustomerCallSummary(restaurantId, normalizedPhone);

  return {
    id: callSession.id,
    providerCallId: callSession.providerCallId,
    fromNumber: callSession.fromNumber,
    formattedFromNumber: formatPhoneForDisplay(normalizedPhone),
    toNumber: callSession.toNumber,
    status: "RINGING",
    isSimulation: true,
    startedAt: callSession.startedAt.toISOString(),
    customerProfile: profile,
  };
}
