import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import {
  ProductCard,
  type ProductCardData,
} from "@/components/products/ProductCard";

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });
  return rows.map((p) => ({
    slug: p.slug,
    nameUk: p.nameUk,
    nameEn: p.nameEn,
    priceUah: p.priceUah,
    comparePrice: p.comparePrice,
    stock: p.stock,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    imageUrl: p.images[0]?.url,
  }));
}

async function getNewArrivals(): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });
  return rows.map((p) => ({
    slug: p.slug,
    nameUk: p.nameUk,
    nameEn: p.nameEn,
    priceUah: p.priceUah,
    comparePrice: p.comparePrice,
    stock: p.stock,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    imageUrl: p.images[0]?.url,
  }));
}

async function getTopCategories() {
  return prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 8,
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const tBrand = await getTranslations("Brand");
  const [featured, newArrivals, categories] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getTopCategories(),
  ]);

  return (
    <>
      <section className="border-b border-border bg-wheat/50">
        <Container className="py-20 md:py-28 text-center">
          <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-[0.3em] text-muted">
            {tBrand("tagline")}
          </p>
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl text-bark sm:text-5xl md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink/75">
            {t("heroSubtitle")}
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link href="/products">
              <Button size="lg">{t("heroCtaShop")}</Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="secondary">
                {t("heroCtaStory")}
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {featured.length > 0 && (
        <section className="py-16 md:py-20">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-muted">
                  {t("featuredSubtitle")}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
                  {t("featuredTitle")}
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-muted hover:text-terracotta transition"
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  locale={locale as "uk" | "en"}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {categories.length > 0 && (
        <section className="border-y border-border bg-cream/50 py-16 md:py-20">
          <Container>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
              {t("categoriesTitle")}
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="group flex aspect-[3/2] items-end overflow-hidden rounded-sm bg-bark/90 p-4 text-cream transition hover:bg-terracotta"
                >
                  <span className="font-[family-name:var(--font-display)] text-xl">
                    {locale === "uk" ? c.nameUk : c.nameEn}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="py-16 md:py-20">
          <Container>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
              {t("newArrivalsTitle")}
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {newArrivals.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  locale={locale as "uk" | "en"}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
