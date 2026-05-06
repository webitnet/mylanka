import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const tNav = useTranslations("Nav");
  const tBrand = useTranslations("Brand");
  const tFooter = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-bark text-parchment/80">
      <Container className="grid gap-12 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-3xl text-brass"
          >
            {tBrand("name")}
          </Link>
          <p className="mt-3 max-w-sm text-sm text-parchment/70">
            {tBrand("tagline")}
          </p>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.2em] text-brass">
            {tNav("catalog")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-brass transition">{tNav("catalog")}</Link></li>
            <li><Link href="/categories" className="hover:text-brass transition">{tNav("categories")}</Link></li>
            <li><Link href="/search" className="hover:text-brass transition">{tNav("search")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.2em] text-brass">
            {tNav("about")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-brass transition">{tNav("about")}</Link></li>
            <li><Link href="/contact" className="hover:text-brass transition">{tNav("contact")}</Link></li>
            <li><Link href="/shipping" className="hover:text-brass transition">{tNav("shipping")}</Link></li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-parchment/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-parchment/60 md:flex-row">
          <span>{tFooter("rights", { year })}</span>
          <span className="font-[family-name:var(--font-ui)] uppercase tracking-wider">
            {tFooter("madeIn")}
          </span>
        </Container>
      </div>
    </footer>
  );
}
