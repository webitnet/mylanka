import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageStub } from "@/components/ui/PageStub";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  return <PageStub title={t("contact")} />;
}
