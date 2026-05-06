import Link from "next/link";
import { listProductsForAdmin, listCategoriesFlat } from "@/lib/admin/products";
import { formatUah } from "@/lib/utils";

export const metadata = { title: "Товари" };
export const dynamic = "force-dynamic";

type SP = Promise<{
  q?: string;
  category?: string;
  status?: string;
  stock?: string;
  page?: string;
}>;

const STATUS_OPTIONS = [
  { v: "all", label: "Усі" },
  { v: "active", label: "Активні" },
  { v: "inactive", label: "Архівовані" },
];
const STOCK_OPTIONS = [
  { v: "all", label: "Будь-який залишок" },
  { v: "in", label: "В наявності" },
  { v: "low", label: "Низький залишок" },
  { v: "out", label: "Немає в наявності" },
];

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const categoryId = sp.category ?? "";
  const status = (sp.status as "all" | "active" | "inactive") ?? "all";
  const stock = (sp.stock as "all" | "in" | "low" | "out") ?? "all";
  const page = Number(sp.page ?? "1") || 1;

  const [{ items, total, pageCount }, categories] = await Promise.all([
    listProductsForAdmin({
      q,
      categoryId: categoryId || undefined,
      status,
      stock,
      page,
    }),
    listCategoriesFlat(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.3em] text-brass">
            Товари
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic text-bark">
            Каталог
          </h1>
          <p className="mt-1 text-sm text-muted">Всього: {total}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center rounded-sm bg-bark px-5 py-2.5 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-parchment hover:bg-embroidery"
        >
          Новий товар
        </Link>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-sm border border-border bg-linen/30 p-4 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto]"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Пошук за назвою / SKU / slug"
          className="input"
        />
        <select name="category" defaultValue={categoryId} className="input">
          <option value="">Усі категорії</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="input">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.label}
            </option>
          ))}
        </select>
        <select name="stock" defaultValue={stock} className="input">
          {STOCK_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm border border-bark px-4 py-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-bark hover:bg-bark hover:text-parchment"
        >
          Застосувати
        </button>
      </form>

      <div className="overflow-hidden rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-linen/40 text-left">
            <tr className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 w-16"></th>
              <th className="px-4 py-3">Назва</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">Ціна</th>
              <th className="px-4 py-3 text-right">Залишок</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  Нічого не знайдено
                </td>
              </tr>
            )}
            {items.map((p) => {
              const lowStock = p.trackStock && p.stock <= p.lowStockAt;
              const outOfStock = p.stock === 0;
              return (
                <tr key={p.id} className="hover:bg-linen/40">
                  <td className="px-4 py-2">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt={p.images[0].altUk ?? ""}
                        className="h-12 w-12 rounded-sm border border-border object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-sm border border-border bg-parchment" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium text-bark hover:text-embroidery"
                    >
                      {p.nameUk}
                    </Link>
                    <p className="text-xs text-muted">{p.category.nameUk}</p>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted">{p.sku}</td>
                  <td className="px-4 py-2 text-right text-bark">
                    {formatUah(p.priceUah, "uk")}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider ${
                      outOfStock
                        ? "text-embroidery"
                        : lowStock
                          ? "text-brass"
                          : "text-muted"
                    }`}
                  >
                    {p.trackStock ? p.stock : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {p.isActive ? (
                      <span className="rounded-sm bg-olive/10 px-2 py-0.5 text-xs text-olive">
                        Активний
                      </span>
                    ) : (
                      <span className="rounded-sm bg-muted/15 px-2 py-0.5 text-xs text-muted">
                        Архів
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          query={{ q, category: categoryId, status, stock }}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  query,
}: {
  page: number;
  pageCount: number;
  query: Record<string, string>;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <nav className="flex justify-center gap-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider">
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          className="rounded-sm border border-border px-3 py-2 text-bark hover:border-bark"
        >
          ← Назад
        </Link>
      )}
      <span className="px-3 py-2 text-muted">
        Сторінка {page} з {pageCount}
      </span>
      {page < pageCount && (
        <Link
          href={buildHref(page + 1)}
          className="rounded-sm border border-border px-3 py-2 text-bark hover:border-bark"
        >
          Далі →
        </Link>
      )}
    </nav>
  );
}
