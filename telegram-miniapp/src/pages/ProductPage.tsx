import { useCallback, useEffect, useState } from "react";
import { getProduct, type ProductDetail } from "@/lib/api";
import { uah } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useMainButton } from "@/lib/mainButton";
import { haptic } from "@/lib/telegram";

export function ProductPage({
  slug,
  onAdded,
}: {
  slug: string;
  onAdded: () => void;
}) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { add } = useCart();

  useEffect(() => {
    setProduct(null);
    setError(null);
    getProduct(slug)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : "Помилка"));
  }, [slug]);

  const outOfStock = product?.trackStock && product.stock === 0;

  const handleAdd = useCallback(() => {
    if (!product || outOfStock) return;
    haptic("medium");
    add({
      slug: product.slug,
      nameUk: product.nameUk,
      priceUah: product.priceUah,
      image: product.images[0]?.url ?? null,
      stock: product.stock,
    });
    onAdded();
  }, [product, outOfStock, add, onAdded]);

  useMainButton({
    text: product ? (outOfStock ? "Немає в наявності" : `Додати в кошик · ${uah(product.priceUah)}`) : "…",
    onClick: handleAdd,
    enabled: !!product && !outOfStock,
  });

  if (error) {
    return (
      <div className="p-6 text-center text-sm text-embroidery">{error}</div>
    );
  }
  if (!product) {
    return <div className="p-6 text-center text-sm text-muted">Завантаження…</div>;
  }

  return (
    <div className="pb-32">
      {/* Images carousel — simple horizontal scroll */}
      <div className="flex snap-x snap-mandatory overflow-x-auto bg-linen/40">
        {product.images.length === 0 ? (
          <div className="aspect-square w-full grid place-items-center text-muted text-xs shrink-0">
            нема фото
          </div>
        ) : (
          product.images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.altUk ?? product.nameUk}
              className="aspect-square w-full object-cover shrink-0 snap-center"
            />
          ))
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-brass">
            {product.category.nameUk}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-bark">{product.nameUk}</h1>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-bark">{uah(product.priceUah)}</span>
          {product.comparePrice && product.comparePrice > product.priceUah && (
            <span className="text-sm text-muted line-through">{uah(product.comparePrice)}</span>
          )}
        </div>

        {product.shortDescUk && (
          <p className="text-sm text-bark/80 leading-relaxed">{product.shortDescUk}</p>
        )}

        <div className="rounded-md border border-border bg-linen/30 p-4 space-y-2 text-sm">
          <Detail label="SKU" value={product.sku} mono />
          {product.material && <Detail label="Матеріал" value={product.material} />}
          {product.region && <Detail label="Регіон" value={product.region} />}
          {product.artisan && <Detail label="Майстер" value={product.artisan} />}
          {product.weight && <Detail label="Вага" value={`${product.weight} г`} />}
          {product.dimensions && <Detail label="Габарити" value={product.dimensions} />}
        </div>

        <details className="rounded-md border border-border bg-linen/30">
          <summary className="px-4 py-3 text-[11px] uppercase tracking-wider text-bark cursor-pointer">
            Опис
          </summary>
          <p className="px-4 pb-4 text-sm text-bark/80 leading-relaxed whitespace-pre-wrap">
            {product.descUk}
          </p>
        </details>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <span className={`text-bark text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
