import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export const PAGE_SIZE = 24;

export type SortKey =
  | "newest"
  | "priceAsc"
  | "priceDesc"
  | "popular"
  | "rating";

export type CatalogQuery = {
  categorySlug?: string;
  minPrice?: number; // kopecks
  maxPrice?: number; // kopecks
  materials?: string[];
  regions?: string[];
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
};

function buildWhere(q: CatalogQuery, categoryDescendantIds?: string[]): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (categoryDescendantIds && categoryDescendantIds.length > 0) {
    where.categoryId = { in: categoryDescendantIds };
  }

  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    where.priceUah = {};
    if (q.minPrice !== undefined) where.priceUah.gte = q.minPrice;
    if (q.maxPrice !== undefined) where.priceUah.lte = q.maxPrice;
  }

  if (q.materials && q.materials.length > 0) {
    where.material = { in: q.materials };
  }

  if (q.regions && q.regions.length > 0) {
    where.region = { in: q.regions };
  }

  if (q.inStock) {
    where.stock = { gt: 0 };
  }

  return where;
}

function buildOrderBy(sort: SortKey | undefined): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "priceAsc":
      return { priceUah: "asc" };
    case "priceDesc":
      return { priceUah: "desc" };
    case "popular":
      return { orderItems: { _count: "desc" } };
    case "rating":
      return { reviews: { _count: "desc" } };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

async function resolveCategoryDescendants(slug: string): Promise<string[]> {
  // Find the category and all of its descendants (1-level deep is enough — schema has 2 levels)
  const root = await prisma.category.findUnique({
    where: { slug },
    include: { children: { select: { id: true } } },
  });
  if (!root) return [];
  return [root.id, ...root.children.map((c) => c.id)];
}

export async function listProducts(q: CatalogQuery) {
  const page = Math.max(1, q.page ?? 1);
  const descendantIds = q.categorySlug
    ? await resolveCategoryDescendants(q.categorySlug)
    : undefined;

  if (q.categorySlug && (!descendantIds || descendantIds.length === 0)) {
    return { items: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 };
  }

  const where = buildWhere(q, descendantIds);
  const orderBy = buildOrderBy(q.sort);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { images: { where: { isPrimary: true }, take: 1 } },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { items, total, page, pageSize: PAGE_SIZE, totalPages };
}

export async function getDistinctMaterials(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, material: { not: null } },
    select: { material: true },
    distinct: ["material"],
  });
  return rows.map((r) => r.material!).filter(Boolean).sort();
}

export async function getDistinctRegions(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, region: { not: null } },
    select: { region: true },
    distinct: ["region"],
  });
  return rows.map((r) => r.region!).filter(Boolean).sort();
}

export type ProductRow = Awaited<ReturnType<typeof listProducts>>["items"][number];

export function toCardData(p: ProductRow) {
  return {
    slug: p.slug,
    nameUk: p.nameUk,
    nameEn: p.nameEn,
    priceUah: p.priceUah,
    comparePrice: p.comparePrice,
    stock: p.stock,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    imageUrl: p.images[0]?.url,
  };
}
