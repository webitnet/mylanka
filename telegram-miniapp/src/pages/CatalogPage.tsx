import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { haptic } from "@/lib/telegram";
import { useCart } from "@/lib/cart";
import { listProducts, type ProductListItem } from "@/lib/api";

export function CatalogPage({
  onOpenProduct,
  onOpenCart,
}: {
  onOpenProduct: (slug: string) => void;
  onOpenCart: () => void;
}) {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const { count } = useCart();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timeout = setTimeout(async () => {
      try {
        const res = await listProducts({ q: q.trim() || undefined });
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Помилка завантаження");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200); // debounce
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [q]);

  return (
    <div className="min-h-full pb-8">
      <header className="sticky top-0 z-10 bg-parchment/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-brass">Mylanka</p>
            <h1 className="text-lg font-semibold text-bark">Каталог</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("light");
              onOpenCart();
            }}
            className="relative h-10 w-10 grid place-items-center rounded-md border border-border bg-linen/40"
            aria-label="Кошик"
          >
            🛒
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-embroidery text-parchment text-[10px] font-semibold grid place-items-center px-1">
                {count}
              </span>
            )}
          </button>
        </div>
        <div className="mt-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук за назвою…"
            className="input-mini"
          />
        </div>
      </header>

      <main className="px-4 pt-4">
        {error && (
          <p className="rounded-md border border-embroidery/40 bg-embroidery/10 px-3 py-2 text-xs text-bark mb-4">
            {error}
          </p>
        )}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-linen/40 overflow-hidden animate-pulse">
                <div className="aspect-square bg-parchment" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 bg-parchment rounded" />
                  <div className="h-4 w-1/3 bg-parchment rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted py-12">Нічого не знайдено</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {items.map((p) => (
              <li key={p.slug}>
                <ProductCard
                  product={p}
                  onClick={() => {
                    haptic("light");
                    onOpenProduct(p.slug);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
