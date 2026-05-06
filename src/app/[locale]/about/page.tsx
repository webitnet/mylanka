import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { routing } from "@/i18n/routing";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Pages.about");
  const values = t.raw("values") as string[];

  return (
    <Container className="py-14 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-bark md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink/80">
          {t("intro")}
        </p>

        <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl text-bark">
          {t("missionTitle")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/80">
          {t("mission")}
        </p>

        <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl text-bark">
          {t("valuesTitle")}
        </h2>
        <ul className="mt-4 space-y-2 text-base text-ink/80">
          {values.map((v, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-embroidery" />
              {v}
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
