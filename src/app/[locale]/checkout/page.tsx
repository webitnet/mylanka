import { setRequestLocale } from "next-intl/server";
import { PageStub } from "@/components/ui/PageStub";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageStub title="Checkout" />;
}
