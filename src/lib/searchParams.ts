import type { CatalogQuery, SortKey } from "./catalog";

const SORT_KEYS: SortKey[] = [
  "newest",
  "priceAsc",
  "priceDesc",
  "popular",
  "rating",
];

export function parseCatalogParams(
  searchParams: Record<string, string | string[] | undefined>,
  override?: Partial<CatalogQuery>,
): CatalogQuery {
  const get = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const getAll = (k: string): string[] => {
    const v = searchParams[k];
    if (!v) return [];
    return Array.isArray(v) ? v : v.split(",").filter(Boolean);
  };

  const minPriceUah = Number(get("minPrice"));
  const maxPriceUah = Number(get("maxPrice"));
  const sort = get("sort");
  const page = Number(get("page"));

  return {
    categorySlug: override?.categorySlug ?? get("category") ?? undefined,
    minPrice: Number.isFinite(minPriceUah) && minPriceUah > 0 ? minPriceUah * 100 : undefined,
    maxPrice: Number.isFinite(maxPriceUah) && maxPriceUah > 0 ? maxPriceUah * 100 : undefined,
    materials: getAll("material"),
    regions: getAll("region"),
    inStock: get("inStock") === "1",
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    ...override,
  };
}

export function buildHref(
  base: string,
  current: URLSearchParams,
  patch: Record<string, string | string[] | null | undefined>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(patch)) {
    next.delete(k);
    if (v == null || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) next.append(k, item);
    } else {
      next.set(k, v);
    }
  }
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

export function paramsToURLSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      for (const item of v) usp.append(k, item);
    } else {
      usp.set(k, v);
    }
  }
  return usp;
}
