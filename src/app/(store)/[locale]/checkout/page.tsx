import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { routing } from "@/i18n/routing";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
        {t("title")}
      </h1>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </Container>
  );
}
