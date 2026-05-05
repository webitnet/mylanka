import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SearchClient } from "@/components/search/SearchClient";
import { routing } from "@/i18n/routing";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { q } = await searchParams;
  const t = await getTranslations("Search");

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
        {t("title")}
      </h1>
      <div className="mt-6">
        <SearchClient initialQuery={q ?? ""} />
      </div>
    </Container>
  );
}
