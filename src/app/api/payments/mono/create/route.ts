import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/apiError";
import { publicBaseUrl } from "@/lib/payments/baseUrl";
import { createInvoice } from "@/lib/payments/monobank";

const BodySchema = z.object({
  orderNumber: z.string().min(1),
});

export type MonoCreateResponse = { redirectUrl: string };

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
  const { orderNumber } = parsed.data;

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

  const base = publicBaseUrl();

  let invoice;
  try {
    invoice = await createInvoice({
      amountKopecks: order.total,
      reference: order.orderNumber,
      destination: `Замовлення в Mylanka — ${order.orderNumber}`,
      redirectUrl: `${base}/checkout/success?order=${encodeURIComponent(order.orderNumber)}`,
      webHookUrl: `${base}/api/webhooks/monobank`,
    });
  } catch (err) {
    console.error("[mono create]", err);
    return apiError("MONO_UPSTREAM", (err as Error).message, 502);
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "MONOBANK",
      externalId: invoice.invoiceId,
      amount: order.total,
      currency: "UAH",
      status: "PENDING",
    },
  });

  return NextResponse.json<MonoCreateResponse>({ redirectUrl: invoice.pageUrl });
}
