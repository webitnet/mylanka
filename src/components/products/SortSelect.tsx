"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { SortKey } from "@/lib/catalog";

const SORT_KEYS: SortKey[] = ["newest", "priceAsc", "priceDesc", "popular", "rating"];

export function SortSelect({
  current,
  searchParams,
}: {
  current: SortKey;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = useTranslations("Sort");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "sort" || k === "page") continue;
      if (Array.isArray(v)) for (const x of v) usp.append(k, x);
      else if (v) usp.set(k, v);
    }
    if (e.target.value !== "newest") usp.set("sort", e.target.value);
    startTransition(() => {
      router.push(`${pathname}${usp.toString() ? `?${usp}` : ""}`);
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="font-[family-name:var(--font-ui)] uppercase tracking-wider text-muted">
        {t("label")}:
      </span>
      <select
        value={current}
        onChange={onChange}
        disabled={isPending}
        className="rounded-sm border border-border bg-cream px-2 py-1.5 text-sm text-bark focus:border-terracotta focus:outline-none"
      >
        {SORT_KEYS.map((k) => (
          <option key={k} value={k}>
            {t(k)}
          </option>
        ))}
      </select>
    </label>
  );
}
