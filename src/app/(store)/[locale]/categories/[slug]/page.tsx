import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { CatalogView } from "@/components/products/CatalogView";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return routing.locales.flatMap((locale) =>
    cats.map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await prisma.category.findUnique({
    where: { slug },
    select: { nameUk: true, nameEn: true, descUk: true, descEn: true },
  });
  if (!cat) return { title: "Not found" };
  const isUk = locale === "uk";
  return {
    title: isUk ? cat.nameUk : cat.nameEn,
    description: (isUk ? cat.descUk : cat.descEn) ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;
  const isUk = locale === "uk";

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!category || !category.isActive) notFound();

  const name = isUk ? category.nameUk : category.nameEn;

  return (
    <Container className="py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/categories" className="hover:text-embroidery transition">{isUk ? "Категорії" : "Categories"}</Link></li>
          {category.parent && (
            <>
              <li aria-hidden>›</li>
              <li>
                <Link href={`/categories/${category.parent.slug}`} className="hover:text-embroidery transition">
                  {isUk ? category.parent.nameUk : category.parent.nameEn}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>›</li>
          <li className="text-bark">{name}</li>
        </ol>
      </nav>

      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
          {name}
        </h1>
        {category.children.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {category.children.map((sc) => (
              <li key={sc.id}>
                <Link
                  href={`/categories/${sc.slug}`}
                  className="rounded-full border border-border bg-parchment px-3 py-1 text-xs text-bark hover:border-bark transition"
                >
                  {isUk ? sc.nameUk : sc.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <CatalogView
        basePath={`/categories/${category.slug}`}
        searchParams={sp}
        locale={locale as "uk" | "en"}
        fixedCategorySlug={category.slug}
        hideCategoryFilter
      />
    </Container>
  );
}
