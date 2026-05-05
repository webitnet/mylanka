import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildHref } from "@/lib/searchParams";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  searchParams,
  page,
  totalPages,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  totalPages: number;
}) {
  const t = useTranslations("Catalog");
  if (totalPages <= 1) return null;

  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v == null || k === "page") continue;
    if (Array.isArray(v)) for (const x of v) usp.append(k, x);
    else usp.set(k, v);
  }

  const pages = pageRange(page, totalPages);

  return (
    <nav className="mt-12 flex items-center justify-center gap-2 text-sm">
      <Link
        href={buildHref(basePath, usp, { page: page > 1 ? String(page - 1) : null })}
        aria-disabled={page === 1}
        className={cn(
          "rounded-sm border border-border px-3 py-1.5 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider",
          page === 1 ? "pointer-events-none text-muted" : "text-bark hover:bg-bark hover:text-cream transition",
        )}
      >
        {t("prev")}
      </Link>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-muted">…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, usp, { page: p === 1 ? null : String(p) })}
            className={cn(
              "rounded-sm border px-3 py-1.5 font-[family-name:var(--font-ui)] text-xs",
              p === page
                ? "border-bark bg-bark text-cream"
                : "border-border text-bark hover:border-bark transition",
            )}
          >
            {p}
          </Link>
        ),
      )}
      <Link
        href={buildHref(basePath, usp, { page: page < totalPages ? String(page + 1) : null })}
        aria-disabled={page === totalPages}
        className={cn(
          "rounded-sm border border-border px-3 py-1.5 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider",
          page === totalPages ? "pointer-events-none text-muted" : "text-bark hover:bg-bark hover:text-cream transition",
        )}
      >
        {t("next")}
      </Link>
    </nav>
  );
}

function pageRange(current: number, total: number): (number | "…")[] {
  const window = 1;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - window && i <= current + window)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return pages;
}
