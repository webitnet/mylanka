"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";

export function SearchClient({ initialQuery }: { initialQuery: string }) {
  const locale = useLocale() as "uk" | "en";
  const t = useTranslations("Search");
  const router = useRouter();

  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(initialQuery);

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=20`);
        const data = (await res.json()) as { items: ProductCardData[] };
        setItems(data.items ?? []);
        setSubmitted(q);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim().length >= 2) params.set("q", q.trim());
    router.replace(`/search${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="max-w-xl">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          autoFocus
          className="input text-base"
        />
      </form>

      <div className="mt-8">
        {q.trim().length < 2 ? (
          <p className="text-sm text-muted">{t("tooShort")}</p>
        ) : loading ? (
          <p className="text-sm text-muted">…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">{t("empty", { q: submitted })}</p>
        ) : (
          <>
            <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-muted">
              {t("resultsFor", { q: submitted })}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} locale={locale} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
