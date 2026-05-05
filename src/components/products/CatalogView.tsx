import { useTranslations } from "next-intl";
import { CatalogFilters } from "./CatalogFilters";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { SortSelect } from "./SortSelect";
import {
  getDistinctMaterials,
  getDistinctRegions,
  listProducts,
  toCardData,
  type SortKey,
} from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/searchParams";
import { prisma } from "@/lib/prisma";

export async function CatalogView({
  basePath,
  searchParams,
  locale,
  fixedCategorySlug,
  hideCategoryFilter,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  locale: "uk" | "en";
  fixedCategorySlug?: string;
  hideCategoryFilter?: boolean;
}) {
  const query = parseCatalogParams(searchParams, fixedCategorySlug ? { categorySlug: fixedCategorySlug } : undefined);

  const [{ items, total, page, totalPages }, materials, regions, categoryTree] = await Promise.all([
    listProducts(query),
    getDistinctMaterials(),
    getDistinctRegions(),
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, slug: true, nameUk: true, nameEn: true },
        },
      },
    }),
  ]);

  return (
    <div className="grid gap-10 md:grid-cols-[18rem_1fr]">
      <div className="md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pr-2">
        <CatalogFilters
          basePath={basePath}
          searchParams={searchParams}
          categories={categoryTree}
          materials={materials}
          regions={regions}
          locale={locale}
          hideCategory={hideCategoryFilter}
        />
      </div>

      <div className="min-w-0">
        <CatalogToolbar
          total={total}
          sort={query.sort ?? "newest"}
          searchParams={searchParams}
        />
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={toCardData(p)} locale={locale} />
            ))}
          </div>
        )}
        <Pagination
          basePath={basePath}
          searchParams={searchParams}
          page={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

function CatalogToolbar({
  total,
  sort,
  searchParams,
}: {
  total: number;
  sort: SortKey;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = useTranslations("Catalog");
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{t("resultsCount", { count: total })}</p>
      <SortSelect current={sort} searchParams={searchParams} />
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("Catalog");
  return (
    <div className="mt-16 rounded-sm border border-dashed border-border bg-cream/60 p-10 text-center text-muted">
      {t("empty")}
    </div>
  );
}
