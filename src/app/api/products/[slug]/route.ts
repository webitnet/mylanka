import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type ProductDetail = {
  slug: string;
  sku: string;
  nameUk: string;
  nameEn: string;
  descUk: string;
  descEn: string;
  shortDescUk: string | null;
  shortDescEn: string | null;
  priceUah: number;
  comparePrice: number | null;
  stock: number;
  trackStock: boolean;
  material: string | null;
  artisan: string | null;
  region: string | null;
  weight: number | null;
  dimensions: string | null;
  images: { url: string; altUk: string | null; altEn: string | null }[];
  category: { slug: string; nameUk: string; nameEn: string };
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true, altUk: true, altEn: true },
      },
      category: { select: { slug: true, nameUk: true, nameEn: true } },
    },
  });
  if (!product || !product.isActive) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Product not found" } },
      { status: 404 },
    );
  }
  const res: ProductDetail = {
    slug: product.slug,
    sku: product.sku,
    nameUk: product.nameUk,
    nameEn: product.nameEn,
    descUk: product.descUk,
    descEn: product.descEn,
    shortDescUk: product.shortDescUk,
    shortDescEn: product.shortDescEn,
    priceUah: product.priceUah,
    comparePrice: product.comparePrice,
    stock: product.stock,
    trackStock: product.trackStock,
    material: product.material,
    artisan: product.artisan,
    region: product.region,
    weight: product.weight,
    dimensions: product.dimensions,
    images: product.images,
    category: product.category,
  };
  return NextResponse.json(res, {
    headers: {
      "Cache-Control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
