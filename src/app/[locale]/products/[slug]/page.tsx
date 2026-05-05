import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGallery } from "@/components/products/ProductGallery";
import { AddToCartStub } from "@/components/products/AddToCartStub";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { toCardData } from "@/lib/catalog";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return routing.locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      nameUk: true,
      nameEn: true,
      metaTitleUk: true,
      metaTitleEn: true,
      metaDescUk: true,
      metaDescEn: true,
      shortDescUk: true,
      shortDescEn: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });
  if (!product) return { title: "Not found" };

  const isUk = locale === "uk";
  const title = (isUk ? product.metaTitleUk : product.metaTitleEn) ?? (isUk ? product.nameUk : product.nameEn);
  const description = (isUk ? product.metaDescUk : product.metaDescEn) ?? (isUk ? product.shortDescUk : product.shortDescEn) ?? undefined;
  const image = product.images[0]?.url;

  return {
    title,
    description: description ?? undefined,
    openGraph: {
      title,
      description: description ?? undefined,
      images: image ? [image] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description ?? undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const isUk = locale === "uk";

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
  if (!product || !product.isActive) notFound();

  const t = await getTranslations("ProductDetail");
  const tProduct = await getTranslations("Product");

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  const name = isUk ? product.nameUk : product.nameEn;
  const desc = isUk ? product.descUk : product.descEn;
  const categoryName = isUk ? product.category.nameUk : product.category.nameEn;
  const onSale = product.comparePrice && product.comparePrice > product.priceUah;
  const outOfStock = product.stock <= 0;

  const galleryImages = product.images.map((img) => ({
    url: img.url,
    alt: (isUk ? img.altUk : img.altEn) ?? name,
  }));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: desc,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: (product.priceUah / 100).toFixed(2),
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isUk ? "Каталог" : "Catalog", item: "/products" },
      { "@type": "ListItem", position: 2, name: categoryName, item: `/categories/${product.category.slug}` },
      { "@type": "ListItem", position: 3, name },
    ],
  };

  return (
    <Container className="py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/products" className="hover:text-terracotta transition">{isUk ? "Каталог" : "Catalog"}</Link></li>
          <li aria-hidden>›</li>
          <li>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-terracotta transition">
              {categoryName}
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li className="text-bark">{name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={galleryImages} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.isNewArrival && <Badge variant="new">{tProduct("new")}</Badge>}
            {onSale && <Badge variant="sale">{tProduct("sale")}</Badge>}
            {product.isFeatured && !product.isNewArrival && !onSale && (
              <Badge variant="featured">{tProduct("featured")}</Badge>
            )}
          </div>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
            {name}
          </h1>

          <div className="mt-4">
            <Price amount={product.priceUah} comparePrice={product.comparePrice} className="text-2xl" />
          </div>

          {!outOfStock && product.stock <= product.lowStockAt && (
            <p className="mt-3 text-xs text-terracotta">
              {t("stockLeft", { n: product.stock })}
            </p>
          )}

          {(isUk ? product.shortDescUk : product.shortDescEn) && (
            <p className="mt-5 text-sm text-ink/80">
              {isUk ? product.shortDescUk : product.shortDescEn}
            </p>
          )}

          <AddToCartStub stock={product.stock} />

          <dl className="mt-10 grid grid-cols-2 gap-y-3 border-t border-border pt-6 text-sm">
            <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">{t("sku")}</dt>
            <dd className="text-bark">{product.sku}</dd>
            <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">{t("category")}</dt>
            <dd>
              <Link href={`/categories/${product.category.slug}`} className="text-bark hover:text-terracotta transition">
                {categoryName}
              </Link>
            </dd>
            {product.material && (
              <>
                <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">{t("material")}</dt>
                <dd className="text-bark">{product.material}</dd>
              </>
            )}
            {product.region && (
              <>
                <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">{t("region")}</dt>
                <dd className="text-bark">{product.region}</dd>
              </>
            )}
            {product.artisan && (
              <>
                <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">{t("artisan")}</dt>
                <dd className="text-bark">{product.artisan}</dd>
              </>
            )}
            {product.weight && (
              <>
                <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">{t("weight")}</dt>
                <dd className="text-bark">{product.weight} g</dd>
              </>
            )}
            {product.dimensions && (
              <>
                <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">{t("dimensions")}</dt>
                <dd className="text-bark">{product.dimensions}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-bark md:text-3xl">
          {t("description")}
        </h2>
        <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-ink/80">
          {desc}
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-bark md:text-3xl">
            {t("related")}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={toCardData(p)} locale={locale as "uk" | "en"} />
            ))}
          </div>
        </section>
      )}

    </Container>
  );
}
