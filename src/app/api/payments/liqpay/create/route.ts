import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/apiError";
import { publicBaseUrl } from "@/lib/payments/baseUrl";
import {
  buildCheckoutRedirectUrl,
  liqPayKeys,
  type LiqPayPayload,
} from "@/lib/payments/liqpay";

const BodySchema = z.object({
  orderNumber: z.string().min(1),
  locale: z.enum(["uk", "en"]).default("uk"),
});

export type LiqPayCreateResponse = { redirectUrl: string };

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Body must be JSON", 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("INVALID_BODY", parsed.error.message, 400);
  }
  const { orderNumber, locale } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentStatus: true,
      status: true,
    },
  });
  if (!order) return apiError("ORDER_NOT_FOUND", "Order not found", 404);
  if (order.paymentStatus === "PAID") {
    return apiError("ALREADY_PAID", "Order is already paid", 409);
  }
  if (order.status === "CANCELLED") {
    return apiError("ORDER_CANCELLED", "Order is cancelled", 409);
  }

  const { publicKey } = liqPayKeys();
  const base = publicBaseUrl();

  const payload: LiqPayPayload = {
    action: "pay",
    version: 3,
    public_key: publicKey,
    amount: order.total / 100,
    currency: "UAH",
    description: `Замовлення ${order.orderNumber} | Mylanka`,
    order_id: order.orderNumber,
    result_url: `${base}/checkout/success?order=${encodeURIComponent(order.orderNumber)}`,
    server_url: `${base}/api/webhooks/liqpay`,
    language: locale,
    sandbox: publicKey.startsWith("sandbox_") ? 1 : 0,
  };

  const { redirectUrl } = buildCheckoutRedirectUrl(payload);

  // Record a PENDING Payment so we can correlate the webhook later.
  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "LIQPAY",
      amount: order.total,
      currency: "UAH",
      status: "PENDING",
    },
  });

  return NextResponse.json<LiqPayCreateResponse>({ redirectUrl });
}
