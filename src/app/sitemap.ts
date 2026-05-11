import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const STATIC_PATHS = ["", "/products", "/categories", "/about", "/contact", "/shipping"];

function baseUrl(): string {
  return (process.env.PUBLIC_BASE_URL ?? "https://mylanka.com.ua").replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    entries.push({ url: `${base}${path}`, lastModified: now, changeFrequency: "weekly" });
    entries.push({ url: `${base}/en${path}`, lastModified: now, changeFrequency: "weekly" });
  }

  for (const c of categories) {
    entries.push({
      url: `${base}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
    });
    entries.push({
      url: `${base}/en/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
    });
  }

  for (const p of products) {
    entries.push({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    entries.push({
      url: `${base}/en/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
