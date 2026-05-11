import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchInvoiceStatus,
  verifyMonoSignature,
  MONO_PAID_STATUSES,
  MONO_FAILED_STATUSES,
} from "@/lib/payments/monobank";

/**
 * Monobank webhook delivers JSON with X-Sign header (ECDSA-SHA256 over body).
 * We re-fetch invoice status from Monobank to avoid trusting body-only updates,
 * and respond 200 once acked.
 */
export async function POST(req: Request) {
  const xSign = req.headers.get("x-sign") ?? "";
  const rawBody = await req.text();

  const valid = await verifyMonoSignature(rawBody, xSign);
  if (!valid) {
    console.warn("[mono webhook] signature mismatch");
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 403 });
  }

  let body: { invoiceId?: string; reference?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }
  if (!body.invoiceId) {
    return NextResponse.json({ ok: false, reason: "no_invoice_id" }, { status: 400 });
  }

  // Re-fetch authoritative status (the body event is just a trigger).
  let status;
  try {
    status = await fetchInvoiceStatus(body.invoiceId);
  } catch (err) {
    console.error("[mono webhook] status fetch failed", err);
    return NextResponse.json({ ok: false, reason: "status_fetch" }, { status: 500 });
  }

  // Locate order via the Payment row's externalId (set when invoice was created).
  const payment = await prisma.payment.findFirst({
    where: { provider: "MONOBANK", externalId: body.invoiceId },
    include: {
      order: { select: { id: true, paymentStatus: true, orderNumber: true } },
    },
  });

  if (!payment) {
    console.warn("[mono webhook] no Payment row for invoice", body.invoiceId);
    return NextResponse.json({ ok: true });
  }

  if (payment.order.paymentStatus === "PAID" && MONO_PAID_STATUSES.has(status.status)) {
    return NextResponse.json({ ok: true });
  }

  const isPaid = MONO_PAID_STATUSES.has(status.status);
  const isFailed = MONO_FAILED_STATUSES.has(status.status);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: isPaid ? "PAID" : isFailed ? "FAILED" : "PENDING",
        rawResponse: status as unknown as object,
        paidAt: isPaid ? new Date() : null,
      },
    });

    if (isPaid) {
      await tx.order.update({
        where: { id: payment.order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
      });
    } else if (isFailed) {
      await tx.order.update({
        where: { id: payment.order.id },
        data: { paymentStatus: "FAILED" },
      });
    }
  });

  if (isPaid) {
    const { paymentReceivedMessage } = await import("@/lib/telegram/messages");
    const { notifyAdmin } = await import("@/lib/telegram/notify");
    notifyAdmin(
      paymentReceivedMessage({
        orderNumber: payment.order.orderNumber,
        provider: "MONOBANK",
        amount: payment.amount,
      }),
    );
  }

  return NextResponse.json({ ok: true });
}
