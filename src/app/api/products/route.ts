import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductListItem = {
  slug: string;
  nameUk: string;
  nameEn: string;
  priceUah: number; // kopecks
  comparePrice: number | null;
  stock: number;
  trackStock: boolean;
  image: string | null;
  categorySlug: string;
};

export type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const category = url.searchParams.get("category") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const perPage = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") ?? "24") || 24),
  );
  const skip = (page - 1) * perPage;

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q) {
    where.OR = [
      { nameUk: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip,
      take: perPage,
      select: {
        slug: true,
        nameUk: true,
        nameEn: true,
        priceUah: true,
        comparePrice: true,
        stock: true,
        trackStock: true,
        category: { select: { slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const res: ProductListResponse = {
    items: items.map((p) => ({
      slug: p.slug,
      nameUk: p.nameUk,
      nameEn: p.nameEn,
      priceUah: p.priceUah,
      comparePrice: p.comparePrice,
      stock: p.stock,
      trackStock: p.trackStock,
      image: p.images[0]?.url ?? null,
      categorySlug: p.category.slug,
    })),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };

  return NextResponse.json(res, {
    headers: { "Cache-Control": "no-store" },
  });
}
