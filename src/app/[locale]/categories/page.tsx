import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

export default async function CategoriesIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const isUk = locale === "uk";
  const t = await getTranslations("Categories");

  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
        {t("title")}
      </h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="group block rounded-sm border border-border bg-parchment/60 p-6 transition hover:border-embroidery hover:bg-linen/40"
          >
            <h2 className="font-[family-name:var(--font-display)] text-xl text-bark group-hover:text-embroidery">
              {isUk ? c.nameUk : c.nameEn}
            </h2>
            {c.children.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                {c.children.map((sc) => (isUk ? sc.nameUk : sc.nameEn)).join(" · ")}
              </p>
            )}
            <p className="mt-3 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
              {c._count.products} {isUk ? "товарів" : "items"}
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
