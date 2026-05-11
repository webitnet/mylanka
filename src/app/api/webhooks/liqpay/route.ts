import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  decodeData,
  liqPayKeys,
  signLiqPay,
  LIQPAY_PAID_STATUSES,
  LIQPAY_FAILED_STATUSES,
  type LiqPayCallbackData,
} from "@/lib/payments/liqpay";

/**
 * LiqPay webhook receives application/x-www-form-urlencoded with `data` + `signature`.
 * Always responds 200 once the signature is valid — LiqPay retries on non-2xx.
 */
export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  let data: string | null = null;
  let signature: string | null = null;

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData();
    data = (form.get("data") as string | null) ?? null;
    signature = (form.get("signature") as string | null) ?? null;
  } else if (ct.includes("application/json")) {
    const body = (await req.json()) as { data?: string; signature?: string };
    data = body.data ?? null;
    signature = body.signature ?? null;
  } else {
    // Some senders post raw urlencoded without correct content-type — try parsing the body.
    const text = await req.text();
    const params = new URLSearchParams(text);
    data = params.get("data");
    signature = params.get("signature");
  }

  if (!data || !signature) {
    console.warn("[liqpay webhook] missing data/signature");
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }

  const { privateKey } = liqPayKeys();
  const expected = signLiqPay(privateKey, data);
  if (signature !== expected) {
    console.warn("[liqpay webhook] signature mismatch");
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 403 });
  }

  let payload: LiqPayCallbackData;
  try {
    payload = decodeData<LiqPayCallbackData>(data);
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_data" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: payload.order_id },
    select: { id: true, paymentStatus: true },
  });
  if (!order) {
    console.warn("[liqpay webhook] order not found", payload.order_id);
    return NextResponse.json({ ok: true }); // ack to stop retries
  }

  // Idempotency: skip if already paid.
  if (order.paymentStatus === "PAID" && LIQPAY_PAID_STATUSES.has(payload.status)) {
    return NextResponse.json({ ok: true });
  }

  const isPaid = LIQPAY_PAID_STATUSES.has(payload.status);
  const isFailed = LIQPAY_FAILED_STATUSES.has(payload.status);

  await prisma.$transaction(async (tx) => {
    // Find the most recent LiqPay PENDING payment for this order, or create one.
    const existing = await tx.payment.findFirst({
      where: { orderId: order.id, provider: "LIQPAY" },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await tx.payment.update({
        where: { id: existing.id },
        data: {
          status: isPaid ? "PAID" : isFailed ? "FAILED" : "PENDING",
          externalId: String(payload.payment_id),
          rawResponse: payload as unknown as object,
          paidAt: isPaid ? new Date() : null,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "LIQPAY",
          externalId: String(payload.payment_id),
          amount: Math.round(payload.amount * 100),
          currency: payload.currency,
          status: isPaid ? "PAID" : isFailed ? "FAILED" : "PENDING",
          rawResponse: payload as unknown as object,
          paidAt: isPaid ? new Date() : null,
        },
      });
    }

    if (isPaid) {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
    } else if (isFailed) {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
    }
  });

  if (isPaid) {
    const { paymentReceivedMessage } = await import("@/lib/telegram/messages");
    const { notifyAdmin } = await import("@/lib/telegram/notify");
    notifyAdmin(
      paymentReceivedMessage({
        orderNumber: payload.order_id,
        provider: "LIQPAY",
        amount: Math.round(payload.amount * 100),
      }),
    );
  }

  return NextResponse.json({ ok: true });
}
