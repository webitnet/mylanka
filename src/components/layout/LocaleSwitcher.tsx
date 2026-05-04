"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className="flex items-center gap-1 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider"
      aria-label={t("switchLabel")}
    >
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center">
          {i > 0 && <span className="px-1 text-cream/40">/</span>}
          <button
            type="button"
            onClick={() => switchTo(loc)}
            disabled={isPending}
            className={
              loc === locale
                ? "text-gold"
                : "text-cream/70 hover:text-gold transition"
            }
            aria-current={loc === locale ? "true" : undefined}
          >
            {t(loc)}
          </button>
        </span>
      ))}
    </div>
  );
}
