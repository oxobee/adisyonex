import { NextRequest, NextResponse } from "next/server";
import { getTelephonyProvider } from "@/lib/telephony/provider-registry";
import { prisma } from "@/lib/prisma";
import { upsertCallSession } from "@/repositories/telephony.repository";
import { normalizePhoneNumber } from "@/lib/phone";

async function handleNetgsmWebhook(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    let bodyParams: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      bodyParams = await req.json().catch(() => ({}));
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        formData.forEach((val, key) => {
          bodyParams[key] = typeof val === "string" ? val : val.name;
        });
      }
    }

    const provider = getTelephonyProvider("NETGSM");
    const event = provider.parseWebhook(bodyParams, queryParams);

    if (!event) {
      return NextResponse.json({ success: false, error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    // 1. Identify tenant / restaurant
    let restaurantId = queryParams.rid;
    const secret = queryParams.secret;

    if (restaurantId && secret) {
      // Validate secret
      const integration = await prisma.telephonyIntegration.findUnique({
        where: { restaurantId },
      });
      if (!integration || integration.webhookSecret !== secret) {
        return NextResponse.json({ success: false, error: "UNAUTHORIZED_SECRET" }, { status: 401 });
      }
    } else if (event.toNumber) {
      // Match by dialed trunk number
      const normTo = normalizePhoneNumber(event.toNumber);
      const integration = await prisma.telephonyIntegration.findFirst({
        where: {
          OR: [
            { incomingNumber: event.toNumber },
            { incomingNumber: normTo },
            { incomingNumber: event.toNumber.replace(/\D/g, "") },
          ],
        },
      });
      if (integration) {
        restaurantId = integration.restaurantId;
      }
    }

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "RESTAURANT_NOT_IDENTIFIED" },
        { status: 404 }
      );
    }

    // 2. Check if telephony module is enabled for this restaurant
    const integration = await prisma.telephonyIntegration.findUnique({
      where: { restaurantId },
    });

    if (!integration || !integration.enabled) {
      return NextResponse.json({ success: true, message: "MODULE_DISABLED_IGNORED" });
    }

    // 3. Match customer in this specific restaurant (multi-tenant isolated)
    const customer = await prisma.customer.findFirst({
      where: {
        restaurantId,
        deletedAt: null,
        phone: event.normalizedFromNumber,
      },
      select: { id: true },
    });

    // 4. Idempotently upsert call session
    const session = await upsertCallSession({
      restaurantId,
      provider: "NETGSM",
      providerCallId: event.providerCallId,
      fromNumber: event.fromNumber,
      normalizedFromNumber: event.normalizedFromNumber,
      toNumber: event.toNumber,
      sipExtension: event.sipExtension,
      customerId: customer?.id ?? null,
      status: event.event,
      isSimulation: false,
    });

    // Update last incoming call timestamp
    await prisma.telephonyIntegration.update({
      where: { restaurantId },
      data: { lastIncomingCallAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      status: session.status,
    });
  } catch (err: unknown) {
    console.error("[Telephony Webhook Error]:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleNetgsmWebhook(req);
}

export async function POST(req: NextRequest) {
  return handleNetgsmWebhook(req);
}
