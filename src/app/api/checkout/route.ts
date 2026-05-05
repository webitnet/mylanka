import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/apiError";
import { generateOrderNumber } from "@/lib/orders";

const ItemSchema = z.object({
  slug: z.string().min(1),
  qty: z.number().int().positive(),
});

const BodySchema = z.object({
  contact: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email(),
    phone: z.string().min(5).max(40),
  }),
  shipping: z.discriminatedUnion("method", [
    z.object({
      method: z.literal("NOVA_POSHTA"),
      cityName: z.string().min(1),
      warehouseDescription: z.string().min(1),
    }),
    z.object({
      method: z.literal("UKRPOSHTA"),
      address: z.string().min(3),
    }),
    z.object({
      method: z.literal("SELF_PICKUP"),
    }),
    z.object({
      method: z.literal("INTERNATIONAL"),
      address: z.string().min(3),
    }),
  ]),
  payment: z.enum(["LIQPAY", "MONOBANK", "CASH_ON_DELIVERY"]),
  items: z.array(ItemSchema).min(1).max(100),
  notes: z.string().max(2000).optional(),
  locale: z.enum(["uk", "en"]).default("uk"),
});

export type CheckoutResponse = { orderNumber: string };

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
  const body = parsed.data;

  if (body.items.length === 0) {
    return apiError("EMPTY_CART", "Cart is empty", 400);
  }

  // Load products + check availability + compute totals
  const slugs = body.items.map((i) => i.slug);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: {
      id: true, slug: true, sku: true, nameUk: true, nameEn: true,
      priceUah: true, stock: true, trackStock: true,
    },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  type OrderItemSeed = {
    productId: string;
    nameUk: string;
    nameEn: string;
    sku: string;
    priceUah: number;
    quantity: number;
    total: number;
  };
  const orderItemsData: OrderItemSeed[] = [];
  let subtotal = 0;
  for (const it of body.items) {
    const p = bySlug.get(it.slug);
    if (!p) return apiError("PRODUCT_UNAVAILABLE", `Product not found: ${it.slug}`, 409);
    if (p.trackStock && p.stock < it.qty) {
      return apiError("STOCK_INSUFFICIENT", `Insufficient stock for ${it.slug}`, 409);
    }
    const lineTotal = p.priceUah * it.qty;
    subtotal += lineTotal;
    orderItemsData.push({
      productId: p.id,
      nameUk: p.nameUk,
      nameEn: p.nameEn,
      sku: p.sku,
      priceUah: p.priceUah,
      quantity: it.qty,
      total: lineTotal,
    });
  }

  // Build shipping fields based on method
  const shippingFields: {
    shippingMethod: "NOVA_POSHTA" | "UKRPOSHTA" | "SELF_PICKUP" | "INTERNATIONAL";
    shippingAddress?: string;
    npCity?: string;
    npWarehouse?: string;
  } = { shippingMethod: body.shipping.method };
  switch (body.shipping.method) {
    case "NOVA_POSHTA":
      shippingFields.npCity = body.shipping.cityName;
      shippingFields.npWarehouse = body.shipping.warehouseDescription;
      break;
    case "UKRPOSHTA":
      shippingFields.shippingAddress = body.shipping.address;
      break;
    case "INTERNATIONAL":
      shippingFields.shippingAddress = body.shipping.address;
      break;
    case "SELF_PICKUP":
      break;
  }

  // Try to create the order, retry once on order-number collision
  for (let attempt = 0; attempt < 2; attempt++) {
    const orderNumber = await generateOrderNumber();
    try {
      const created = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            firstName: body.contact.firstName,
            lastName: body.contact.lastName,
            email: body.contact.email,
            phone: body.contact.phone,
            notes: body.notes,
            locale: body.locale,
            ...shippingFields,
            subtotal,
            shippingCost: 0,
            discount: 0,
            total: subtotal,
            status: "PENDING",
            paymentStatus: "UNPAID",
            source: "WEB",
            items: { create: orderItemsData },
          },
        });

        // Decrement stock atomically (only for trackStock products)
        for (const it of body.items) {
          const p = bySlug.get(it.slug)!;
          if (!p.trackStock) continue;
          await tx.product.update({
            where: { id: p.id },
            data: { stock: { decrement: it.qty } },
          });
        }

        return order;
      });
      return NextResponse.json<CheckoutResponse>({ orderNumber: created.orderNumber });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        attempt === 0
      ) {
        continue;
      }
      console.error("[checkout] failed", e);
      return apiError("GENERIC", "Could not create order", 500);
    }
  }

  return apiError("GENERIC", "Could not create order", 500);
}
