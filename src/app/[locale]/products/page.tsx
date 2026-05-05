import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { CatalogView } from "@/components/products/CatalogView";
import { routing } from "@/i18n/routing";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("Catalog");

  return (
    <Container className="py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
          {t("title")}
        </h1>
      </header>
      <CatalogView
        basePath="/products"
        searchParams={sp}
        locale={locale as "uk" | "en"}
      />
    </Container>
  );
}
