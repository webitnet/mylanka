import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/apiError";

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.number().int().positive(),
      }),
    )
    .max(100),
});

export type CartValidateResponse = {
  items: Array<{
    slug: string;
    nameUk: string;
    nameEn: string;
    priceUah: number;
    imageUrl?: string;
    stock: number;
    requestedQty: number;
    grantedQty: number; // min(requestedQty, stock)
    isActive: boolean;
  }>;
  removed: string[]; // slugs that no longer exist or are inactive
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Body must be JSON", 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_BODY", parsed.error.message, 400);
  }

  const { items } = parsed.data;
  if (items.length === 0) {
    return NextResponse.json<CartValidateResponse>({ items: [], removed: [] });
  }

  const slugs = items.map((i) => i.slug);
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      nameUk: true,
      nameEn: true,
      priceUah: true,
      stock: true,
      isActive: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const removed: string[] = [];
  const result: CartValidateResponse["items"] = [];

  for (const req of items) {
    const p = bySlug.get(req.slug);
    if (!p || !p.isActive) {
      removed.push(req.slug);
      continue;
    }
    result.push({
      slug: p.slug,
      nameUk: p.nameUk,
      nameEn: p.nameEn,
      priceUah: p.priceUah,
      imageUrl: p.images[0]?.url,
      stock: p.stock,
      isActive: p.isActive,
      requestedQty: req.qty,
      grantedQty: Math.min(req.qty, p.stock),
    });
  }

  return NextResponse.json<CartValidateResponse>({ items: result, removed });
}
