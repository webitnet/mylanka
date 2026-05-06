"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cartCount, useCartStore } from "@/lib/cart/store";
import { useHydrated } from "@/lib/cart/useHydrated";

export function HeaderCartLink() {
  const t = useTranslations("Nav");
  const items = useCartStore((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <Link
      href="/cart"
      className="relative font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider hover:text-brass transition"
      aria-label={t("cart")}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-embroidery px-1 text-[10px] font-medium text-parchment">
          {count}
        </span>
      )}
    </Link>
  );
}
