import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { order } = await searchParams;
  const t = await getTranslations("Checkout");

  return (
    <Container className="py-24 text-center">
      <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.3em] text-gold">
        ✓
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-bark md:text-4xl">
        {t("successTitle")}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-ink/80">
        {t("successMessage", { orderNumber: order ?? "—" })}
      </p>
      <div className="mt-8">
        <Link href="/products">
          <Button>{t("successCta")}</Button>
        </Link>
      </div>
    </Container>
  );
}
