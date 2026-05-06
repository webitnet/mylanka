"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ─── List ──────────────────────────────────────────────────────────

export type ProductsListFilter = {
  q?: string;
  categoryId?: string;
  status?: "all" | "active" | "inactive";
  stock?: "all" | "in" | "low" | "out";
  page?: number;
  perPage?: number;
};

export async function listProductsForAdmin(filter: ProductsListFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const perPage = filter.perPage ?? 25;
  const skip = (page - 1) * perPage;

  const where: Prisma.ProductWhereInput = {};

  if (filter.q?.trim()) {
    const q = filter.q.trim();
    where.OR = [
      { nameUk: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.status === "active") where.isActive = true;
  if (filter.status === "inactive") where.isActive = false;
  if (filter.stock === "out") where.stock = 0;
  if (filter.stock === "in") where.stock = { gt: 0 };
  if (filter.stock === "low") {
    where.AND = [
      { trackStock: true },
      { stock: { lte: prisma.product.fields.lowStockAt } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        slug: true,
        sku: true,
        nameUk: true,
        nameEn: true,
        priceUah: true,
        stock: true,
        lowStockAt: true,
        trackStock: true,
        isActive: true,
        category: { select: { id: true, nameUk: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, altUk: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getProductForAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function listCategoriesFlat() {
  const cats = await prisma.category.findMany({
    select: {
      id: true,
      nameUk: true,
      slug: true,
      parentId: true,
      sortOrder: true,
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { nameUk: "asc" }],
  });
  // Build a path: "Parent → Child"
  const byId = new Map(cats.map((c) => [c.id, c]));
  return cats
    .map((c) => {
      const parent = c.parentId ? byId.get(c.parentId) : null;
      return {
        id: c.id,
        label: parent ? `${parent.nameUk} → ${c.nameUk}` : c.nameUk,
        sortKey: parent
          ? `${parent.nameUk}\x00${c.nameUk}`
          : `${c.nameUk}\x00`,
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey, "uk"));
}

// ─── Mutations ─────────────────────────────────────────────────────

const ProductInput = z.object({
  sku: z.string().min(1).max(50),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, {
    message: "Slug: тільки a–z, 0–9, дефіси",
  }),
  nameUk: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  shortDescUk: z.string().max(500).optional().nullable(),
  shortDescEn: z.string().max(500).optional().nullable(),
  descUk: z.string().min(1),
  descEn: z.string().min(1),
  priceUahKopecks: z.number().int().min(0),
  comparePriceKopecks: z.number().int().min(0).optional().nullable(),
  costPriceKopecks: z.number().int().min(0).optional().nullable(),
  categoryId: z.string().min(1),
  stock: z.number().int().min(0),
  lowStockAt: z.number().int().min(0),
  trackStock: z.boolean(),
  material: z.string().max(120).optional().nullable(),
  artisan: z.string().max(120).optional().nullable(),
  region: z.string().max(120).optional().nullable(),
  weight: z.number().int().min(0).optional().nullable(),
  dimensions: z.string().max(60).optional().nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  metaTitleUk: z.string().max(200).optional().nullable(),
  metaTitleEn: z.string().max(200).optional().nullable(),
  metaDescUk: z.string().max(500).optional().nullable(),
  metaDescEn: z.string().max(500).optional().nullable(),
  imageUrls: z.array(z.string().url()).max(10),
});

export type ProductInputT = z.infer<typeof ProductInput>;

function nullify<T>(v: T | null | undefined): T | null {
  return v ?? null;
}

export async function createProduct(input: ProductInputT) {
  const parsed = ProductInput.parse(input);

  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sku: parsed.sku,
        slug: parsed.slug,
        nameUk: parsed.nameUk,
        nameEn: parsed.nameEn,
        shortDescUk: nullify(parsed.shortDescUk),
        shortDescEn: nullify(parsed.shortDescEn),
        descUk: parsed.descUk,
        descEn: parsed.descEn,
        priceUah: parsed.priceUahKopecks,
        comparePrice: nullify(parsed.comparePriceKopecks),
        costPrice: nullify(parsed.costPriceKopecks),
        categoryId: parsed.categoryId,
        stock: parsed.stock,
        lowStockAt: parsed.lowStockAt,
        trackStock: parsed.trackStock,
        material: nullify(parsed.material),
        artisan: nullify(parsed.artisan),
        region: nullify(parsed.region),
        weight: nullify(parsed.weight),
        dimensions: nullify(parsed.dimensions),
        isActive: parsed.isActive,
        isFeatured: parsed.isFeatured,
        isNewArrival: parsed.isNewArrival,
        metaTitleUk: nullify(parsed.metaTitleUk),
        metaTitleEn: nullify(parsed.metaTitleEn),
        metaDescUk: nullify(parsed.metaDescUk),
        metaDescEn: nullify(parsed.metaDescEn),
      },
    });
    if (parsed.imageUrls.length > 0) {
      await tx.productImage.createMany({
        data: parsed.imageUrls.map((url, idx) => ({
          productId: product.id,
          url,
          sortOrder: idx,
          isPrimary: idx === 0,
        })),
      });
    }
    return product;
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${created.id}`);
}

export async function updateProduct(id: string, input: ProductInputT) {
  const parsed = ProductInput.parse(input);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        sku: parsed.sku,
        slug: parsed.slug,
        nameUk: parsed.nameUk,
        nameEn: parsed.nameEn,
        shortDescUk: nullify(parsed.shortDescUk),
        shortDescEn: nullify(parsed.shortDescEn),
        descUk: parsed.descUk,
        descEn: parsed.descEn,
        priceUah: parsed.priceUahKopecks,
        comparePrice: nullify(parsed.comparePriceKopecks),
        costPrice: nullify(parsed.costPriceKopecks),
        categoryId: parsed.categoryId,
        stock: parsed.stock,
        lowStockAt: parsed.lowStockAt,
        trackStock: parsed.trackStock,
        material: nullify(parsed.material),
        artisan: nullify(parsed.artisan),
        region: nullify(parsed.region),
        weight: nullify(parsed.weight),
        dimensions: nullify(parsed.dimensions),
        isActive: parsed.isActive,
        isFeatured: parsed.isFeatured,
        isNewArrival: parsed.isNewArrival,
        metaTitleUk: nullify(parsed.metaTitleUk),
        metaTitleEn: nullify(parsed.metaTitleEn),
        metaDescUk: nullify(parsed.metaDescUk),
        metaDescEn: nullify(parsed.metaDescEn),
      },
    });
    // Replace all images on update.
    await tx.productImage.deleteMany({ where: { productId: id } });
    if (parsed.imageUrls.length > 0) {
      await tx.productImage.createMany({
        data: parsed.imageUrls.map((url, idx) => ({
          productId: id,
          url,
          sortOrder: idx,
          isPrimary: idx === 0,
        })),
      });
    }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
}

export async function setProductActive(id: string, isActive: boolean) {
  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
}
