import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { HeaderCartLink } from "@/components/cart/HeaderCartLink";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const tNav = useTranslations("Nav");
  const tBrand = useTranslations("Brand");

  return (
    <header className="sticky top-0 z-40 bg-bark text-cream">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl text-gold">
            {tBrand("name")}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider">
          <Link href="/products" className="hover:text-gold transition">
            {tNav("catalog")}
          </Link>
          <Link href="/categories" className="hover:text-gold transition">
            {tNav("categories")}
          </Link>
          <Link href="/about" className="hover:text-gold transition">
            {tNav("about")}
          </Link>
          <Link href="/shipping" className="hover:text-gold transition">
            {tNav("shipping")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider hover:text-gold transition"
            aria-label={tNav("search")}
          >
            <SearchIcon />
          </Link>
          <LocaleSwitcher />
          <HeaderCartLink />
        </div>
      </Container>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

