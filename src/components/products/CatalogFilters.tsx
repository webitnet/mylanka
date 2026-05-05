import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildHref } from "@/lib/searchParams";

type Category = {
  id: string;
  slug: string;
  nameUk: string;
  nameEn: string;
  parentId: string | null;
  children?: { id: string; slug: string; nameUk: string; nameEn: string }[];
};

export function CatalogFilters({
  basePath,
  searchParams,
  categories,
  materials,
  regions,
  locale,
  hideCategory = false,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  categories: Category[];
  materials: string[];
  regions: string[];
  locale: "uk" | "en";
  hideCategory?: boolean;
}) {
  const t = useTranslations("Filters");

  const usp = toUSP(searchParams);
  const selectedCategory = (Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category) ?? "";
  const selectedMaterials = pickAll(searchParams, "material");
  const selectedRegions = pickAll(searchParams, "region");
  const inStock = (searchParams.inStock === "1");
  const minPrice = (Array.isArray(searchParams.minPrice) ? searchParams.minPrice[0] : searchParams.minPrice) ?? "";
  const maxPrice = (Array.isArray(searchParams.maxPrice) ? searchParams.maxPrice[0] : searchParams.maxPrice) ?? "";

  return (
    <aside className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-[0.2em] text-bark">
          {t("title")}
        </h2>
        {(selectedCategory || selectedMaterials.length || selectedRegions.length || inStock || minPrice || maxPrice) && (
          <Link
            href={basePath}
            className="text-xs text-muted hover:text-terracotta transition"
          >
            {t("reset")}
          </Link>
        )}
      </div>

      {!hideCategory && (
        <FilterGroup label={t("category")}>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href={buildHref(basePath, usp, { category: null, page: null })}
                className={selectedCategory === "" ? "text-terracotta" : "text-bark hover:text-terracotta transition"}
              >
                {t("all")}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={buildHref(basePath, usp, { category: c.slug, page: null })}
                  className={selectedCategory === c.slug ? "text-terracotta" : "text-bark hover:text-terracotta transition"}
                >
                  {locale === "uk" ? c.nameUk : c.nameEn}
                </Link>
                {c.children && c.children.length > 0 && (
                  <ul className="ml-3 mt-1 space-y-1 border-l border-border pl-3 text-xs">
                    {c.children.map((sc) => (
                      <li key={sc.id}>
                        <Link
                          href={buildHref(basePath, usp, { category: sc.slug, page: null })}
                          className={selectedCategory === sc.slug ? "text-terracotta" : "text-muted hover:text-terracotta transition"}
                        >
                          {locale === "uk" ? sc.nameUk : sc.nameEn}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      <FilterGroup label={t("price")}>
        <form action={basePath} method="GET" className="flex items-center gap-2">
          {/* Preserve other query params as hidden inputs */}
          {Array.from(usp.entries())
            .filter(([k]) => k !== "minPrice" && k !== "maxPrice" && k !== "page")
            .map(([k, v], i) => (
              <input key={`${k}-${i}`} type="hidden" name={k} value={v} />
            ))}
          <input
            type="number"
            min="0"
            name="minPrice"
            defaultValue={minPrice}
            placeholder={t("priceFrom")}
            className="w-20 rounded-sm border border-border bg-cream px-2 py-1 text-sm focus:border-terracotta focus:outline-none"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            min="0"
            name="maxPrice"
            defaultValue={maxPrice}
            placeholder={t("priceTo")}
            className="w-20 rounded-sm border border-border bg-cream px-2 py-1 text-sm focus:border-terracotta focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-sm bg-bark px-2 py-1 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-cream hover:bg-terracotta transition"
          >
            {t("apply")}
          </button>
        </form>
      </FilterGroup>

      {materials.length > 0 && (
        <FilterGroup label={t("material")}>
          <ul className="space-y-1.5 text-sm">
            {materials.map((m) => {
              const checked = selectedMaterials.includes(m);
              const next = checked
                ? selectedMaterials.filter((x) => x !== m)
                : [...selectedMaterials, m];
              return (
                <li key={m}>
                  <Link
                    href={buildHref(basePath, usp, { material: next.length ? next : null, page: null })}
                    className="flex items-center gap-2 text-bark hover:text-terracotta transition"
                  >
                    <span className={`h-4 w-4 rounded-sm border ${checked ? "bg-terracotta border-terracotta" : "bg-cream border-border"}`} />
                    {m}
                  </Link>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}

      {regions.length > 0 && (
        <FilterGroup label={t("region")}>
          <ul className="space-y-1.5 text-sm">
            {regions.map((r) => {
              const checked = selectedRegions.includes(r);
              const next = checked
                ? selectedRegions.filter((x) => x !== r)
                : [...selectedRegions, r];
              return (
                <li key={r}>
                  <Link
                    href={buildHref(basePath, usp, { region: next.length ? next : null, page: null })}
                    className="flex items-center gap-2 text-bark hover:text-terracotta transition"
                  >
                    <span className={`h-4 w-4 rounded-sm border ${checked ? "bg-terracotta border-terracotta" : "bg-cream border-border"}`} />
                    {r}
                  </Link>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}

      <FilterGroup label="">
        <Link
          href={buildHref(basePath, usp, { inStock: inStock ? null : "1", page: null })}
          className="flex items-center gap-2 text-sm text-bark hover:text-terracotta transition"
        >
          <span className={`h-4 w-4 rounded-sm border ${inStock ? "bg-terracotta border-terracotta" : "bg-cream border-border"}`} />
          {t("inStock")}
        </Link>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <h3 className="mb-3 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.2em] text-muted">
          {label}
        </h3>
      )}
      {children}
    </div>
  );
}

function toUSP(p: Record<string, string | string[] | undefined>): URLSearchParams {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v == null) continue;
    if (Array.isArray(v)) for (const x of v) usp.append(k, x);
    else usp.set(k, v);
  }
  return usp;
}

function pickAll(p: Record<string, string | string[] | undefined>, key: string): string[] {
  const v = p[key];
  if (!v) return [];
  return Array.isArray(v) ? v : v.split(",").filter(Boolean);
}
