"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ─── Queries ───────────────────────────────────────────────────────

export type OrdersListFilter = {
  q?: string;
  status?: "all" | OrderStatus;
  paymentStatus?: "all" | PaymentStatus;
  page?: number;
  perPage?: number;
};

export async function listOrdersForAdmin(filter: OrdersListFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const perPage = filter.perPage ?? 25;
  const skip = (page - 1) * perPage;

  const where: Prisma.OrderWhereInput = {};

  if (filter.q?.trim()) {
    const q = filter.q.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter.status && filter.status !== "all") where.status = filter.status;
  if (filter.paymentStatus && filter.paymentStatus !== "all")
    where.paymentStatus = filter.paymentStatus;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        orderNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        total: true,
        status: true,
        paymentStatus: true,
        source: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getOrderForAdmin(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

function buildOrdersWhere(
  filter: Pick<OrdersListFilter, "q" | "status" | "paymentStatus">,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (filter.q?.trim()) {
    const q = filter.q.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter.status && filter.status !== "all") where.status = filter.status;
  if (filter.paymentStatus && filter.paymentStatus !== "all")
    where.paymentStatus = filter.paymentStatus;
  return where;
}

export async function listOrdersForExport(
  filter: Pick<OrdersListFilter, "q" | "status" | "paymentStatus">,
) {
  return prisma.order.findMany({
    where: buildOrdersWhere(filter),
    orderBy: { createdAt: "desc" },
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      source: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      shippingMethod: true,
      npCity: true,
      npWarehouse: true,
      shippingAddress: true,
      trackingNumber: true,
      subtotal: true,
      shippingCost: true,
      discount: true,
      total: true,
      _count: { select: { items: true } },
    },
  });
}

// ─── Status transitions ───────────────────────────────────────────

const TERMINAL: OrderStatus[] = ["CANCELLED", "REFUNDED"];

async function assertNotTerminal(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!order) throw new Error("Order not found");
  if (TERMINAL.includes(order.status)) {
    throw new Error(`Замовлення вже у статусі ${order.status}`);
  }
  return order.status;
}

export async function confirmOrder(id: string) {
  const status = await assertNotTerminal(id);
  if (status !== "PENDING") {
    throw new Error("Підтвердити можна лише замовлення зі статусом «Очікує»");
  }
  await prisma.order.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function markProcessing(id: string) {
  const status = await assertNotTerminal(id);
  if (status !== "CONFIRMED") {
    throw new Error("В обробку — лише з «Підтверджено»");
  }
  await prisma.order.update({
    where: { id },
    data: { status: "PROCESSING" },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function shipOrder(id: string, trackingNumber: string) {
  const status = await assertNotTerminal(id);
  if (status !== "CONFIRMED" && status !== "PROCESSING") {
    throw new Error("Відправити можна лише з «Підтверджено» або «В обробці»");
  }
  const trimmed = trackingNumber.trim();
  if (!trimmed) throw new Error("Вкажіть трек-номер");
  await prisma.order.update({
    where: { id },
    data: { status: "SHIPPED", trackingNumber: trimmed },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function markDelivered(id: string) {
  const status = await assertNotTerminal(id);
  if (status !== "SHIPPED") {
    throw new Error("Доставлено — лише з «Відправлено»");
  }
  await prisma.order.update({
    where: { id },
    data: { status: "DELIVERED" },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function cancelOrder(id: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      select: {
        status: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            product: { select: { trackStock: true } },
          },
        },
      },
    });
    if (!order) throw new Error("Order not found");
    if (TERMINAL.includes(order.status)) {
      throw new Error("Замовлення вже фіналізоване");
    }

    // Restore stock for tracked products.
    for (const item of order.items) {
      if (item.product.trackStock) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

/**
 * Manual refund: assumes the operator has already issued the refund in the
 * payment provider's dashboard. We mark the order/payments as REFUNDED and
 * restore stock for tracked items. No upstream API call is made.
 */
export async function refundOrder(id: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      select: {
        status: true,
        paymentStatus: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            product: { select: { trackStock: true } },
          },
        },
      },
    });
    if (!order) throw new Error("Order not found");
    if (order.status === "REFUNDED") throw new Error("Замовлення вже повернуто");
    if (order.paymentStatus !== "PAID") {
      throw new Error("Повернути можна лише оплачене замовлення");
    }

    for (const item of order.items) {
      if (item.product.trackStock) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.payment.updateMany({
      where: { orderId: id, status: "PAID" },
      data: { status: "REFUNDED" },
    });

    await tx.order.update({
      where: { id },
      data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    });
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateAdminNotes(id: string, notes: string) {
  await prisma.order.update({
    where: { id },
    data: { adminNotes: notes.trim() || null },
  });
  revalidatePath(`/admin/orders/${id}`);
}
