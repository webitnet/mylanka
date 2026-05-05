import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lightweight search: case-insensitive `contains` over uk/en name + descriptions.
 * Good enough for MVP; will be replaced with Meilisearch in a later phase
 * once admin-driven product CRUD lands and indices need to be kept in sync.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? "8")));

  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { nameUk: { contains: q, mode: "insensitive" } },
        { nameEn: { contains: q, mode: "insensitive" } },
        { descUk: { contains: q, mode: "insensitive" } },
        { descEn: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
      slug: true,
      nameUk: true,
      nameEn: true,
      priceUah: true,
      stock: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });

  return NextResponse.json({
    items: items.map((p) => ({
      slug: p.slug,
      nameUk: p.nameUk,
      nameEn: p.nameEn,
      priceUah: p.priceUah,
      stock: p.stock,
      imageUrl: p.images[0]?.url,
    })),
  });
}
