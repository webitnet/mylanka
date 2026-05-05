import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/forms/ContactForm";
import { routing } from "@/i18n/routing";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Pages.contact");

  return (
    <Container className="py-14 md:py-20">
      <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-bark md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-6 text-base text-ink/80">{t("intro")}</p>

          <dl className="mt-10 space-y-4 text-sm">
            <div>
              <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
                {t("address")}
              </dt>
              <dd className="text-bark">{t("addressValue")}</dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
                {t("phoneLabel")}
              </dt>
              <dd className="text-bark">{t("phoneValue")}</dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
                {t("emailLabel")}
              </dt>
              <dd className="text-bark">{t("emailValue")}</dd>
            </div>
          </dl>
        </div>
        <div>
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
