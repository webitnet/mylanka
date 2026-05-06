import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { listOrdersForExport } from "@/lib/admin/orders";

const SHIPPING_LABEL: Record<string, string> = {
  NOVA_POSHTA: "Nova Poshta",
  UKRPOSHTA: "Ukrposhta",
  SELF_PICKUP: "Self pickup",
  INTERNATIONAL: "International",
};

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function uahFromKopecks(k: number): string {
  return (k / 100).toFixed(2);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Auth required" } },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const orders = await listOrdersForExport({
    q: url.searchParams.get("q") ?? undefined,
    status: (url.searchParams.get("status") as "all" | OrderStatus) ?? "all",
    paymentStatus:
      (url.searchParams.get("payment") as "all" | PaymentStatus) ?? "all",
  });

  const headers = [
    "order_number",
    "created_at",
    "status",
    "payment_status",
    "source",
    "first_name",
    "last_name",
    "email",
    "phone",
    "shipping_method",
    "np_city",
    "np_warehouse",
    "shipping_address",
    "tracking_number",
    "items_count",
    "subtotal_uah",
    "shipping_cost_uah",
    "discount_uah",
    "total_uah",
  ];

  const lines: string[] = [headers.join(",")];
  for (const o of orders) {
    lines.push(
      [
        o.orderNumber,
        o.createdAt.toISOString(),
        o.status,
        o.paymentStatus,
        o.source,
        o.firstName,
        o.lastName,
        o.email,
        o.phone,
        SHIPPING_LABEL[o.shippingMethod] ?? o.shippingMethod,
        o.npCity ?? "",
        o.npWarehouse ?? "",
        o.shippingAddress ?? "",
        o.trackingNumber ?? "",
        o._count.items,
        uahFromKopecks(o.subtotal),
        uahFromKopecks(o.shippingCost),
        uahFromKopecks(o.discount),
        uahFromKopecks(o.total),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  // BOM for Excel UTF-8 detection.
  const body = "﻿" + lines.join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mylanka-orders-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
